"""
Import location data from location_full.csv.
Run: py -3 scripts/import_locations.py
"""
import os, sys, csv, django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from locations.models import Location

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'data', 'location_full.csv'
)

def null(val):
    if val in ('\\N', '', None):
        return None
    return val

def to_decimal(val):
    v = null(val)
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None

print(f"Reading: {CSV_PATH}")

with open(CSV_PATH, encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print(f"Total rows: {len(rows)}")

# ── Pass 1: insert all records in batches with explicit transaction ────────────
id_to_code = {}
BATCH = 500
created_total = 0

for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    with transaction.atomic():
        for row in batch:
            csv_id = row['id'].strip().strip('"')
            code   = row['code'].strip().strip('"')
            id_to_code[csv_id] = code

            Location.objects.update_or_create(
                code=code,
                defaults=dict(
                    name         = row['name'].strip().strip('"'),
                    display_name = null(row.get('display_name','').strip().strip('"')) or row['name'].strip().strip('"'),
                    kind         = row['kind'].strip().strip('"'),
                    iata_code    = null(row.get('iata_code','').strip().strip('"')),
                    unlocode     = null(row.get('unlocode','').strip().strip('"')),
                    latitude     = to_decimal(row.get('latitude','')),
                    longitude    = to_decimal(row.get('longitude','')),
                    iso_code     = null(row.get('iso_code','').strip().strip('"')),
                    postal_code  = null(row.get('postal_code','').strip().strip('"')),
                    source       = null(row.get('source','').strip().strip('"')),
                    timezone     = null(row.get('timezone','').strip().strip('"')),
                    country_code = null(row.get('country_code','').strip().strip('"')),
                    status       = null(row.get('status','active').strip().strip('"')) or 'active',
                    parent       = None,
                )
            )
    created_total += len(batch)
    print(f"  Processed {created_total}/{len(rows)}...")

print(f"Pass 1 done — DB count: {Location.objects.count()}")

# ── Pass 2: set parent FK ─────────────────────────────────────────────────────
print("Pass 2: linking parents...")
code_to_pk = dict(Location.objects.values_list('code', 'pk'))
print(f"  code_to_pk size: {len(code_to_pk)}")

updates = []
for row in rows:
    csv_id    = row['id'].strip().strip('"')
    code      = row['code'].strip().strip('"')
    parent_id = null(row.get('parent_id','').strip().strip('"'))

    if parent_id and parent_id in id_to_code:
        parent_code = id_to_code[parent_id]
        parent_pk   = code_to_pk.get(parent_code)
        child_pk    = code_to_pk.get(code)
        if parent_pk and child_pk:
            updates.append((child_pk, parent_pk))

print(f"  Linking {len(updates)} relationships...")
for i in range(0, len(updates), BATCH):
    batch = updates[i:i+BATCH]
    with transaction.atomic():
        for child_pk, parent_pk in batch:
            Location.objects.filter(pk=child_pk).update(parent_id=parent_pk)
    print(f"  Linked {min(i+BATCH, len(updates))}/{len(updates)}...")

print("Pass 2 done")

# ── Rebuild MPTT ──────────────────────────────────────────────────────────────
print("Rebuilding MPTT tree...")
Location.objects.rebuild()
print("Tree rebuilt.")

print()
print("=" * 50)
print(f"Total: {Location.objects.count()}")
from django.db.models import Count
for item in Location.objects.values('kind').annotate(c=Count('id')).order_by('kind'):
    print(f"  {item['kind']:20s}: {item['c']}")
print("Done!")
