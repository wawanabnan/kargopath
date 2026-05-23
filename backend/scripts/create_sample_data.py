"""
Script untuk membuat sample data (lanjutan — Sample 1 sudah ada).
Jalankan: py -3 scripts/create_sample_data.py
"""

import os, sys, django
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import date, timedelta
import datetime
from django.contrib.auth import get_user_model
from users.models import Tenant
from quotations.models import QuotationRequest, Quotation, QuotationItem
from shipments.models import Shipment, ShipmentMilestone

User   = get_user_model()
tenant = Tenant.objects.get(id=1)
sales  = User.objects.get(email='sales@kargopath.com')
ops    = User.objects.get(email='ops@kargopath.com')
client = User.objects.get(email='it@dakarsh.co.id')

def make_quotation(req, q_num, items_data, status='SENT', notes=''):
    q = Quotation.objects.create(
        tenant=tenant, quotation_number=q_num, request=req, created_by=sales,
        status=status, currency='IDR', discount_type='AMOUNT',
        discount=Decimal('0'), tax_rate=Decimal('11'),
        valid_until=date.today() + timedelta(days=14), notes=notes,
    )
    for item in items_data:
        qty, price = Decimal(str(item['qty'])), Decimal(str(item['price']))
        QuotationItem.objects.create(
            tenant=tenant, quotation=q, category=item['cat'],
            charge_name=item['name'], qty=qty, unit=item['unit'],
            unit_price=price, amount=qty * price, currency='IDR',
        )
    q.recalculate_totals()
    print(f"  ✓ {q.quotation_number} | {q.status} | IDR {q.grand_total:,.0f}")
    return q

# ── Sample 2: Air D2D Jakarta → KL (SENT) ────────────────────────────────────
print("Sample 2: Air D2D Jakarta → Kuala Lumpur...")
req2 = QuotationRequest.objects.create(
    tenant=tenant, submitted_by=client, sales_in_charge=sales,
    status='QUOTED', mode='air', scope='d2d',
    pol='CGK', pol_name='Soekarno-Hatta, Jakarta',
    pod='KUL', pod_name='KLIA, Kuala Lumpur',
    pickup_address='Jl. Raya Bekasi KM 25, Cikarang Barat, Bekasi 17530', pickup_city='Bekasi',
    delivery_address='No. 12, Jalan Teknologi 3, Shah Alam 40150', delivery_city='Shah Alam',
    commodity='Garment & Textile', hs_code='6204.62',
    package_type='Carton', package_qty=120,
    gross_weight=Decimal('850'), volume_cbm=Decimal('4.2'),
    incoterms='DAP', cargo_value=Decimal('45000'), cargo_currency='USD',
    shipper_same_as_client=True,
    shipper_company='PT Dakarsh Indonesia', shipper_pic='Sari Dewi', shipper_phone='+62 812 9876 5432',
    consignee_company='Fashion House Malaysia Sdn Bhd', consignee_pic='Ahmad Razali', consignee_phone='+60 12 345 6789',
    target_etd=date.today() + timedelta(days=3),
    special_instructions='Handle with care. Temperature sensitive. Keep dry.',
)
make_quotation(req2, 'Q-2026002-KLAIR', [
    {'cat': 'freight',  'name': 'Air Freight CGK-KUL (850 KG)',     'qty': 850, 'unit': 'KG',  'price': 28000},
    {'cat': 'trucking', 'name': 'Origin Pickup (Bekasi)',            'qty': 1,   'unit': 'Lot', 'price': 850000},
    {'cat': 'customs',  'name': 'Export Customs Clearance',         'qty': 1,   'unit': 'Lot', 'price': 950000},
    {'cat': 'handling', 'name': 'Airport Handling Fee',             'qty': 1,   'unit': 'Lot', 'price': 450000},
    {'cat': 'trucking', 'name': 'Destination Delivery (Shah Alam)', 'qty': 1,   'unit': 'Lot', 'price': 1200000},
    {'cat': 'customs',  'name': 'Import Customs Clearance (MY)',    'qty': 1,   'unit': 'Lot', 'price': 1500000},
    {'cat': 'other',    'name': 'Fuel Surcharge (FSC)',             'qty': 850, 'unit': 'KG',  'price': 3500},
], status='SENT')

