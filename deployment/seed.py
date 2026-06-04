"""
Seed script — creates default admin user, TaxMasters, and PPN ChargeMaster.
Run: python manage.py shell < deployment/seed.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Tenant
from quotations.models import TaxMaster, ChargeMaster

User = get_user_model()

# ── Tenant ──
tenant, _ = Tenant.objects.get_or_create(
    id=1,
    defaults=dict(name='PT. Kargopath Logistic Nusantara', code='KGP', default_tax_rate=11.00)
)

# ── Default users with known passwords ──
defaults = [
    dict(email='admin@kargopath.co',  password='admin123456', role='ADMIN',  first='Admin', last='Kargopath', staff=True),
    dict(email='sales@kargopath.com', password='sales123456', role='SALES',  first='Sales', last='User',      staff=False),
    dict(email='ferry@kargopath.com', password='sales123456', role='SALES',  first='Ferry', last='Pratama',   staff=False),
    dict(email='ratna@kargopath.com', password='sales123456', role='SALES',  first='Ratna', last='Kumala',    staff=False),
    dict(email='ops@kargopath.com',   password='ops123456',   role='OPS',    first='Ops',   last='User',      staff=False),
    dict(email='it@dakarash.co.id',   password='client123456',role='CLIENT', first='Demo',  last='Client',    staff=False),
]
for d in defaults:
    u, created = User.objects.get_or_create(email=d['email'], defaults=dict(
        tenant=tenant, role=d['role'], first_name=d['first'], last_name=d['last'],
        is_staff=d.get('staff', False), is_superuser=d.get('staff', False),
    ))
    if created:
        u.set_password(d['password'])
        u.save()
        print(f'  Created: {d["email"]} ({d["role"]})')
    else:
        # Ensure password is correct even if user existed from dump
        u.set_password(d['password'])
        u.save()
        print(f'  Reset pwd: {d["email"]} ({d["role"]})')

# ── TaxMasters ──
taxes = [
    dict(code='VAT1', description='PPN - Usaha Logistik', display='VAT', rate=1.10),
    dict(code='VAT2', description='PPN Barang Dagangan', display='VAT', rate=11.00),
]
for t in taxes:
    tm, created = TaxMaster.objects.get_or_create(tenant=tenant, code=t['code'], defaults=t)
    print(f'  {"Created" if created else "Exists"}: {tm.code} ({tm.rate}%)')

# ── PPN ChargeMaster ──
cm, created = ChargeMaster.objects.get_or_create(
    tenant=tenant, name='PPN 1.1%',
    defaults=dict(
        category='other', default_unit='Lot', default_rate=0,
        default_currency='IDR', taxable_default=False, is_active=True,
    )
)
print(f'  {"Created" if created else "Exists"}: {cm.name}')

print('Seed complete.')
