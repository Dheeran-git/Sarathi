"""
Fast concurrent re-fetcher using ThreadPoolExecutor.
Fetches all schemes from myscheme.gov.in API and seeds to DynamoDB.
"""

import json
import time
import re
import boto3
import requests
from decimal import Decimal
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import sys
io = __import__('io')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_URL = "https://api.myscheme.gov.in/schemes/v6/public/schemes"
SLUGS_FILE = r"c:\Users\mohit\OneDrive\Desktop\Sarathi\VILLAGES_DATASET\schemes_cleaned.json"
TABLE_NAME = "SarathiSchemes"
MAX_WORKERS = 10  # Concurrent fetches

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.myscheme.gov.in/",
    "Origin": "https://www.myscheme.gov.in",
    "Accept": "application/json, text/plain, */*",
    "X-Api-Key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc"
}

lock = threading.Lock()
counter = {"success": 0, "failed": 0, "empty": 0}

# ── Helpers ────────────────────────────────────────────────────────────────────
def clean_name(name):
    if not name:
        return ""
    patterns = [
        r'Something went wrong\..*',
        r'It seems you have already.*',
        r'Are you sure you want to sign out\?.*',
        r'CancelSign Out.*',
        r'CancelApply Now.*',
        r'EngEnglish.*',
        r'Sign In$',
        r'OkIt see.*',
    ]
    for p in patterns:
        name = re.sub(p, '', name, flags=re.DOTALL).strip()
    return name.strip()

def extract_text_from_rich(nodes):
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
    if isinstance(obj, dict):
        return {k: sanitize_for_dynamo(v) for k, v in obj.items()
                if v is not None and v != "" and v != [] and v != {}}
    if isinstance(obj, list):
        cleaned = [sanitize_for_dynamo(i) for i in obj if i is not None and i != ""]
        return cleaned if cleaned else None
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj

def map_raw_to_scheme(slug, raw):
    if raw.get("statusCode") != 200:
        return None
    data = raw.get("data") or {}
    en = data.get("en") or {}
    if not en:
        return None

    bd = en.get("basicDetails", {})
    sc = en.get("schemeContent", {})
    ec = en.get("eligibilityCriteria", {}) or {}
    ap = en.get("applicationProcess", []) or []

    name = clean_name(bd.get("schemeName", ""))
    if not name:
        return None

    level_obj = bd.get("level", {}) or {}
    level = level_obj.get("value", "central")

    state_obj = bd.get("state")
    state_label = state_obj.get("label", "All") if state_obj else "All"
    states = [state_label] if state_label and level == "state" else ["All"]

    ministry_obj = bd.get("nodalMinistryName")
    ministry = ministry_obj.get("label", "") if ministry_obj else ""
    if not ministry:
        dept_obj = bd.get("nodalDepartmentName")
        ministry = dept_obj.get("label", "") if dept_obj else ""

    scheme_type_obj = bd.get("schemeType", {}) or {}
    scheme_type_label = scheme_type_obj.get("label", "Central" if level == "central" else "State")

    categories = [c.get("label", "") for c in (bd.get("schemeCategory") or [])]
    sub_cats = [c.get("label", "") for c in (bd.get("schemeSubCategory") or [])]
    beneficiaries = [b.get("label", "") for b in (bd.get("targetBeneficiaries") or [])]
    tags = bd.get("tags", []) or []

    brief = sc.get("briefDescription", "")
    desc_md = sc.get("detailedDescription_md", "") or ""
    benefits_md = sc.get("benefits_md", "") or ""
    exclusions_md = sc.get("exclusions_md", "") or ""

    benefit_types_raw = sc.get("benefitTypes")
    if isinstance(benefit_types_raw, dict):
        benefit_type = benefit_types_raw.get("label", "")
    elif isinstance(benefit_types_raw, list):
        benefit_type = ", ".join(b.get("label", "") for b in benefit_types_raw if b.get("label"))
    else:
        benefit_type = ""

    references = sc.get("references") or []
    refs_clean = [{"title": r.get("title", ""), "url": r.get("url", "")} for r in references if r.get("url")]
    apply_url = ""
    for ref in refs_clean:
        t = ref.get("title", "").lower()
        if "apply" in t or "portal" in t:
            apply_url = ref.get("url", "")
            break
    if not apply_url and refs_clean:
        apply_url = refs_clean[0]["url"]
    if not apply_url:
        apply_url = f"https://www.myscheme.gov.in/schemes/{slug}"

    elig_md = ec.get("eligibilityDescription_md", "") or ""

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
        "shortTitle":           bd.get("schemeShortTitle", ""),
        "level":                level,
        "type":                 scheme_type_label,
        "state":                states,
        "ministry":             ministry,
        "categories":           categories,
        "subCategories":        sub_cats,
        "targetBeneficiaries":  beneficiaries,
        "tags":                 tags,
        "dbtScheme":            bool(bd.get("dbtScheme", False)),
        "briefDescription":     brief,
        "descriptionMd":        desc_md[:3000],
        "benefitsMd":           benefits_md[:2000],
        "exclusionsMd":         exclusions_md[:1000],
        "eligibilityMd":        elig_md[:2000],
        "benefitType":          benefit_type,
        "howToApply":           how_to,
        "references":           refs_clean,
        "applyUrl":             apply_url,
        "source":               "myscheme.gov.in",
        "status":               "Published",
        # Eligibility engine fields (broad defaults)
        "minAge":               0,
        "maxAge":               99,
        "maxMonthlyIncome":     999999,
        "gender":               "any",
        "occupation":           "any",
        "categories_str":       "SC,ST,OBC,General",
        "isWidow":              "any",
        "annualBenefit":        0,
    }

