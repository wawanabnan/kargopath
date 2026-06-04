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

# ── Admin user ──
if not User.objects.filter(email='admin@kargopath.co').exists():
    User.objects.create_user(
        email='admin@kargopath.co', password='admin123456',
        role='ADMIN', tenant=tenant, is_staff=True, is_superuser=True,
        first_name='Admin', last_name='Kargopath'
    )
    print('Created admin@kargopath.co')
else:
    print('admin@kargopath.co already exists')

# ── Demo client ──
if not User.objects.filter(email='it@dakarash.co.id').exists():
    User.objects.create_user(
        email='it@dakarash.co.id', password='client123456',
        role='CLIENT', tenant=tenant,
        first_name='Demo', last_name='Client'
    )
    print('Created it@dakarash.co.id')
else:
    print('it@dakarash.co.id already exists')

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
