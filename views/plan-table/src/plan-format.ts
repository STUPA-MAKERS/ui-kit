/*
 * The money texts of the plan views: copies of the helpers of STUPA-Workflow
 * (`shared/format-money`, the plan page), so a table reads the same as in the app.
 */

/** An amount as money in the format locale ("1.250,00 €"), or "–" without an amount. */
export function planMoney(value: number | null, locale: string): string {
  if (value === null || !Number.isFinite(value)) return '–';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
}

/** The digits of a sum in a table with amount fields: "150.475,00", without the sign. */
export function sumDigits(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
