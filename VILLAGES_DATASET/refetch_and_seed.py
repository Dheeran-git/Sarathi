"""
Re-fetch all schemes from the myscheme.gov.in API using the public API key.
Extracts clean, structured data and seeds it into DynamoDB SarathiSchemes table.

The API returns rich nested JSON — we flatten it properly while preserving
markdown fields for the frontend to render well.
"""

import json
import os
import time
import re
import boto3
import requests
from decimal import Decimal
import sys
io = __import__('io')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_URL = "https://api.myscheme.gov.in/schemes/v6/public/schemes"
SLUGS_FILE = r"c:\Users\mohit\OneDrive\Desktop\Sarathi\VILLAGES_DATASET\schemes_cleaned.json"
TABLE_NAME = "SarathiSchemes"
BATCH_DELAY = 0.4  # seconds between requests to be polite

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.myscheme.gov.in/",
    "Origin": "https://www.myscheme.gov.in",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
    "X-Api-Key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc"
}

# ── Helpers ────────────────────────────────────────────────────────────────────

def clean_name(name: str) -> str:
    """Remove UI junk from scraped names like 'Something went wrong...Ok' etc."""
    if not name:
        return ""
    # Remove known garbage patterns
    patterns = [
        r'Something went wrong\. Please try again later\.Ok.*',
        r'It seems you have already initiated.*',
        r'Are you sure you want to sign out\?.*',
        r'CancelSign Out.*',
        r'CancelApply Now.*',
        r'EngEnglish.*',
        r'Sign In$',
    ]
    for p in patterns:
        name = re.sub(p, '', name, flags=re.DOTALL).strip()
    return name.strip()

def extract_text_from_rich(nodes):
    """Recursively extract plain text from the rich-text node tree."""
    if not nodes:
        return ""
    texts = []
    if isinstance(nodes, list):
        for node in nodes:
            texts.append(extract_text_from_rich(node))
    elif isinstance(nodes, dict):
        if "text" in nodes and nodes["text"].strip():
            texts.append(nodes["text"])
        if "children" in nodes:
            texts.append(extract_text_from_rich(nodes["children"]))
    return " ".join(t for t in texts if t.strip())

def sanitize_for_dynamo(obj):
    """Remove empty strings/None/[], convert floats to Decimal."""
    if isinstance(obj, dict):
        return {k: sanitize_for_dynamo(v) for k, v in obj.items()
                if v is not None and v != "" and v != [] and v != {}}
    if isinstance(obj, list):
        cleaned = [sanitize_for_dynamo(i) for i in obj
                   if i is not None and i != "" and i != []]
        return cleaned if cleaned else None
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj

