"""
Import location data from CSV.
Format: id,code,name,kind,lft,rght,iata_code,unlocode,latitude,longitude,
        parent_id,iso_code,postal_code,source,status,timezone,altitude,
        country_code,display_name

Run: py -3 scripts/import_locations.py
"""
import os, sys, csv, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from locations.models import Location

CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        'data', 'location.csv')

def null(val):
    """Convert backslash-N or empty string to None."""
    if val in ('\\N', '', None):
        return None
    return val

def decimal_or_none(val):
    v = null(val)
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None

print(f"Reading: {CSV_PATH}")

# ── Pass 1: Create all Location records (without parent) ──────────────────────
id_to_code = {}   # original CSV id → code (for parent linking)
created = 0
skipped = 0

with open(CSV_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows: {len(rows)}")

for row in rows:
    csv_id   = row['id'].strip().strip('"')
    code     = row['code'].strip().strip('"')
    name     = row['name'].strip().strip('"')
    kind     = row['kind'].strip().strip('"')
    status   = null(row.get('status', 'active').strip().strip('"')) or 'active'
    iata     = null(row.get('iata_code', '').strip().strip('"'))
    unlocode = null(row.get('unlocode', '').strip().strip('"'))
    lat      = decimal_or_none(row.get('latitude', '').strip().strip('"'))
    lng      = decimal_or_none(row.get('longitude', '').strip().strip('"'))
    iso      = null(row.get('iso_code', '').strip().strip('"'))
    postal   = null(row.get('postal_code', '').strip().strip('"'))
    source   = null(row.get('source', '').strip().strip('"'))
    tz       = null(row.get('timezone', '').strip().strip('"'))
    cc       = null(row.get('country_code', '').strip().strip('"'))
    disp     = null(row.get('display_name', '').strip().strip('"'))

    id_to_code[csv_id] = code

    obj, was_created = Location.objects.update_or_create(
        code=code,
        defaults=dict(
            name=name,
            display_name=disp or name,
            kind=kind,
            iata_code=iata,
            unlocode=unlocode,
            latitude=lat,
            longitude=lng,
            iso_code=iso,
            postal_code=postal,
            source=source,
            timezone=tz,
            country_code=cc,
            status=status,
            parent=None,  # set in pass 2
        )
    )
    if was_created:
        created += 1
    else:
        skipped += 1

print(f"Pass 1 done — created: {created}, updated: {skipped}")

# ── Pass 2: Set parent relationships ─────────────────────────────────────────
linked = 0
missing = 0

with open(CSV_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        csv_id    = row['id'].strip().strip('"')
        code      = row['code'].strip().strip('"')
        parent_id = null(row.get('parent_id', '').strip().strip('"'))

        if parent_id and parent_id in id_to_code:
            parent_code = id_to_code[parent_id]
            try:
                loc    = Location.objects.get(code=code)
                parent = Location.objects.get(code=parent_code)
                if loc.parent_id != parent.pk:
                    loc.parent = parent
                    loc.save(update_fields=['parent'])
                linked += 1
            except Location.DoesNotExist:
                missing += 1
        elif parent_id:
            missing += 1

print(f"Pass 2 done — linked: {linked}, missing parent: {missing}")

# ── Rebuild MPTT tree ─────────────────────────────────────────────────────────
print("Rebuilding MPTT tree...")
Location.objects.rebuild()
print("Tree rebuilt.")

print()
print("=" * 50)
print(f"Total locations: {Location.objects.count()}")
for kind in Location.objects.values_list('kind', flat=True).distinct().order_by('kind'):
    count = Location.objects.filter(kind=kind).count()
    print(f"  {kind:20s}: {count}")
print("Done!")
