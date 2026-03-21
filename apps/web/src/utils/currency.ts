/**
 * Currency Utilities
 * Simple currency symbol lookup
 */

export const CURRENCIES: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BDT: '৳',
};

export const DEFAULT_CURRENCY = 'BDT';

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode?: string): string {
  const code = currencyCode || DEFAULT_CURRENCY;
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY]!;
}