def map_raw_api_to_scheme(slug: str, raw: dict) -> dict | None:
    """Map the API JSON response to the Sarathi DynamoDB schema."""
    if raw.get("statusCode") != 200:
        return None
    
    data = raw.get("data", {})
    en = data.get("en", {})
    if not en:
        return None
    
    bd = en.get("basicDetails", {})
    sc = en.get("schemeContent", {})
    ec = en.get("eligibilityCriteria", {}) or {}
    ap = en.get("applicationProcess", []) or []

    # Basic details
    name = clean_name(bd.get("schemeName", ""))
    if not name:
        return None
    
    short_title = bd.get("schemeShortTitle", "")
    level_obj = bd.get("level", {}) or {}
    level = level_obj.get("value", "central")  # 'central' or 'state'
    
    state_obj = bd.get("state")
    state_label = state_obj.get("label", "All") if state_obj else "All"
    states = [state_label] if state_label and state_label != "All" and level == "state" else ["All"]
    
    ministry_obj = bd.get("nodalMinistryName")
    ministry = ministry_obj.get("label", "") if ministry_obj else ""
    
    dept_obj = bd.get("nodalDepartmentName")
    department = dept_obj.get("label", "") if dept_obj else ""
    # If no central ministry, use department
    if not ministry:
        ministry = department
    
    scheme_type_obj = bd.get("schemeType", {}) or {}
    scheme_type_label = scheme_type_obj.get("label", "Central Sector Scheme" if level == "central" else "State Scheme")
    
    categories = [c.get("label", "") for c in (bd.get("schemeCategory") or [])]
    sub_cats = [c.get("label", "") for c in (bd.get("schemeSubCategory") or [])]
    beneficiaries = [b.get("label", "") for b in (bd.get("targetBeneficiaries") or [])]
    tags = bd.get("tags", []) or []
    dbt = bool(bd.get("dbtScheme", False))
    
    # Scheme content - prefer markdown fields
    brief = sc.get("briefDescription", "")
    desc_md = sc.get("detailedDescription_md", "") or ""
    benefits_md = sc.get("benefits_md", "") or ""
    exclusions_md = sc.get("exclusions_md", "") or ""
    
    # Benefit type
    benefit_types_raw = sc.get("benefitTypes")
    if isinstance(benefit_types_raw, dict):
        benefit_type = benefit_types_raw.get("label", "")
    elif isinstance(benefit_types_raw, list):
        benefit_type = ", ".join(b.get("label", "") for b in benefit_types_raw if b.get("label"))
    else:
        benefit_type = ""
    
    # References and Apply URL
    references = sc.get("references") or []
    refs_clean = [{"title": r.get("title",""), "url": r.get("url","")} for r in references if r.get("url")]
    apply_url = ""
    for ref in refs_clean:
        t = ref.get("title", "").lower()
        if "apply" in t or "portal" in t or "official" in t:
            apply_url = ref.get("url", "")
            break
    if not apply_url and refs_clean:
        apply_url = refs_clean[0]["url"]
    
    apply_url_direct = f"https://www.myscheme.gov.in/schemes/{slug}"
    
    # Eligibility - markdown version
    elig_md = ec.get("eligibilityDescription_md", "") or ""
    
    # Application process
    how_to = []
    for proc in (ap if isinstance(ap, list) else []):
        mode = proc.get("mode", "")
        proc_md = proc.get("process_md", "") or ""
        if not proc_md:
            proc_md = extract_text_from_rich(proc.get("process", []))
        how_to.append({"mode": mode, "steps": proc_md[:2000]})
    
    return {
        "schemeId":             slug,
        "nameEnglish":          name,
        "nameHindi":            "",
        "shortTitle":           short_title,
        "level":                level,
        "type":                 scheme_type_label,
        "state":                states,
        "ministry":             ministry,
        "department":           department,
        "categories":           categories,
        "subCategories":        sub_cats,
        "targetBeneficiaries":  beneficiaries,
        "tags":                 tags,
        "dbtScheme":            dbt,
        "briefDescription":     brief,
        "descriptionMd":        desc_md[:3000] if desc_md else "",
        "benefitsMd":           benefits_md[:2000] if benefits_md else "",
        "exclusionsMd":         exclusions_md[:1000] if exclusions_md else "",
        "eligibilityMd":        elig_md[:2000] if elig_md else "",
        "benefitType":          benefit_type,
        "howToApply":           how_to,
        "references":           refs_clean,
        "applyUrl":             apply_url or apply_url_direct,
        "source":               "myscheme.gov.in",
        "status":               "Published",
        # Eligibility engine fields (broad defaults — can be refined later)
        "minAge":               0,
        "maxAge":               99,
        "maxMonthlyIncome":     999999,
        "gender":               "any",
        "occupation":           "any",
        "categories_str":       "SC,ST,OBC,General",
        "isWidow":              "any",
        "annualBenefit":        0,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

print("Loading slug list from schemes_cleaned.json...")
with open(SLUGS_FILE, encoding='utf-8') as f:
    cleaned = json.load(f)

slugs = [s["schemeId"] for s in cleaned if s.get("schemeId")]
print(f"Total slugs: {len(slugs)}")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(TABLE_NAME)

success, failed, skipped, empty = 0, 0, 0, 0

with table.batch_writer() as batch:
    for i, slug in enumerate(slugs):
        url = f"{BASE_URL}?slug={slug}&lang=en"
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            if r.status_code == 200:
                raw = r.json()
                mapped = map_raw_api_to_scheme(slug, raw)
                if mapped:
                    item = sanitize_for_dynamo(mapped)
                    if item:
                        batch.put_item(Item=item)
                        success += 1
                    else:
                        empty += 1
                else:
                    empty += 1
            elif r.status_code == 404:
                skipped += 1
            else:
                print(f"  [{r.status_code}] {slug}")
                failed += 1
        except Exception as e:
            print(f"  [ERR] {slug}: {e}")
            failed += 1
        
        if success % 100 == 0 and success > 0:
            print(f"Progress: {i+1}/{len(slugs)} | Success: {success} | Failed: {failed} | Empty: {empty}")
        
        time.sleep(BATCH_DELAY)

print(f"\nDone! Success: {success} | Failed: {failed} | Empty/Skipped: {empty+skipped}")
