import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiSchemes')

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)

def build_cors_headers(cache_age=0):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }
    if cache_age > 0:
        headers['Cache-Control'] = f'public, max-age={cache_age}'
    return headers

def lambda_handler(event, context):
    try:
        path = event.get('path', '')
        
        # 1) Category counts endpoint (Fast, Highly Cached)
        if '/scheme-categories' in path:
            return fetch_categories()
            
        scheme_id = ''
        if event.get('pathParameters'):
            scheme_id = event['pathParameters'].get('schemeId', '')
            
        # 2) Fetch paginated list
        if scheme_id.lower() == 'all' or '/scheme/all' in path:
            return fetch_paginated(event)

        # 3) Fetch single scheme detail
        if scheme_id:
            return fetch_single(scheme_id)

        return {
            'statusCode': 400,
            'headers': build_cors_headers(),
            'body': json.dumps({ 'error': 'Invalid request or missing schemeId' })
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': build_cors_headers(),
            'body': json.dumps({ 'error': str(e) })
        }

def fetch_paginated(event):
    qs = event.get('queryStringParameters') or {}
    limit = int(qs.get('limit', 20))
    sort_by = qs.get('sortBy', 'default')
    category = qs.get('category', 'all')
    level = qs.get('level', 'all')
    search = qs.get('search', '')
    next_key_str = qs.get('nextKey')
    
    # Projection to keep payload small
    projection = "schemeId, nameEnglish, shortTitle, #lvl, #typ, state, ministry, categories, tags, annualBenefit"
    ean = { "#lvl": "level", "#typ": "type" }
    
    kwargs = {
        'IndexName': 'status-benefit-index' if sort_by == 'benefit_desc' else 'status-name-index',
        'KeyConditionExpression': Key('status').eq('Published'),
        'ProjectionExpression': projection,
        'ExpressionAttributeNames': ean,
        'Limit': limit
    }
    
    if sort_by == 'benefit_desc':
        kwargs['ScanIndexForward'] = False
        
    if next_key_str:
        try:
            kwargs['ExclusiveStartKey'] = json.loads(next_key_str)
        except:
            pass
            
    try:
        # Try GSI query
        response = table.query(**kwargs)
    except Exception as e:
        # Fallback to scan if GSI is still CREATING or missing
        print("Fallback to table scan due to GSI issue or missing index:", str(e))
        scan_kwargs = {
            'FilterExpression': Key('status').eq('Published'),
            'ProjectionExpression': projection,
            'ExpressionAttributeNames': ean
        }
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        # Sort manually
        if sort_by == 'benefit_desc':
            items.sort(key=lambda x: x.get('annualBenefit') or 0, reverse=True)
        else:
            items.sort(key=lambda x: str(x.get('nameEnglish', '')).lower())
            
        # Simulate pagination manually
        offset = 0
        if next_key_str:
            try:
                offset = int(next_key_str)
            except: pass
            
        paginated_items = items[offset : offset + limit]
        
        result = {
            'schemes': paginated_items,
            'limit': limit
        }
        if offset + limit < len(items):
            result['nextKey'] = str(offset + limit)
            
        return {
            'statusCode': 200,
            'headers': build_cors_headers(300),
            'body': json.dumps(result, cls=DecimalEncoder)
        }

    items = response.get('Items', [])
    last_key = response.get('LastEvaluatedKey')
    
    result = {
        'schemes': items,
        'limit': limit
    }
    if last_key:
        result['nextKey'] = json.dumps(last_key, cls=DecimalEncoder)

    return {
        'statusCode': 200,
        'headers': build_cors_headers(300),
        'body': json.dumps(result, cls=DecimalEncoder)
    }

def fetch_single(scheme_id):
    response = table.get_item(Key={ 'schemeId': scheme_id })
    item = response.get('Item')

    if not item:
        return {
            'statusCode': 404,
            'headers': build_cors_headers(),
            'body': json.dumps({ 'error': 'Scheme not found' })
        }

    return {
        'statusCode': 200,
        'headers': build_cors_headers(300),
        'body': json.dumps(item, cls=DecimalEncoder)
    }

def fetch_categories():
    response = table.scan(
        ProjectionExpression="categories",
        FilterExpression=Key('status').eq('Published')
    )
    counts = {}
    for item in response.get('Items', []):
        cats = item.get('categories')
        if not cats: continue
        if isinstance(cats, str): cats = cats.split(',')
        for c in cats:
            c = str(c).strip()
            if c: counts[c] = counts.get(c, 0) + 1
            
    return {
        'statusCode': 200,
        'headers': build_cors_headers(3600),
        'body': json.dumps(counts, cls=DecimalEncoder)
    }
