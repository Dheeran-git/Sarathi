import boto3

client = boto3.client('apigateway', region_name='us-east-1')
API_ID = 'mvbx0sv4n3'

resources = client.get_resources(restApiId=API_ID)['items']
rid = next((r['id'] for r in resources if r['path'] == '/vault'), None)

if rid:
    print(f"Adding OPTIONS to /vault (rid: {rid})")
    try:
        client.put_method(restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', authorizationType='NONE')
    except Exception as e:
        print(e)
        
    try:
        client.put_integration(restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', type='MOCK', requestTemplates={'application/json': '{"statusCode": 200}'})
    except Exception as e:
        print(e)
        
    try:
        client.put_method_response(
            restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', statusCode='200', 
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': False, 
                'method.response.header.Access-Control-Allow-Methods': False, 
                'method.response.header.Access-Control-Allow-Origin': False
            }
        )
    except Exception as e:
        print(e)
        
    try:
        client.put_integration_response(
            restApiId=API_ID, resourceId=rid, httpMethod='OPTIONS', statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
    except Exception as e:
        print(e)

    client.create_deployment(restApiId=API_ID, stageName='prod')
    print("Deployed prod API")
else:
    print("Could not find /vault")