# ── Sample 3: Sea LCL D2P Surabaya → Rotterdam (PENDING) ─────────────────────
print("Sample 3: Sea LCL D2P Surabaya → Rotterdam (PENDING)...")
req3 = QuotationRequest.objects.create(
    tenant=tenant, submitted_by=client,
    status='PENDING', mode='sea', scope='d2p', sea_type='LCL',
    pickup_address='Jl. Rungkut Industri III No. 45, Surabaya 60293', pickup_city='Surabaya',
    pod='NLRTM', pod_name='Rotterdam, Netherlands',
    commodity='Furniture & Home Decor', hs_code='9403.60',
    package_type='Crate', package_qty=35,
    gross_weight=Decimal('2800'), volume_cbm=Decimal('18.5'),
    incoterms='CFR', cargo_value=Decimal('85000'), cargo_currency='USD',
    shipper_same_as_client=True,
    shipper_company='PT Dakarsh Indonesia', shipper_pic='Hendra Wijaya', shipper_phone='+62 31 8888 9999',
    consignee_company='Dutch Home Imports BV', consignee_pic='Jan van der Berg', consignee_phone='+31 10 123 4567',
    special_instructions='Fragile. Wooden crates must be ISPM-15 certified.',
)
print(f"  ✓ {req3.reference_no} | PENDING")

# ── Sample 4: Land D2D Jakarta → Surabaya (ACCEPTED + Shipment) ──────────────
print("Sample 4: Land D2D Jakarta → Surabaya (ACCEPTED + Shipment)...")
req4 = QuotationRequest.objects.create(
    tenant=tenant, submitted_by=client, sales_in_charge=sales,
    status='ACCEPTED', mode='land', scope='d2d',
    pickup_address='Jl. Hayam Wuruk No. 8, Jakarta Pusat 10120', pickup_city='Jakarta Pusat',
    delivery_address='Jl. Ahmad Yani No. 100, Surabaya 60234', delivery_city='Surabaya',
    land_origin_type='warehouse', land_dest_type='business',
    commodity='Industrial Machinery Parts',
    package_type='Pallet', package_qty=8,
    gross_weight=Decimal('3200'), volume_cbm=Decimal('12.0'),
    incoterms='DAP', cargo_value=Decimal('120000'), cargo_currency='USD',
    shipper_same_as_client=True,
    shipper_company='PT Dakarsh Indonesia', shipper_pic='Rudi Hartono', shipper_phone='+62 21 3333 4444',
    consignee_company='PT Mesin Nusantara', consignee_pic='Pak Agus', consignee_phone='+62 31 7777 8888',
)
q4 = make_quotation(req4, 'Q-2026003-LNDSBY', [
    {'cat': 'trucking', 'name': 'Trucking Jakarta → Surabaya (CDD Long)', 'qty': 1, 'unit': 'Unit', 'price': 8500000},
    {'cat': 'handling', 'name': 'Loading & Lashing Fee',                  'qty': 1, 'unit': 'Lot',  'price': 500000},
    {'cat': 'other',    'name': 'Toll & Fuel Surcharge',                  'qty': 1, 'unit': 'Lot',  'price': 750000},
], status='ACCEPTED')

year = datetime.datetime.now().year
seq  = Shipment.objects.filter(created_at__year=year).count() + 1
ship = Shipment.objects.create(
    tenant=tenant, shipment_number=f'LP-{year}-{seq:05d}',
    quotation=q4, client=client, status='IN_TRANSIT',
    awb_bl_number='JKT-SBY-2026-0042',
)
for code, desc, loc in [
    ('BOOKED',     'Shipment booked and confirmed.',              'Jakarta'),
    ('PICKUP',     'Cargo picked up from shipper warehouse.',     'Jakarta Pusat'),
    ('DEPARTED',   'Truck departed from Jakarta.',                'Jakarta'),
    ('IN_TRANSIT', 'Truck in transit. Currently passing Semarang.', 'Semarang'),
]:
    ShipmentMilestone.objects.create(
        tenant=tenant, shipment=ship,
        status_code=code, description=desc, location=loc, updated_by=ops,
    )
print(f"  ✓ Shipment {ship.shipment_number} | IN_TRANSIT | 4 milestones")

print()
print("=" * 50)
print(f"QuotationRequests : {QuotationRequest.objects.filter(tenant=tenant).count()}")
print(f"Quotations        : {Quotation.objects.filter(tenant=tenant).count()}")
print(f"Shipments         : {Shipment.objects.filter(tenant=tenant).count()}")
print("Done!")