# ── Fetch function (per-slug) ──────────────────────────────────────────────────
def fetch_slug(slug):
    url = f"{BASE_URL}?slug={slug}&lang=en"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code == 200:
            raw = r.json()
            return slug, raw, None
        else:
            return slug, None, f"HTTP {r.status_code}"
    except Exception as e:
        return slug, None, str(e)

# ── Main ───────────────────────────────────────────────────────────────────────
print("Loading slugs...")
with open(SLUGS_FILE, encoding='utf-8') as f:
    cleaned = json.load(f)
slugs = [s["schemeId"] for s in cleaned if s.get("schemeId")]
print(f"Total: {len(slugs)} slugs")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(TABLE_NAME)

start = time.time()
items_to_write = []

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {executor.submit(fetch_slug, s): s for s in slugs}
    done = 0
    for future in as_completed(futures):
        slug, raw, err = future.result()
        done += 1
        if err:
            with lock:
                counter["failed"] += 1
        elif raw:
            mapped = map_raw_to_scheme(slug, raw)
            if mapped:
                items_to_write.append(mapped)
                with lock:
                    counter["success"] += 1
            else:
                with lock:
                    counter["empty"] += 1
        
        if done % 100 == 0:
            elapsed = time.time() - start
            print(f"  Fetched {done}/{len(slugs)} | {elapsed:.0f}s | Mapped: {counter['success']}")

print(f"\nFetch complete! Mapped: {counter['success']} | Failed: {counter['failed']} | Empty: {counter['empty']}")

# Batch write to DynamoDB
print(f"\nWriting {len(items_to_write)} items to DynamoDB...")
write_success = 0
with table.batch_writer() as batch:
    for item in items_to_write:
        try:
            clean_item = sanitize_for_dynamo(item)
            if clean_item:
                batch.put_item(Item=clean_item)
                write_success += 1
        except Exception as e:
            print(f"Write error [{item.get('schemeId')}]: {e}")

elapsed = time.time() - start
print(f"\nAll done! Written: {write_success} items in {elapsed:.0f}s")
print(f"Expected write time: {elapsed:.0f}s total")
