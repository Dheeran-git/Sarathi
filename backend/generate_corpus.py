import boto3
import os

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('SarathiSchemes')

def generate_corpus():
    print("Fetching schemes from DynamoDB...")
    response = table.scan()
    items = response.get('Items', [])
    
    os.makedirs(os.path.join("backend", "knowledge_base"), exist_ok=True)
    corpus_path = os.path.join("backend", "knowledge_base", "scheme_corpus.txt")
    
    with open(corpus_path, "w", encoding="utf-8") as f:
        for item in items:
            f.write(f"Scheme ID: {item.get('schemeId', '')}\n")
            f.write(f"Name (English): {item.get('nameEnglish', '')}\n")
            f.write(f"Name (Hindi): {item.get('nameHindi', '')}\n")
            f.write(f"Ministry: {item.get('ministry', '')}\n")
            f.write(f"Category: {item.get('category', '')}\n")
            f.write(f"Description: {item.get('benefitDescription', '')}\n")
            f.write(f"Annual Benefit: ₹{item.get('annualBenefit', 0)}\n")
            f.write(f"Eligibility Tags: {', '.join(item.get('eligibilityTags', []))}\n")
            f.write(f"Required Documents: {', '.join(item.get('documentsRequired', []))}\n")
            f.write(f"How to Apply: {', '.join(item.get('howToApply', []))}\n")
            f.write("-" * 50 + "\n\n")
            
    print(f"Total {len(items)} schemes written to {corpus_path}")

if __name__ == "__main__":
    generate_corpus()
