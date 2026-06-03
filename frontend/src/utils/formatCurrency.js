/**
 * Format a number for display based on currency.
 * IDR  → 5.000,00  (Indonesian locale, no decimals)
 * USD  → $5,000.00 (US locale)
 * JPY  → ¥5,000    (no decimals)
 */
export function formatCurrency(amount, currency = 'IDR') {
  const num = parseFloat(amount) || 0;
  try {
    const locales = { IDR: 'id-ID', USD: 'en-US', SGD: 'en-SG', MYR: 'ms-MY', CNY: 'zh-CN', JPY: 'ja-JP', EUR: 'de-DE', GBP: 'en-GB', AUD: 'en-AU' };
    const locale = locales[currency] || 'id-ID';
    const decimals = ['JPY'].includes(currency) ? 0 : currency === 'IDR' ? 0 : 2;
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString('id-ID')}`;
  }
}

/**
 * Format a plain number (qty, weight, volume) based on locale.
 * Used for non-currency fields.
 */
export function formatNumber(num, decimals = 2) {
  const n = parseFloat(num) || 0;
  return n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Parse a localized string back to a float.
 * "5.000,50" → 5000.50
 */
export function parseLocalized(str) {
  if (!str) return 0;
  const cleaned = String(str)
    .replace(/[^0-9,\-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}
