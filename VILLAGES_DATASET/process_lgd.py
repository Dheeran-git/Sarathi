"""
LGD Data Processor for Sarathi — FINAL VERSION
================================================
Handles merged-cell padding in LGD SpreadsheetML files.

Folder structure:
  lgd_data/
    andaman/
      village.xls
      gp_mapping.xls
    karnataka/
      village.xls
      gp_mapping.xls

Run:    python process_lgd.py
Output: lgd_hierarchy.json  +  village_to_panchayat.json
"""

import re
import json
import os
import glob

DATA_DIR         = "./lgd_data"
OUTPUT_HIERARCHY = "./lgd_hierarchy.json"
OUTPUT_GP_MAP    = "./village_to_panchayat.json"


def extract_rows(filepath):
    """Extract rows from LGD SpreadsheetML XML using regex."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    rows = []
    current = []
    for line in content.split('\n'):
        s = line.strip()
        if '<Row' in s and '/Row' not in s:
            current = []
        elif '</Row>' in s:
            if any(c.strip() for c in current):
                rows.append(current)
            current = []
        else:
            m = re.search(r'<Data[^>]*>([^<]*)</Data>', s)
            current.append(m.group(1).strip() if m else '')
    return rows


def compact(row):
    """Remove empty padding strings — return only non-empty values with their original indices."""
    return [(i, v) for i, v in enumerate(row) if v.strip()]


def find_header_row(rows):
    """Find the row index that contains District + Village + Code keywords."""
    for i, row in enumerate(rows):
        joined = ' '.join(row).lower()
        if 'district' in joined and 'village' in joined and 'code' in joined:
            return i
    return None


def build_col_map(header_row):
    """
    Given the padded header row, find the actual index of each key column
    by scanning for non-empty values and matching keywords.
    """
    col_map = {}
    non_empty = [(i, v) for i, v in enumerate(header_row) if v.strip()]

    for i, val in non_empty:
        vl = val.lower()
        if 'district name' in vl and 'sub' not in vl:
            col_map['district_name'] = i
        elif 'sub-district name' in vl or ('sub' in vl and 'district' in vl and 'name' in vl):
            col_map['subdistrict_name'] = i
        elif 'village code' in vl:
            col_map['village_code'] = i
        elif 'village name' in vl and 'village_name' not in col_map:
            # First "Village Name" is the English one
            col_map['village_name'] = i

    return col_map


def parse_village_file(filepath):
    rows = extract_rows(filepath)
    if not rows:
        return []

    header_idx = find_header_row(rows)
    if header_idx is None:
        print(f"  ERROR: Header not found in {filepath}")
        return []

    col_map = build_col_map(rows[header_idx])
    print(f"  Column indices -> {col_map}")

    missing = [k for k in ['district_name','subdistrict_name','village_code','village_name'] if k not in col_map]
    if missing:
        print(f"  WARNING: Could not map columns: {missing}")
        return []

    dn  = col_map['district_name']
    sdn = col_map['subdistrict_name']
    vc  = col_map['village_code']
    vn  = col_map['village_name']

    # Data starts 2 rows after header (skip the "(In English)" sub-header)
    records = []
    for row in rows[header_idx + 2:]:
        if len(row) <= max(dn, sdn, vc, vn):
            continue
        district    = row[dn].strip()
        subdistrict = row[sdn].strip()
        village_code = row[vc].strip()
        village_name = row[vn].strip()

        if not district or not village_code or not village_name:
            continue
        if village_code.lower() in ('village code', 'nan', ''):
            continue

        records.append({
            "district_name":    district,
            "subdistrict_name": subdistrict,
            "village_code":     village_code,
            "village_name":     village_name,
        })

    return records


def parse_gp_file(filepath):
    rows = extract_rows(filepath)
    if not rows:
        return {}

    # Find header row containing both 'village' and 'local body'
    header_idx = None
    for i, row in enumerate(rows):
        joined = ' '.join(row).lower()
        if 'village' in joined and 'local body' in joined:
            header_idx = i
            break

    if header_idx is None:
        print(f"  WARNING: GP header not found. Trying fallback fixed indices.")
        # Fallback: use known structure from LGD GP mapping files
        # village_code=9th non-empty, lb_code=13th non-empty, lb_name=14th non-empty
        gp_lookup = {}
        for row in rows[2:]:
            ne = [v for v in row if v.strip()]
            if len(ne) >= 14:
                vcode   = ne[9].strip()
                lb_code = ne[13].strip() if len(ne) > 13 else ''
                lb_name = ne[14].strip() if len(ne) > 14 else ''
                if vcode and vcode not in ('Village Code', 'nan', ''):
                    gp_lookup[vcode] = {"panchayat_code": lb_code, "panchayat_name": lb_name}
        return gp_lookup

    col_map = build_col_map(rows[header_idx])

    # For GP file we need village_code and local body columns
    # Re-scan header for local body specific cols
    header_row = rows[header_idx]
    vc_idx = lb_code_idx = lb_name_idx = None
    lb_name_found = False
    for i, val in enumerate(header_row):
        vl = val.lower().strip()
        if 'village code' in vl:
            vc_idx = i
        elif 'local body' in vl and 'code' in vl:
            lb_code_idx = i
        elif 'local body' in vl and 'name' in vl:
            lb_name_idx = i

    print(f"  GP col indices -> village_code:{vc_idx}, lb_code:{lb_code_idx}, lb_name:{lb_name_idx}")

    if vc_idx is None:
        print("  WARNING: village_code column not found in GP file")
        return {}

    gp_lookup = {}
    for row in rows[header_idx + 2:]:
        if len(row) <= vc_idx:
            continue
        vcode   = row[vc_idx].strip()
        lb_code = row[lb_code_idx].strip() if lb_code_idx and lb_code_idx < len(row) else ''
        lb_name = row[lb_name_idx].strip() if lb_name_idx and lb_name_idx < len(row) else ''
        if vcode and vcode not in ('', 'nan', 'Village Code'):
            gp_lookup[vcode] = {"panchayat_code": lb_code, "panchayat_name": lb_name}

    return gp_lookup


def process_state(state_folder):
    state_name = os.path.basename(state_folder).replace("_", " ").title()
    print(f"\nProcessing: {state_name}")

    village_file = os.path.join(state_folder, "village.xls")
    gp_file      = os.path.join(state_folder, "gp_mapping.xls")

    if not os.path.exists(village_file):
        print(f"  SKIP: village.xls not found")
        return {}, {}

    village_records = parse_village_file(village_file)
    print(f"  Village records: {len(village_records)}")
    if not village_records:
        return {}, {}

    gp_lookup = {}
    if os.path.exists(gp_file):
        gp_lookup = parse_gp_file(gp_file)
        print(f"  GP mappings: {len(gp_lookup)}")

    hierarchy = {}
    gp_map    = {}

    for rec in village_records:
        dist    = rec["district_name"]
        subdist = rec["subdistrict_name"]
        vname   = rec["village_name"]
        vcode   = rec["village_code"]

        hierarchy.setdefault(state_name, {})
        hierarchy[state_name].setdefault(dist, {})
        hierarchy[state_name][dist].setdefault(subdist, [])
        hierarchy[state_name][dist][subdist].append({"name": vname, "code": vcode})

        gp_info = gp_lookup.get(vcode, {})
        gp_map[vcode] = {
            "village_name":   vname,
            "subdistrict":    subdist,
            "district":       dist,
            "state":          state_name,
            "panchayat_code": gp_info.get("panchayat_code", ""),
            "panchayat_name": gp_info.get("panchayat_name", "")
        }

    village_count = sum(len(vs) for s in hierarchy.values() for d in s.values() for vs in d.values())
    print(f"  Villages in hierarchy: {village_count}")
    return hierarchy, gp_map


def main():
    full_hierarchy = {}
    full_gp_map    = {}

    state_folders = [f for f in glob.glob(os.path.join(DATA_DIR, "*")) if os.path.isdir(f)]
    if not state_folders:
        print(f"No state folders found in {DATA_DIR}")
        return

    print(f"Found {len(state_folders)} state(s): {[os.path.basename(f) for f in state_folders]}")

    for folder in sorted(state_folders):
        h, g = process_state(folder)
        full_hierarchy.update(h)
        full_gp_map.update(g)

    with open(OUTPUT_HIERARCHY, 'w', encoding='utf-8') as f:
        json.dump(full_hierarchy, f, ensure_ascii=False, indent=2)
    print(f"\nHierarchy saved: {OUTPUT_HIERARCHY}")

    with open(OUTPUT_GP_MAP, 'w', encoding='utf-8') as f:
        json.dump(full_gp_map, f, ensure_ascii=False, indent=2)
    print(f"GP map saved:    {OUTPUT_GP_MAP}")

    total_villages  = len(full_gp_map)
    total_districts = sum(len(d) for d in full_hierarchy.values())
    print(f"\nSummary:")
    print(f"   States:    {len(full_hierarchy)}")
    print(f"   Districts: {total_districts}")
    print(f"   Villages:  {total_villages}")

    # Preview
    print("\nSample hierarchy:")
    for state, districts in list(full_hierarchy.items())[:1]:
        for dist, subdists in list(districts.items())[:1]:
            for subdist, villages in list(subdists.items())[:1]:
                print(f"  {state} > {dist} > {subdist} > {villages[:3]}")

    print("\nSample GP map:")
    for k, v in list(full_gp_map.items())[:3]:
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
