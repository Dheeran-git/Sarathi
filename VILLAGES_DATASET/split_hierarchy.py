"""
split_hierarchy.py
Splits lgd_hierarchy.json + village_to_panchayat.json into tiny per-block
JSON files for the Sarathi frontend.

Output structure (inside sarathi-frontend/public/data/locations/):
  states.json                                       — ["Andaman", "Andhra Pradesh", ...]
  districts/{state_slug}.json                       — ["Nicobars", ...]
  blocks/{state_slug}/{district_slug}.json          — ["Car Nicobar", ...]
  villages/{state_slug}/{district_slug}/{block_slug}.json — [{name, code, panchayatCode, panchayatName}, ...]
"""

import json
import os
import re
import sys

# ── Paths ────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HIERARCHY_FILE = os.path.join(SCRIPT_DIR, "lgd_hierarchy.json")
V2P_FILE = os.path.join(SCRIPT_DIR, "village_to_panchayat.json")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "sarathi-frontend", "public", "data", "locations")


def slugify(name):
    """Convert a name like 'Uttar Pradesh' → 'uttar_pradesh'."""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def main():
    print("Loading lgd_hierarchy.json ...")
    with open(HIERARCHY_FILE, "r", encoding="utf-8") as f:
        hierarchy = json.load(f)

    print("Loading village_to_panchayat.json ...")
    with open(V2P_FILE, "r", encoding="utf-8") as f:
        v2p = json.load(f)

    # Build a quick lookup: village_code → {panchayat_code, panchayat_name}
    panchayat_lookup = {}
    for code, info in v2p.items():
        panchayat_lookup[code] = {
            "panchayatCode": info.get("panchayat_code", ""),
            "panchayatName": info.get("panchayat_name", ""),
        }

    # Clear / create output dir
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ── 1. states.json ───────────────────────────────────────────────────
    states = sorted(hierarchy.keys())
    _write(os.path.join(OUTPUT_DIR, "states.json"), states)
    print(f"  [OK] states.json  ({len(states)} states)")

    total_districts = 0
    total_blocks = 0
    total_villages = 0

    for state in states:
        state_slug = slugify(state)
        state_data = hierarchy[state]  # dict of district → ...

        # ── 2. districts/{state_slug}.json ───────────────────────────────
        districts = sorted(state_data.keys())
        dist_dir = os.path.join(OUTPUT_DIR, "districts")
        os.makedirs(dist_dir, exist_ok=True)
        _write(os.path.join(dist_dir, f"{state_slug}.json"), districts)
        total_districts += len(districts)

        for district in districts:
            district_slug = slugify(district)
            district_data = state_data[district]  # dict of block → [villages]

            # ── 3. blocks/{state_slug}/{district_slug}.json ──────────────
            blocks = sorted(district_data.keys())
            block_dir = os.path.join(OUTPUT_DIR, "blocks", state_slug)
            os.makedirs(block_dir, exist_ok=True)
            _write(os.path.join(block_dir, f"{district_slug}.json"), blocks)
            total_blocks += len(blocks)

            for block in blocks:
                block_slug = slugify(block)
                village_list = district_data[block]  # list of {name, code}

                # ── 4. villages/{state}/{district}/{block}.json ──────────
                enriched = []
                for v in village_list:
                    code = str(v.get("code", ""))
                    p = panchayat_lookup.get(code, {})
                    enriched.append({
                        "name": v.get("name", ""),
                        "code": code,
                        "panchayatCode": p.get("panchayatCode", ""),
                        "panchayatName": p.get("panchayatName", ""),
                    })
                # Sort by village name
                enriched.sort(key=lambda x: x["name"])

                village_dir = os.path.join(OUTPUT_DIR, "villages", state_slug, district_slug)
                os.makedirs(village_dir, exist_ok=True)
                _write(os.path.join(village_dir, f"{block_slug}.json"), enriched)
                total_villages += len(enriched)

    print(f"\n[DONE] Wrote {len(states)} states, {total_districts} districts, "
          f"{total_blocks} blocks, {total_villages} villages")
    print(f"   Output: {os.path.abspath(OUTPUT_DIR)}")


def _write(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
