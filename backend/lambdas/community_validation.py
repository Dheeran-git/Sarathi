"""
community_validation — Delivery confirmation and governance performance tracking.

Routes:
  POST /community/confirm                        — citizen confirms benefit receipt
  POST /community/feedback                       — citizen provides feedback on benefit quality
  GET  /community/heatmap/{panchayatId}          — delivery heatmap data
  GET  /community/governance-index/{panchayatId} — governance performance index

Uses DynamoDB (SarathiCommunityValidation).
Uses Comprehend for sentiment analysis of text feedback.
Calculates governance index from delivery rate, response time, citizen satisfaction.
Includes CORS headers and structured logging.
"""
import json
import os
import time
import uuid
import boto3
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

REGION = 'us-east-1'
VALIDATION_TABLE = os.environ.get('VALIDATION_TABLE', 'SarathiCommunityValidation')
CITIZENS_TABLE = os.environ.get('CITIZENS_TABLE', 'SarathiCitizens')

dynamodb = boto3.resource('dynamodb', region_name=REGION)
validation_table = dynamodb.Table(VALIDATION_TABLE)
citizens_table = dynamodb.Table(CITIZENS_TABLE)
comprehend = boto3.client('comprehend', region_name=REGION)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        'Content-Type': 'application/json',
    }


def _response(status, body):
    return {
        'statusCode': status,
        'headers': cors_headers(),
        'body': json.dumps(body, cls=DecimalEncoder),
    }


