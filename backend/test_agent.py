import requests
import json
import uuid

API_URL = "https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod/agent"
CITIZEN_ID = "tentanms2006@gmail.com" 

def test_chat():
    session_id = str(uuid.uuid4())
    print("Starting chat session:", session_id)
    
    prompts = [
        "I want to apply for the test3 scheme",
        "My name is John Doe, Aadhaar is 1234, Mobile is 9876543210, Bank is 5555. Please proceed."
    ]
    
    for prompt in prompts:
        print(f"\nUser: {prompt}")
        
        payload = {
            "prompt": prompt,
            "sessionId": session_id,
            "citizenId": CITIZEN_ID
        }
        
        response = requests.post(API_URL, json=payload)
        try:
            data = response.json()
            resp_txt = data.get('response', data.get('error', 'No response field'))
            print(f"Sarathi:\n{resp_txt}")
        except Exception as e:
            print(f"Error parsing response: {response.text}")

if __name__ == "__main__":
    test_chat()
