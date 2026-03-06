import json
import boto3
import uuid
import time

# This Lambda executes the Action Group for the Bedrock Agent
# It is called by the Agent when parsing the user's intent

dynamo = boto3.client('dynamodb', region_name='us-east-1')
sns = boto3.client('sns', region_name='us-east-1')

def lambda_handler(event, context):
    print("Received event from Bedrock Agent:", json.dumps(event))
    
    actionGroup = event.get('actionGroup')
    function = event.get('function')
    parameters = event.get('parameters', [])
    
    responseBody = {}
    
    # Securely retrieve the authenticated citizenId from the session state
    session_citizen_id = event.get('sessionAttributes', {}).get('citizenId')
    
    if function == 'SearchSchemes':
        query = next((p['value'] for p in parameters if p['name'] == 'query'), "all")
        print(f"Searching schemes with query: {query}")
        try:
            resp = dynamo.scan(TableName='SarathiSchemes')
            schemes = resp.get('Items', [])
            
            # Search in nameEnglish, nameHindi, ministry, and categories
            if query.lower() != "all" and query.lower() != "":
                q = query.lower()
                matched = []
                for s in schemes:
                    search_text = (
                        s.get('nameEnglish', {'S':''})['S'].lower() + " " +
                        s.get('nameHindi', {'S':''})['S'].lower() + " " +
                        s.get('ministry', {'S':''})['S'].lower() + " " +
                        s.get('category', {'S':''})['S'].lower()
                    )
                    if q in search_text:
                        matched.append(s)
                schemes = matched
            
            # Return RICH data for the agent to reason about
            formatted_schemes = []
            for s in schemes[:3]: # limit to 3 for token efficiency, but with full details
                formatted_schemes.append({
                    "schemeId": s.get('schemeId', {}).get('S', ''),
                    "name": s.get('nameEnglish', {}).get('S', ''),
                    "hindiName": s.get('nameHindi', {}).get('S', ''),
                    "annualBenefit": s.get('annualBenefit', {}).get('N', '0'),
                    "ministry": s.get('ministry', {}).get('S', ''),
                    "details": s.get('benefitDescription', {}).get('S', ''),
                    "eligibility": s.get('eligibilityTags', {}).get('SS', []),
                    "documents": s.get('documentsRequired', {}).get('SS', []),
                    "howToApply": s.get('howToApply', {}).get('SS', [])
                })
            
            response_text = f"Found {len(formatted_schemes)} matching schemes."
            if not formatted_schemes:
                response_text = "I couldn't find any schemes matching that description. Could you try different keywords?"
                
            responseBody = {
                "TEXT": {
                    "body": json.dumps({
                        "summary": response_text,
                        "schemes": formatted_schemes
                    })
                }
            }
        except Exception as e:
            responseBody = {"TEXT": {"body": f"Error searching schemes: {str(e)}"}}

    elif function == 'ApplyForScheme':
        citizenId = session_citizen_id or next((p['value'] for p in parameters if p['name'] == 'citizenId'), "guest")
        schemeId = next((p['value'] for p in parameters if p['name'] == 'schemeId'), None)
        applicantName = next((p['value'] for p in parameters if p['name'] == 'applicantName'), "Unknown")
        aadhaarNumber = next((p['value'] for p in parameters if p['name'] == 'aadhaarNumber'), "XXXX")
        mobileNumber = next((p['value'] for p in parameters if p['name'] == 'mobileNumber'), "XXXX")
        bankAccount = next((p['value'] for p in parameters if p['name'] == 'bankAccount'), "XXXX")
        
        if not schemeId:
            responseBody = {"TEXT": {"body": "Error: schemeId is required."}}
        else:
            print(f"Applying citizen {citizenId} to scheme {schemeId}")
            try:
                # 1. Resolve formal schemeId and Name
                # If schemeId doesn't look like a formal ID (e.g. it is 'test6'), try to find it
                actual_scheme_id = schemeId
                scheme_name = "Unknown Scheme"
                
                # Try direct lookup first
                try:
                    s_resp = dynamo.get_item(TableName='SarathiSchemes', Key={'schemeId': {'S': schemeId}})
                    if 'Item' in s_resp:
                        scheme_name = s_resp['Item'].get('nameEnglish', {}).get('S', 'Unknown Scheme')
                    else:
                        # If not found, it might be a name passed as an ID (like 'test6')
                        print(f"Scheme ID {schemeId} not found directly, attempting name-based resolution...")
                        all_schemes = dynamo.scan(TableName='SarathiSchemes')['Items']
                        for s in all_schemes:
                            s_name = s.get('nameEnglish', {}).get('S', '').lower()
                            s_name_raw = s.get('name', {}).get('S', '').lower()
                            if schemeId.lower() in [s_name, s_name_raw]:
                                actual_scheme_id = s.get('schemeId', {}).get('S')
                                scheme_name = s.get('nameEnglish', {}).get('S') or s.get('name', {}).get('S')
                                print(f"Resolved {schemeId} to formal ID: {actual_scheme_id}")
                                break
                except Exception as e:
                    print(f"Scheme resolution warning: {e}")

                # 2. Get citizen profile to find their panchayatId
                panchayat_id = 'unassigned'
                try:
                    p_resp = dynamo.get_item(TableName='SarathiCitizens', Key={'citizenId': {'S': citizenId}})
                    if 'Item' in p_resp:
                        raw_pid = p_resp['Item'].get('panchayatId', {}).get('S', '') or p_resp['Item'].get('panchayatCode', {}).get('S', '')
                        if raw_pid:
                            # Normalize: numeric -> LGD_
                            if raw_pid.isdigit() and not raw_pid.startswith('LGD_'):
                                panchayat_id = f"LGD_{raw_pid}"
                            else:
                                panchayat_id = raw_pid
                except Exception as e:
                    print(f"Citizen profile lookup warning: {e}")

                application_id = f"APP-{str(uuid.uuid4())[:8]}"
                now = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                # 3. Create the application record
                dynamo.put_item(
                    TableName='SarathiApplications',
                    Item={
                        'applicationId': {'S': application_id},
                        'citizenId': {'S': citizenId},
                        'panchayatId': {'S': panchayat_id},
                        'schemeId': {'S': actual_scheme_id},
                        'schemeName': {'S': scheme_name},
                        'status': {'S': 'submitted'},
                        'createdAt': {'S': now},
                        'updatedAt': {'S': now},
                        'appliedDate': {'S': now}, # Legacy support
                        'personalDetails': {
                            'M': {
                                'name': {'S': applicantName},
                                'aadhaarLast4': {'S': aadhaarNumber},
                                'mobile': {'S': mobileNumber},
                                'bankAccountLast4': {'S': bankAccount}
                            }
                        }
                    }
                )
                responseBody = {"TEXT": {"body": f"I have successfully submitted your application for {scheme_name}. Your application reference ID is {application_id}. You can check its status anytime on your dashboard or here."}}
            except Exception as e:
                responseBody = {"TEXT": {"body": f"Error applying for scheme: {str(e)}"}}

    elif function == 'CheckApplicationStatus':
        citizenId = session_citizen_id or next((p['value'] for p in parameters if p['name'] == 'citizenId'), None)
        schemeId = next((p['value'] for p in parameters if p['name'] == 'schemeId'), None)
        
        if not citizenId:
            responseBody = {"TEXT": {"body": "I need your Citizen ID to check the status."}}
        else:
            try:
                # Query DynamoDB for real status
                if schemeId:
                    resp = dynamo.query(
                        TableName='SarathiApplications',
                        IndexName='citizenId-createdAt-index', 
                        KeyConditionExpression='citizenId = :cid',
                        FilterExpression='schemeId = :sid',
                        ExpressionAttributeValues={
                            ':cid': {'S': citizenId},
                            ':sid': {'S': schemeId}
                        }
                    )
                else:
                    resp = dynamo.query(
                        TableName='SarathiApplications',
                        IndexName='citizenId-createdAt-index', 
                        KeyConditionExpression='citizenId = :cid',
                        ExpressionAttributeValues={':cid': {'S': citizenId}}
                    )
                
                apps = resp.get('Items', [])
                if not apps:
                    responseBody = {"TEXT": {"body": "I couldn't find any active applications for you."}}
                else:
                    status_list = []
                    for a in apps:
                        status_list.append(f"- {a.get('schemeName', {}).get('S', a.get('schemeId', {}).get('S', 'Unknown Scheme'))}: {a['status']['S']} (ID: {a['applicationId']['S']})")
                    
                    responseBody = {"TEXT": {"body": "Here are your application statuses:\n" + "\n".join(status_list)}}
            except Exception as e:
                print(f"Status query failed: {str(e)}")
                responseBody = {"TEXT": {"body": f"I encountered an error checking our live records: {str(e)}"}}

    elif function == 'GetCitizenProfile':
        citizenId = session_citizen_id or next((p['value'] for p in parameters if p['name'] == 'citizenId'), None)
        if not citizenId:
            responseBody = {"TEXT": {"body": "I need your Citizen ID to fetch your profile."}}
        else:
            try:
                resp = dynamo.get_item(
                    TableName='SarathiCitizens',
                    Key={'citizenId': {'S': citizenId}}
                )
                item = resp.get('Item')
                if not item:
                    responseBody = {"TEXT": {"body": "I could not find a profile associated with your Citizen ID."}}
                else:
                    # Extract relevant details to return to the agent
                    profile_data = {
                        "name": item.get('name', {}).get('S', 'Unknown'),
                        "age": item.get('age', {}).get('N', 'Unknown'),
                        "gender": item.get('gender', {}).get('S', 'Unknown'),
                        "state": item.get('state', {}).get('S', 'Unknown'),
                        "district": item.get('district', {}).get('S', 'Unknown'),
                        "income": item.get('income', {}).get('N', 'Unknown'),
                        "category": item.get('category', {}).get('S', 'Unknown'),
                        "occupation": item.get('occupation', {}).get('S', 'Unknown'),
                        "disability": item.get('disability', {}).get('BOOL', False),
                        "hasRationCard": item.get('hasRationCard', {}).get('BOOL', False),
                    }
                    responseBody = {
                        "TEXT": {
                            "body": json.dumps({
                                "summary": f"Found profile for {profile_data['name']}.",
                                "profile": profile_data
                            })
                        }
                    }
            except Exception as e:
                 responseBody = {"TEXT": {"body": f"Error fetching profile: {str(e)}"}}
    else:
        responseBody = {"TEXT": {"body": f"Function {function} is not recognized by this Action Group."}}

    action_response = {
        'actionGroup': actionGroup,
        'function': function,
        'functionResponse': {
            'responseBody': responseBody
        }
    }
    
    print("Returning response:", json.dumps(action_response))
    
    return {
        'response': action_response,
        'messageVersion': event.get('messageVersion', '1.0')
    }
