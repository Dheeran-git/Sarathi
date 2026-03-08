"""
digital_twin — POST /twin
Generates 36-month income projection pathways AND predictive 3-5 year life-event timeline.

Two capabilities:
1. Income projection: 3 pathways (best/medium/minimum) based on matched schemes
2. Predictive twin: Life-event prediction engine — forecasts education completion,
   retirement, health changes, and upcoming eligibility windows.
"""
import json
import os
import boto3
from decimal import Decimal
from datetime import datetime, timezone

REGION = os.environ.get('AWS_REGION', 'us-east-1')
BEDROCK_MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')

bedrock = boto3.client('bedrock-runtime', region_name=REGION)


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


def _generate_income_pathways(current_income, matched_schemes):
    """Generate 36-month income projection pathways."""
    if current_income < 0:
        current_income = 0
    if not isinstance(matched_schemes, list):
        matched_schemes = []

    poverty_line = 8000  # rupees per month

    # Sort schemes by annual benefit ascending (take easiest/smallest first)
    schemes_sorted = sorted(matched_schemes, key=lambda x: int(x.get('annualBenefit', 0)))

    def generate_pathway(schemes_to_use):
        income = current_income
        data_points = []
        scheme_index = 0
        months_per_scheme = max(2, 36 // max(len(schemes_to_use), 1))

        for month in range(1, 37):
            if scheme_index < len(schemes_to_use) and month % months_per_scheme == 1:
                scheme = schemes_to_use[scheme_index]
                income += int(scheme.get('annualBenefit', 0)) / 12
                scheme_name_en = scheme.get('nameEnglish', scheme.get('name', ''))
                scheme_name_hi = scheme.get('nameHindi', scheme_name_en)
                scheme_index += 1
            else:
                scheme_name_en = None
                scheme_name_hi = None

            data_points.append({
                'month': month,
                'income': round(income),
                'scheme': scheme_name_en,
                'schemeHindi': scheme_name_hi,
            })
        return data_points

    def months_to_exit(pathway):
        for point in pathway:
            if point['income'] >= poverty_line:
                return point['month']
        return None

    best_path = generate_pathway(schemes_sorted)
    medium_path = generate_pathway(schemes_sorted[:max(1, len(schemes_sorted) // 2)])
    min_path = generate_pathway(schemes_sorted[:3])

    return {
        'currentMonthlyIncome': current_income,
        'povertyLine': poverty_line,
        'pathways': {
            'best': best_path,
            'medium': medium_path,
            'minimum': min_path,
        },
        'monthsToPovertyExit': {
            'best': months_to_exit(best_path),
            'medium': months_to_exit(medium_path),
            'minimum': months_to_exit(min_path),
        },
    }


def _predict_life_events(citizen_profile, matched_schemes):
    """
    Predictive 3-5 year life-event engine.
    Models household trajectory based on demographics:
    - Education completion for children
    - Retirement approaching
    - Age-out from schemes
    - Upcoming eligibility windows (e.g., daughter turns 18 -> higher education scholarships)
    """
    events = []
    now = datetime.now(timezone.utc)
    current_year = now.year

    age = int(citizen_profile.get('age', 0) or 0)
    gender = str(citizen_profile.get('gender', '')).lower()
    persona = str(citizen_profile.get('persona', '')).lower()
    is_widow = str(citizen_profile.get('isWidow', '')).lower() in ('true', '1', 'yes')
    children = citizen_profile.get('children', [])
    income = int(citizen_profile.get('income', 0) or citizen_profile.get('monthlyIncome', 0) or 0)

    # Age-based life event predictions
    if age > 0:
        # Approaching senior citizen age (60)
        if 55 <= age < 60:
            years_to_60 = 60 - age
            events.append({
                'year': current_year + years_to_60,
                'month': now.month,
                'event': 'Senior Citizen Status',
                'eventHi': 'वरिष्ठ नागरिक स्थिति',
                'description': f'You will turn 60 in {years_to_60} year(s). New pension schemes will become available.',
                'descriptionHi': f'{years_to_60} वर्ष में आप 60 के हो जाएंगे। नई पेंशन योजनाएं उपलब्ध होंगी।',
                'type': 'eligibility_window',
                'impact': 'positive',
                'schemes': ['IGNOAPS', 'IGNWPS', 'State Pension'],
            })

        # Approaching 65 (additional elderly benefits)
        if 60 <= age < 65:
            years_to_65 = 65 - age
            events.append({
                'year': current_year + years_to_65,
                'month': now.month,
                'event': 'Enhanced Elderly Benefits',
                'eventHi': 'उन्नत वृद्धा लाभ',
                'description': f'At 65, you may qualify for enhanced pension rates.',
                'descriptionHi': '65 की उम्र में बढ़ी हुई पेंशन दरें मिल सकती हैं।',
                'type': 'eligibility_window',
                'impact': 'positive',
                'schemes': ['Enhanced IGNOAPS'],
            })

    # Career & Milestone predictions
    if 20 <= age <= 30:
        events.append({
            'year': current_year + 2,
            'month': 6,
            'event': 'Career Milestone / Skill Upgrade',
            'eventHi': 'कैरियर मील का पत्थर',
            'description': 'Typical window for professional upskilling. Check Skill India & Digital India certificate courses.',
            'descriptionHi': 'कौशल विकास और डिजिटल इंडिया पाठ्यक्रमों के लिए सही समय।',
            'type': 'milestone',
            'impact': 'positive',
            'schemes': ['Skill India', 'Digital India'],
        })

    # Health & Resilience (General)
    events.append({
        'year': current_year + 1,
        'month': now.month,
        'event': 'Annual Health Checkup Window',
        'eventHi': 'वार्षिक स्वास्थ्य जांच',
        'description': 'Utilize free health checkups at local PHC through Ayushman Bharat. Preventive care milestone.',
        'descriptionHi': 'आयुष्मान भारत के माध्यम से स्थानीय PHC में मुफ्त स्वास्थ्य जांच का उपयोग करें।',
        'type': 'milestone',
        'impact': 'positive',
        'schemes': ['Ayushman Bharat'],
    })

    # Financial Review
    events.append({
        'year': current_year,
        'month': 12,
        'event': 'Year-end Financial Review',
        'eventHi': 'वर्ष के अंत में वित्तीय समीक्षा',
        'description': 'Review your scheme applications and savings. Ensure PMJDY account is active.',
        'descriptionHi': 'अपनी योजना अनुप्रयोगों और बचत की समीक्षा करें। PMJDY खाता सक्रिय रखें।',
        'type': 'seasonal',
        'impact': 'positive',
        'schemes': ['PMJDY'],
    })

    # Sort events by year and month
    events.sort(key=lambda e: (e.get('year', 9999), e.get('month', 1)))

    return events


def _generate_ai_narrative(citizen_profile, events, pathways):
    """Use Bedrock to generate a narrative summary of the twin prediction."""
    try:
        age = citizen_profile.get('age', 'unknown')
        name = citizen_profile.get('name', 'Citizen')
        persona = citizen_profile.get('persona', 'citizen')

        event_summaries = []
        for e in events[:8]:
            event_summaries.append(f"- {e['year']}: {e['event']} ({e['description'][:80]})")

        prompt = (
            f"You are Sarathi, a welfare advisor. Write a 2-3 sentence future outlook for {name}, "
            f"age {age}, occupation: {persona}.\n\n"
            f"Key predicted events:\n" + '\n'.join(event_summaries) + "\n\n"
            f"Write in simple, encouraging language. Mention the most important upcoming opportunity."
        )

        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                'messages': [{'role': 'user', 'content': [{'text': prompt}]}],
                'inferenceConfig': {'maxTokens': 200, 'temperature': 0.4},
            }),
        )
        result = json.loads(response['body'].read())
        return result.get('output', {}).get('message', {}).get('content', [{}])[0].get('text', '')
    except Exception as e:
        print(f"[WARN] AI narrative generation failed: {e}")
        return ''


def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        current_income = int(body.get('monthlyIncome', 2000))
        matched_schemes = body.get('matchedSchemes', [])
        citizen_profile = body.get('citizenProfile', {})
        include_predictions = body.get('includePredictions', True)

        if current_income < 0:
            current_income = 0
        if not isinstance(matched_schemes, list):
            matched_schemes = []

        # Generate income pathways
        pathway_data = _generate_income_pathways(current_income, matched_schemes)

        # Generate predictive life events
        predicted_events = []
        ai_narrative = ''
        if include_predictions and citizen_profile:
            predicted_events = _predict_life_events(citizen_profile, matched_schemes)
            if predicted_events:
                ai_narrative = _generate_ai_narrative(
                    citizen_profile, predicted_events, pathway_data['pathways']
                )

        result = {
            **pathway_data,
            'predictedEvents': predicted_events,
            'aiNarrative': ai_narrative,
        }

        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(result, cls=DecimalEncoder),
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)}),
        }
