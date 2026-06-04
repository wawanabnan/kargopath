import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from quotations.models import ChargeMaster
from users.models import Tenant
t = Tenant.objects.first()
cm, c = ChargeMaster.objects.get_or_create(
    tenant=t, name='PPN 1.1%',
    defaults={
        'category': 'other', 'default_unit': 'Lot',
        'default_rate': 0, 'default_currency': 'IDR',
        'taxable_default': False, 'is_tax': True,
        'tax_percent': 1.10, 'is_active': True,
    }
)
print('Created' if c else 'Exists')