def _convert_floats(obj):
    """Recursively convert floats to Decimal for DynamoDB."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _convert_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_floats(i) for i in obj]
    return obj


# ---------------------------------------------------------------------------
# Sentiment analysis
# ---------------------------------------------------------------------------

def _analyze_sentiment(text):
    """Use Comprehend to analyze sentiment of feedback text."""
    if not text or len(text.strip()) < 5:
        return {'sentiment': 'NEUTRAL', 'confidence': 0.0}

    try:
        # Detect language first
        lang_resp = comprehend.detect_dominant_language(Text=text[:5000])
        languages = lang_resp.get('Languages', [])
        lang_code = languages[0]['LanguageCode'] if languages else 'en'

        # Comprehend supports limited languages for sentiment
        supported_langs = {'en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW'}
        if lang_code not in supported_langs:
            lang_code = 'en'

        resp = comprehend.detect_sentiment(Text=text[:5000], LanguageCode=lang_code)
        sentiment = resp.get('Sentiment', 'NEUTRAL')
        scores = resp.get('SentimentScore', {})
        confidence = max(scores.values()) if scores else 0.0

        print(json.dumps({
            'comprehend_invocation': True,
            'sentiment': sentiment,
            'confidence': round(confidence, 3),
            'languageDetected': lang_code,
        }))

        return {
            'sentiment': sentiment,
            'confidence': round(confidence, 3),
            'scores': {k: round(v, 3) for k, v in scores.items()},
            'language': lang_code,
        }
    except Exception as e:
        print(f"[WARN] Comprehend sentiment analysis failed: {e}")
        return {'sentiment': 'NEUTRAL', 'confidence': 0.0}


# ---------------------------------------------------------------------------
# Confirm benefit receipt
# ---------------------------------------------------------------------------

def _handle_confirm(body):
    """POST /community/confirm — citizen confirms receiving a benefit."""
    citizen_id = str(body.get('citizenId', '')).strip()
    scheme_id = str(body.get('schemeId', '')).strip()
    panchayat_id = str(body.get('panchayatId', '')).strip()

    if not citizen_id or not scheme_id:
        return _response(400, {'error': 'citizenId and schemeId are required'})

    confirmation_id = f"conf-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    item = {
        'recordId': confirmation_id,
        'panchayatId': panchayat_id or 'unknown',
        'citizenId': citizen_id,
        'schemeId': scheme_id,
        'recordType': 'confirmation',
        'confirmed': True,
        'benefitAmount': body.get('benefitAmount'),
        'benefitDate': body.get('benefitDate', now_iso[:10]),
        'confirmationMethod': body.get('method', 'app'),
        'createdAt': now_iso,
    }
    item = _convert_floats(item)

    try:
        validation_table.put_item(Item=item)
    except Exception as e:
        print(f"[ERR] Failed to store confirmation: {e}")
        return _response(500, {'error': 'Failed to store confirmation', 'message': str(e)})

    print(json.dumps({
        'confirmation_stored': True,
        'confirmationId': confirmation_id,
        'citizenId': citizen_id,
        'schemeId': scheme_id,
        'panchayatId': panchayat_id,
        'timestamp': now_iso,
    }))

    return _response(200, {
        'confirmationId': confirmation_id,
        'citizenId': citizen_id,
        'schemeId': scheme_id,
        'confirmed': True,
        'message': 'Benefit receipt confirmed successfully. Thank you for your feedback.',
        'createdAt': now_iso,
    })


# ---------------------------------------------------------------------------
# Submit feedback
# ---------------------------------------------------------------------------

def _handle_feedback(body):
    """POST /community/feedback — citizen provides feedback on benefit quality."""
    citizen_id = str(body.get('citizenId', '')).strip()
    scheme_id = str(body.get('schemeId', '')).strip()
    panchayat_id = str(body.get('panchayatId', '')).strip()
    feedback_text = str(body.get('feedbackText', '')).strip()
    rating = body.get('rating')  # 1-5 numeric

    if not citizen_id:
        return _response(400, {'error': 'citizenId is required'})
    if not feedback_text and rating is None:
        return _response(400, {'error': 'feedbackText or rating is required'})

    feedback_id = f"fb-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Sentiment analysis on feedback text
    sentiment_result = {}
    if feedback_text:
        sentiment_result = _analyze_sentiment(feedback_text)

    # Validate rating
    if rating is not None:
        try:
            rating = max(1, min(5, int(rating)))
        except (ValueError, TypeError):
            rating = None

    item = {
        'recordId': feedback_id,
        'panchayatId': panchayat_id or 'unknown',
        'citizenId': citizen_id,
        'schemeId': scheme_id or 'general',
        'recordType': 'feedback',
        'feedbackText': feedback_text,
        'rating': rating,
        'sentiment': sentiment_result.get('sentiment', 'NEUTRAL'),
        'sentimentConfidence': Decimal(str(sentiment_result.get('confidence', 0.0))),
        'sentimentScores': _convert_floats(sentiment_result.get('scores', {})),
        'createdAt': now_iso,
    }
    item = _convert_floats(item)

    # Remove None values before storing
    item = {k: v for k, v in item.items() if v is not None}

    try:
        validation_table.put_item(Item=item)
    except Exception as e:
        print(f"[ERR] Failed to store feedback: {e}")
        return _response(500, {'error': 'Failed to store feedback', 'message': str(e)})

    print(json.dumps({
        'feedback_stored': True,
        'feedbackId': feedback_id,
        'citizenId': citizen_id,
        'sentiment': sentiment_result.get('sentiment', 'NEUTRAL'),
        'rating': rating,
        'panchayatId': panchayat_id,
        'timestamp': now_iso,
    }))

    return _response(200, {
        'feedbackId': feedback_id,
        'citizenId': citizen_id,
        'schemeId': scheme_id,
        'sentiment': sentiment_result,
        'rating': rating,
        'message': 'Thank you for your feedback. Your input helps improve welfare delivery.',
        'createdAt': now_iso,
    })


# ---------------------------------------------------------------------------
# Delivery heatmap
# ---------------------------------------------------------------------------

def _handle_heatmap(panchayat_id):
    """GET /community/heatmap/{panchayatId} — delivery confirmation heatmap data."""
    try:
        # Query confirmations for this panchayat
        resp = validation_table.query(
            IndexName='panchayatId-createdAt-index',
            KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
        )
        records = resp.get('Items', [])
        while 'LastEvaluatedKey' in resp:
            resp = validation_table.query(
                IndexName='panchayatId-createdAt-index',
                KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
                ExclusiveStartKey=resp['LastEvaluatedKey'],
            )
            records.extend(resp.get('Items', []))

        confirmations = [r for r in records if r.get('recordType') == 'confirmation']
        feedbacks = [r for r in records if r.get('recordType') == 'feedback']

        # Group confirmations by scheme
        by_scheme = {}
        for conf in confirmations:
            sid = conf.get('schemeId', 'unknown')
            by_scheme.setdefault(sid, {'confirmed': 0, 'totalValue': 0})
            by_scheme[sid]['confirmed'] += 1
            by_scheme[sid]['totalValue'] += int(conf.get('benefitAmount', 0) or 0)

        # Group confirmations by month
        by_month = {}
        for conf in confirmations:
            month_key = conf.get('createdAt', '')[:7]  # YYYY-MM
            if month_key:
                by_month.setdefault(month_key, 0)
                by_month[month_key] += 1

        # Sentiment summary from feedback
        sentiment_counts = {'POSITIVE': 0, 'NEGATIVE': 0, 'NEUTRAL': 0, 'MIXED': 0}
        for fb in feedbacks:
            s = fb.get('sentiment', 'NEUTRAL')
            sentiment_counts[s] = sentiment_counts.get(s, 0) + 1

        # Average rating
        ratings = [int(fb.get('rating', 0)) for fb in feedbacks if fb.get('rating')]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0

        return _response(200, {
            'panchayatId': panchayat_id,
            'heatmap': {
                'byScheme': by_scheme,
                'byMonth': by_month,
                'totalConfirmations': len(confirmations),
                'totalFeedbacks': len(feedbacks),
            },
            'sentimentSummary': sentiment_counts,
            'averageRating': avg_rating,
            'generatedAt': datetime.now(timezone.utc).isoformat(),
        })

    except Exception as e:
        print(f"[ERR] Heatmap query failed: {e}")
        return _response(500, {'error': 'Internal server error', 'message': str(e)})


# ---------------------------------------------------------------------------
# Governance performance index
# ---------------------------------------------------------------------------

def _handle_governance_index(panchayat_id):
    """
    GET /community/governance-index/{panchayatId}
    Calculate governance performance index from:
      - Delivery rate (% of eligible citizens who confirmed receipt)
      - Response time (average time from application to benefit receipt)
      - Citizen satisfaction (average rating + sentiment score)
    """
    try:
        # Fetch community validation records
        resp = validation_table.query(
            IndexName='panchayatId-createdAt-index',
            KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
        )
        records = resp.get('Items', [])
        while 'LastEvaluatedKey' in resp:
            resp = validation_table.query(
                IndexName='panchayatId-createdAt-index',
                KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
                ExclusiveStartKey=resp['LastEvaluatedKey'],
            )
            records.extend(resp.get('Items', []))

        confirmations = [r for r in records if r.get('recordType') == 'confirmation']
        feedbacks = [r for r in records if r.get('recordType') == 'feedback']

        # --- Delivery rate ---
        # Count unique citizens who confirmed vs total citizens in panchayat
        confirmed_citizens = set(c.get('citizenId', '') for c in confirmations)
        total_citizens = 0
        try:
            cit_resp = citizens_table.query(
                IndexName='panchayatId-updatedAt-index',
                KeyConditionExpression=Key('panchayatId').eq(panchayat_id),
                Select='COUNT',
            )
            total_citizens = cit_resp.get('Count', 0)
        except Exception as e:
            print(f"[WARN] Could not count citizens for {panchayat_id}: {e}")

        delivery_rate = (
            round(len(confirmed_citizens) / total_citizens * 100, 1)
            if total_citizens > 0 else 0.0
        )

        # --- Response time ---
        # Estimate from confirmation timestamps (days since start of current quarter)
        response_times = []
        for conf in confirmations:
            benefit_date = conf.get('benefitDate', '')
            created_at = conf.get('createdAt', '')
            if benefit_date and created_at:
                try:
                    bd = datetime.fromisoformat(benefit_date.replace('Z', '+00:00'))
                    ca = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    diff_days = abs((ca - bd).days)
                    response_times.append(diff_days)
                except (ValueError, TypeError):
                    pass

        avg_response_days = (
            round(sum(response_times) / len(response_times), 1)
            if response_times else 0.0
        )

        # Response time score (lower is better): 0 days = 100, 30+ days = 0
        response_score = max(0, min(100, round(100 - (avg_response_days / 30) * 100, 1)))

        # --- Citizen satisfaction ---
        ratings = [int(fb.get('rating', 0)) for fb in feedbacks if fb.get('rating')]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
        rating_score = round(avg_rating / 5 * 100, 1) if avg_rating > 0 else 50.0

        # Sentiment score
        positive_count = sum(
            1 for fb in feedbacks if fb.get('sentiment') == 'POSITIVE'
        )
        total_feedback = len(feedbacks)
        sentiment_score = (
            round(positive_count / total_feedback * 100, 1)
            if total_feedback > 0 else 50.0
        )

        satisfaction_score = round((rating_score + sentiment_score) / 2, 1)

        # --- Composite governance index ---
        # Weighted: delivery 40%, response time 30%, satisfaction 30%
        governance_index = round(
            delivery_rate * 0.4 +
            response_score * 0.3 +
            satisfaction_score * 0.3,
            1
        )

        # Grade
        if governance_index >= 80:
            grade = 'A'
            grade_label = 'Excellent'
        elif governance_index >= 60:
            grade = 'B'
            grade_label = 'Good'
        elif governance_index >= 40:
            grade = 'C'
            grade_label = 'Needs Improvement'
        elif governance_index >= 20:
            grade = 'D'
            grade_label = 'Poor'
        else:
            grade = 'F'
            grade_label = 'Critical'

        print(json.dumps({
            'governance_index_calculated': True,
            'panchayatId': panchayat_id,
            'index': governance_index,
            'grade': grade,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }))

        return _response(200, {
            'panchayatId': panchayat_id,
            'governanceIndex': governance_index,
            'grade': grade,
            'gradeLabel': grade_label,
            'components': {
                'deliveryRate': {
                    'score': delivery_rate,
                    'weight': 0.4,
                    'confirmedCitizens': len(confirmed_citizens),
                    'totalCitizens': total_citizens,
                },
                'responseTime': {
                    'score': response_score,
                    'weight': 0.3,
                    'avgDays': avg_response_days,
                    'samplesCount': len(response_times),
                },
                'citizenSatisfaction': {
                    'score': satisfaction_score,
                    'weight': 0.3,
                    'avgRating': avg_rating,
                    'ratingScore': rating_score,
                    'sentimentScore': sentiment_score,
                    'totalFeedbacks': total_feedback,
                    'positiveCount': positive_count,
                },
            },
            'totalConfirmations': len(confirmations),
            'totalFeedbacks': total_feedback,
            'calculatedAt': datetime.now(timezone.utc).isoformat(),
        })

    except Exception as e:
        print(f"[ERR] Governance index calculation failed: {e}")
        return _response(500, {'error': 'Internal server error', 'message': str(e)})


# ---------------------------------------------------------------------------
# Lambda handler
# ---------------------------------------------------------------------------

def lambda_handler(event, context):
    method = event.get('httpMethod', '')
    path = event.get('path', '') or event.get('resource', '')
    path_params = event.get('pathParameters') or {}

    if method == 'OPTIONS':
        return _response(200, {})

    try:
        # POST /community/confirm
        if method == 'POST' and 'confirm' in path:
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            return _handle_confirm(body)

        # POST /community/feedback
        if method == 'POST' and 'feedback' in path:
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
            return _handle_feedback(body)

        # GET /community/heatmap/{panchayatId}
        if method == 'GET' and 'heatmap' in path:
            panchayat_id = path_params.get('panchayatId', '').strip()
            if not panchayat_id:
                return _response(400, {'error': 'panchayatId is required'})
            return _handle_heatmap(panchayat_id)

        # GET /community/governance-index/{panchayatId}
        if method == 'GET' and 'governance-index' in path:
            panchayat_id = path_params.get('panchayatId', '').strip()
            if not panchayat_id:
                return _response(400, {'error': 'panchayatId is required'})
            return _handle_governance_index(panchayat_id)

        return _response(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f"[ERR] community_validation: {e}")
        return _response(500, {'error': 'Internal server error', 'message': str(e)})
