import json
import boto3
import uuid
import time
import os

"""
Unified Bedrock Agent Action Group Executor
This Lambda handles ALL tool calls from the Sarathi Bedrock Agent.
The Bedrock Agent routes all tool invocations through a single action group
(application_guide_group) to this function.

Supported functions:
  - SearchSchemes: Fuzzy search in DynamoDB SarathiSchemes
  - ApplyForScheme: Submit a new application to SarathiApplications
  - CheckApplicationStatus: Query SarathiApplications by citizenId
  - GetCitizenProfile: Retrieve citizen profile from SarathiCitizens
  - GetSchemeDetails / check_scheme_eligibility: Get detailed scheme info
"""

dynamo = boto3.client('dynamodb', region_name='us-east-1')
sns_client = boto3.client('sns', region_name='us-east-1')


def _get_param(parameters, name, default=''):
    """Helper to extract a named parameter from the Bedrock event."""
    return next((p['value'] for p in parameters if p['name'] == name), default)


def lambda_handler(event, context):
    print("Received event from Bedrock Agent:", json.dumps(event))

    actionGroup = event.get('actionGroup')
    function = event.get('function')
    parameters = event.get('parameters', [])

    # Get citizenId from session attributes (injected by agent_invoke)
    session_citizen_id = event.get('sessionAttributes', {}).get('citizenId', '')

    responseBody = {}

    # ──────────────────────────────────────────────
    # TOOL: SearchSchemes
    # ──────────────────────────────────────────────
    if function == 'SearchSchemes':
        query = _get_param(parameters, 'query', 'all')
        print(f"Searching schemes with query: {query}")
        try:
            resp = dynamo.scan(TableName='SarathiSchemes')
            schemes = resp.get('Items', [])

            if query.lower() not in ('all', ''):
                q = query.lower().replace("-", " ")
                matched = []
                for s in schemes:
                    search_text = (
                        s.get('schemeId', {}).get('S', '').lower().replace("-", " ") + " " +
                        s.get('nameEnglish', {}).get('S', '').lower() + " " +
                        s.get('nameHindi', {}).get('S', '').lower() + " " +
                        s.get('ministry', {}).get('S', '').lower() + " " +
                        s.get('department', {}).get('S', '').lower() + " " +
                        str(s.get('tags', {}).get('L', [])).lower()
                    )
                    if q in search_text:
                        matched.append(s)
                schemes = matched

            formatted = []
            for s in schemes[:5]:
                formatted.append({
                    "schemeId": s.get('schemeId', {}).get('S', ''),
                    "name": s.get('nameEnglish', {}).get('S', ''),
                    "annualBenefit": s.get('annualBenefit', {}).get('N', '0'),
                    "ministry": s.get('ministry', {}).get('S', ''),
                    "details": s.get('briefDescription', {}).get('S', '')[:200],
                    "eligibility": s.get('eligibilityMd', {}).get('S', '')[:200],
                    "howToApply": s.get('applyUrl', {}).get('S', '')
                })

            responseBody = {
                "TEXT": {
                    "body": json.dumps({"found": len(formatted), "schemes": formatted})
                }
            }
        except Exception as e:
            responseBody = {"TEXT": {"body": f"Error searching schemes: {str(e)}"}}

    # ──────────────────────────────────────────────
    # TOOL: ApplyForScheme
    # ──────────────────────────────────────────────
    elif function == 'ApplyForScheme':
        citizenId = session_citizen_id or _get_param(parameters, 'citizenId', 'guest')
        schemeId = _get_param(parameters, 'schemeId', None)

        # Optional fallback params (agent can collect conversationally)
        param_aadhaar = _get_param(parameters, 'aadhaarLast4', '')
        param_mobile = _get_param(parameters, 'mobile', '')
        param_bank = _get_param(parameters, 'bankAccountLast4', '')

        if not schemeId:
            responseBody = {"TEXT": {"body": "Error: schemeId is required to apply."}}
        else:
            try:
                # ── Resolve scheme ──
                actual_scheme_id = schemeId
                scheme_name = "Unknown Scheme"
                documents_required = "Aadhaar, Income Proof"
                try:
                    s_resp = dynamo.get_item(TableName='SarathiSchemes', Key={'schemeId': {'S': schemeId}})
                    if 'Item' in s_resp:
                        scheme_name = s_resp['Item'].get('nameEnglish', {}).get('S', 'Unknown Scheme')
                        documents_required = s_resp['Item'].get('documentsRequiredEnglish', {}).get('S', documents_required)
                    else:
                        all_schemes = dynamo.scan(TableName='SarathiSchemes')['Items']
                        search_term = schemeId.lower().replace("-", " ")
                        for s in all_schemes:
                            s_name = s.get('nameEnglish', {}).get('S', '').lower()
                            s_id = s.get('schemeId', {}).get('S', '').lower()
                            if search_term in s_name or search_term in s_id.replace("-", " "):
                                actual_scheme_id = s.get('schemeId', {}).get('S')
                                scheme_name = s.get('nameEnglish', {}).get('S', 'Unknown Scheme')
                                documents_required = s.get('documentsRequiredEnglish', {}).get('S', documents_required)
                                break
                except Exception as e:
                    print(f"Scheme resolution warning: {e}")

                # ── Fetch citizen profile ──
                citizen_name = 'Unknown'
                profile_aadhaar = ''
                profile_mobile = ''
                profile_bank = ''
                panchayat_id = 'unassigned'
                try:
                    c_resp = dynamo.get_item(TableName='SarathiCitizens', Key={'citizenId': {'S': citizenId}})
                    c_item = c_resp.get('Item')
                    if c_item:
                        citizen_name = c_item.get('name', {}).get('S', 'Unknown')
                        profile_aadhaar = c_item.get('aadhaarLast4', {}).get('S', '')
                        profile_mobile = c_item.get('mobile', {}).get('S', '')
                        profile_bank = c_item.get('bankAccountLast4', {}).get('S', '')
                        panchayat_id = c_item.get('panchayatId', {}).get('S', 'unassigned')
                except Exception as e:
                    print(f"Citizen profile fetch warning: {e}")

                # Priority: tool parameter > stored profile > empty
                final_aadhaar = param_aadhaar or profile_aadhaar
                final_mobile = param_mobile or profile_mobile
                final_bank = param_bank or profile_bank

                # ── Check completeness ──
                missing = []
                if not final_aadhaar:
                    missing.append('aadhaarLast4 (last 4 digits of Aadhaar)')
                if not final_mobile:
                    missing.append('mobile (10-digit mobile number)')
                if not final_bank:
                    missing.append('bankAccountLast4 (last 4 digits of bank account)')

                if missing:
                    responseBody = {"TEXT": {"body": (
                        f"I need a few more details before I can submit your application for {scheme_name}. "
                        f"Please provide: {', '.join(missing)}. "
                        f"You can tell me each one and I will retry the application."
                    )}}
                else:
                    application_id = f"APP-{str(uuid.uuid4())[:8]}"
                    now = time.strftime("%Y-%m-%dT%H:%M:%SZ")

                    dynamo.put_item(
                        TableName='SarathiApplications',
                        Item={
                            'applicationId': {'S': application_id},
                            'citizenId': {'S': citizenId},
                            'schemeId': {'S': actual_scheme_id},
                            'schemeName': {'S': scheme_name},
                            'panchayatId': {'S': panchayat_id},
                            'personalDetails': {'M': {
                                'name': {'S': citizen_name},
                                'aadhaarLast4': {'S': final_aadhaar},
                                'mobile': {'S': final_mobile},
                                'bankAccountLast4': {'S': final_bank},
                            }},
                            'documentsChecked': {'S': documents_required},
                            'status': {'S': 'submitted'},
                            'source': {'S': 'agent'},
                            'createdAt': {'S': now},
                            'updatedAt': {'S': now},
                        }
                    )
                    responseBody = {"TEXT": {"body": (
                        f"I have successfully submitted your application for {scheme_name}. "
                        f"Your reference ID is {application_id}. "
                        f"Application includes your personal details (name: {citizen_name}, Aadhaar: ****{final_aadhaar}, mobile: ******{final_mobile[-4:]}). "
                        f"Documents required: {documents_required}. "
                        f"You can track its status on your dashboard."
                    )}}
            except Exception as e:
                responseBody = {"TEXT": {"body": f"Error applying for scheme: {str(e)}"}}

    # ──────────────────────────────────────────────
    # TOOL: CheckApplicationStatus
    # ──────────────────────────────────────────────
    elif function == 'CheckApplicationStatus':
        citizenId = session_citizen_id or _get_param(parameters, 'citizenId', None)
        schemeId = _get_param(parameters, 'schemeId', None)

        if not citizenId:
            responseBody = {"TEXT": {"body": "I need your Citizen ID to check application status."}}
        else:
            try:
                query_params = {
                    'TableName': 'SarathiApplications',
                    'IndexName': 'citizenId-createdAt-index',
                    'KeyConditionExpression': 'citizenId = :cid',
                    'ExpressionAttributeValues': {':cid': {'S': citizenId}}
                }
                if schemeId:
                    query_params['FilterExpression'] = 'schemeId = :sid'
                    query_params['ExpressionAttributeValues'][':sid'] = {'S': schemeId}

                resp = dynamo.query(**query_params)
                apps = resp.get('Items', [])

                if not apps:
                    responseBody = {"TEXT": {"body": "I couldn't find any active applications for you."}}
                else:
                    status_list = []
                    for a in apps:
                        name = a.get('schemeName', {}).get('S', a.get('schemeId', {}).get('S', 'Unknown'))
                        status_list.append(f"- {name}: {a['status']['S']} (ID: {a['applicationId']['S']})")
                    responseBody = {"TEXT": {"body": "Here are your application statuses:\n" + "\n".join(status_list)}}
            except Exception as e:
                print(f"Status query failed: {str(e)}")
                responseBody = {"TEXT": {"body": f"Error checking records: {str(e)}"}}

    # ──────────────────────────────────────────────
    # TOOL: GetCitizenProfile
    # ──────────────────────────────────────────────
    elif function == 'GetCitizenProfile':
        citizenId = session_citizen_id or _get_param(parameters, 'citizenId', None)
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
                    aadhaar_val = item.get('aadhaarLast4', {}).get('S', '')
                    mobile_val = item.get('mobile', {}).get('S', '')
                    bank_val = item.get('bankAccountLast4', {}).get('S', '')
                    profile_data = {
                        "name": item.get('name', {}).get('S', 'Unknown'),
                        "age": item.get('age', {}).get('N', 'Unknown'),
                        "gender": item.get('gender', {}).get('S', 'Unknown'),
                        "state": item.get('state', {}).get('S', 'Unknown'),
                        "district": item.get('district', {}).get('S', 'Unknown'),
                        "income": item.get('income', {}).get('N', 'Unknown'),
                        "category": item.get('category', {}).get('S', 'Unknown'),
                        "occupation": item.get('occupation', {}).get('S', 'Unknown'),
                        "panchayatId": item.get('panchayatId', {}).get('S', 'unassigned'),
                        "mobile": f"******{mobile_val[-4:]}" if len(mobile_val) >= 4 else ('set' if mobile_val else 'missing'),
                        "aadhaarLast4": f"****{aadhaar_val}" if aadhaar_val else 'missing',
                        "bankAccountLast4": f"****{bank_val}" if bank_val else 'missing',
                        "applicationReady": bool(aadhaar_val and mobile_val and bank_val),
                    }
                    responseBody = {
                        "TEXT": {
                            "body": json.dumps({
                                "summary": f"Found profile for {profile_data['name']}. Application ready: {profile_data['applicationReady']}",
                                "profile": profile_data
                            })
                        }
                    }
            except Exception as e:
                responseBody = {"TEXT": {"body": f"Error fetching profile: {str(e)}"}}

    # ──────────────────────────────────────────────
    # TOOL: GetSchemeDetails / check_scheme_eligibility
    # ──────────────────────────────────────────────
    elif function in ('GetSchemeDetails', 'check_scheme_eligibility'):
        schemeId = _get_param(parameters, 'schemeId', None)
        if not schemeId:
            responseBody = {"TEXT": {"body": "Please specify a scheme ID."}}
        else:
            try:
                resp = dynamo.get_item(TableName='SarathiSchemes', Key={'schemeId': {'S': schemeId}})
                item = resp.get('Item')

                # Fuzzy match if direct lookup fails
                if not item:
                    all_schemes = dynamo.scan(TableName='SarathiSchemes')['Items']
                    q = schemeId.lower()
                    item = next((s for s in all_schemes if q in s.get('nameEnglish', {}).get('S', '').lower()), None)

                if item:
                    detail = {
                        "schemeId": item.get('schemeId', {}).get('S', ''),
                        "name": item.get('nameEnglish', {}).get('S', ''),
                        "benefit": item.get('annualBenefit', {}).get('N', '0'),
                        "eligibility": item.get('eligibilityMd', {}).get('S', item.get('eligibilityCriteriaEnglish', {}).get('S', 'Standard criteria.')),
                        "documents": item.get('documentsRequiredEnglish', {}).get('S', 'Aadhaar, Income Proof'),
                        "howToApply": item.get('applyUrl', {}).get('S', 'Apply via Sarathi portal'),
                    }
                    responseBody = {"TEXT": {"body": json.dumps(detail)}}
                else:
                    responseBody = {"TEXT": {"body": f"Scheme '{schemeId}' not found."}}
            except Exception as e:
                responseBody = {"TEXT": {"body": f"Error: {str(e)}"}}

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
