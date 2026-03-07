import json
import os
import boto3
import time
import re
from decimal import Decimal

# ── helpers ──────────────────────────────────────────────────────────────────

def extract_text_from_rich(nodes):
    """Recursively extract plain text from myScheme's rich-text node tree"""
    if not nodes:
        return ""
    texts = []
    if isinstance(nodes, list):
        for node in nodes:
            texts.append(extract_text_from_rich(node))
    elif isinstance(nodes, dict):
        if "text" in nodes:
            texts.append(nodes["text"])
        if "children" in nodes:
            texts.append(extract_text_from_rich(nodes["children"]))
    return " ".join(t for t in texts if t.strip())

def sanitize_for_dynamo(obj):
    """Remove empty strings/None, convert floats to Decimal"""
    if isinstance(obj, dict):
        return {k: sanitize_for_dynamo(v) for k, v in obj.items()
                if v is not None and v != "" and v != [] and v != {}}
    if isinstance(obj, list):
        cleaned = [sanitize_for_dynamo(i) for i in obj
                   if i is not None and i != "" and i != [] and i != {}]
        return cleaned if cleaned else None
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj

def map_scheme(slug, raw):
    data = raw.get("data", {})
    en   = data.get("en", {})
    bd   = en.get("basicDetails", {})
    sc   = en.get("schemeContent", {})
    ec   = en.get("eligibilityCriteria", {}) or {}
    ap   = en.get("applicationProcess", []) or []

    # Basic fields
    name        = bd.get("schemeName", "")
    short_title = bd.get("schemeShortTitle", "")
    level       = bd.get("level", {}).get("value", "central")  # central / state
    state_obj   = bd.get("state")
    state       = state_obj.get("label", "All") if state_obj else "All"
    ministry    = (bd.get("nodalMinistryName") or {}).get("label", "")
    department  = (bd.get("nodalDepartmentName") or {}).get("label", "")
    dbt         = bd.get("dbtScheme", False)
    tags        = bd.get("tags", [])
    categories  = [c.get("label", "") for c in (bd.get("schemeCategory") or [])]
    sub_cats    = [c.get("label", "") for c in (bd.get("schemeSubCategory") or [])]
    beneficiary = [b.get("label", "") for b in (bd.get("targetBeneficiaries") or [])]

    # Content
    brief       = sc.get("briefDescription", "")
    desc_md     = sc.get("detailedDescription_md", "")
    benefits_md = sc.get("benefits_md", "")
    exclusions_md = sc.get("exclusions_md", "")
    benefit_types = [b.get("label","") for b in (sc.get("benefitTypes") or [])]
    references  = [{"title": r.get("title",""), "url": r.get("url","")}
                   for r in (sc.get("references") or []) if r.get("url")]

    # Eligibility
    elig_md     = ec.get("eligibilityDescription_md", "")

    # Application process — extract mode + plain text steps
    how_to = []
    for proc in (ap if isinstance(ap, list) else []):
        mode  = proc.get("mode", "")
        url   = proc.get("url", "")
        steps = extract_text_from_rich(proc.get("process", []))
        how_to.append({"mode": mode, "url": url, "steps": steps[:1000]})

    return {
        "schemeId":         slug,
        "nameEnglish":      name,
        "shortTitle":       short_title,
        "level":            level,
        "states":           [state] if state != "All" else ["All"],
        "ministry":         ministry,
        "department":       department,
        "categories":       categories,
        "subCategories":    sub_cats,
        "targetBeneficiaries": beneficiary,
        "tags":             tags,
        "dbtScheme":        dbt,
        "briefDescription": brief,
        "descriptionMd":    desc_md[:2000] if desc_md else "",
        "benefitsMd":       benefits_md[:2000] if benefits_md else "",
        "exclusionsMd":     exclusions_md[:1000] if exclusions_md else "",
        "benefitTypes":     benefit_types,
        "eligibilityMd":    elig_md[:2000] if elig_md else "",
        "howToApply":       how_to,
        "references":       references,
        "source":           "myscheme.gov.in",
        "applyUrl":         references[0]["url"] if references else "",
    }

# ── main ─────────────────────────────────────────────────────────────────────

folder  = "scheme_jsons"
files   = os.listdir(folder)
print(f"Mapping {len(files)} scheme files...")

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table    = dynamodb.Table('SarathiSchemes')

success, failed, skipped = 0, 0, 0

for i, fname in enumerate(files):
    slug = fname.replace(".json", "")
    path = os.path.join(folder, fname)

    try:
        with open(path, encoding='utf-8') as f:
            raw = json.load(f)

        if raw.get("statusCode") != 200 or "data" not in raw:
            skipped += 1
            continue

        scheme = map_scheme(slug, raw)
        item   = sanitize_for_dynamo(scheme)
        if not item:
            skipped += 1
            continue

        table.put_item(Item=item)
        success += 1

        if success % 20 == 0:
            time.sleep(1)  # throttle to ~20 writes/sec

        if (i + 1) % 200 == 0:
            print(f"Progress: {i+1}/{len(files)} | Seeded: {success} | Failed: {failed}")

    except Exception as e:
        print(f"Error [{slug}]: {e}")
        failed += 1

print(f"\nDone. Seeded: {success} | Skipped: {skipped} | Failed: {failed}")