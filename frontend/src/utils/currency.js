export const DEFAULT_CURRENCY = {
  code: 'MYR',
  symbol: 'RM'
};

export const SUPPORTED_CURRENCIES = [
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit (RM)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah (Rp)' },
  { code: 'THB', symbol: '฿', label: 'Thai Baht (฿)' }
];

/**
 * Deterministically formats amount in integer cents into standard currency display string.
 * Defaults to RM (MYR).
 * 
 * @param {number} cents 
 * @param {string|object} currency - Symbol string (e.g. 'RM') or currency object { code, symbol }
 * @returns {string} e.g. "RM 12.50" or "$12.50"
 */
export function formatCurrency(cents, currency = DEFAULT_CURRENCY) {
  const value = Number(cents);
  const safeCents = isNaN(value) ? 0 : value;
  const dollars = (safeCents / 100).toFixed(2);

  let symbol = 'RM';
  if (typeof currency === 'string' && currency.trim()) {
    symbol = currency.trim();
  } else if (currency && typeof currency === 'object' && currency.symbol) {
    symbol = currency.symbol.trim();
  }

  // Formatting spacing: symbols with multiple letters (RM, Rp, S$) have a space; $ or € usually tight
  const needsSpace = symbol.length > 1;
  return needsSpace ? `${symbol} ${dollars}` : `${symbol}${dollars}`;
}
