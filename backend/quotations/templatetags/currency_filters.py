from django import template
from decimal import Decimal, ROUND_HALF_UP

register = template.Library()

@register.filter
def currency_format(value, currency='IDR'):
    if value is None:
        return '-'
    try:
        val = Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except (ValueError, TypeError):
        return str(value)

    if currency == 'IDR':
        # Indonesian: 1.000,00
        whole = int(val)
        frac = f'{abs(val - whole) * 100:.0f}'.zfill(2)
        whole_str = f'{whole:,}'.replace(',', '.')
        return f'{whole_str},{frac}'
    else:
        # USD/international: 1,000.00
        return f'{val:,.2f}'
