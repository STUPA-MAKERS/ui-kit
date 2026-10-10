import type { UiLang } from '../intl/intl';

/**
 * The result of {@link parseMoney}.
 *
 * - `empty`: the text holds no amount (blank, or only a minus sign while the user types).
 * - `valid`: `canonical` is a dot-decimal string without grouping (`"-1234.5"`), with at
 *   most 2 decimals. The decimals stay as typed: the parser never rounds.
 * - `invalid`: the text is not an amount in the locale, or it has more than 2 decimals.
 */
export type MoneyParseResult =
  | { readonly status: 'empty' }
  | { readonly status: 'valid'; readonly canonical: string }
  | { readonly status: 'invalid' };

/** The most decimals an amount of money can have (cents). */
export const MONEY_MAX_DECIMALS = 2;

const SEPARATORS: Record<UiLang, { decimal: string; group: string }> = {
  de: { decimal: ',', group: '.' },
  en: { decimal: '.', group: ',' },
};

function escape(ch: string): string {
  return ch === '.' ? '\\.' : ch;
}

/** The amount pattern of one locale: plain digits or groups of 3, then an optional
 *  decimal part. A grouped integer starts with a digit from 1 to 9. */
function amountPattern(lang: UiLang): RegExp {
  const g = escape(SEPARATORS[lang].group);
  const d = escape(SEPARATORS[lang].decimal);
  return new RegExp(`^(\\d+|[1-9]\\d{0,2}(?:${g}\\d{3})+)?(?:${d}(\\d*))?$`);
}

const PATTERNS: Record<UiLang, RegExp> = { de: amountPattern('de'), en: amountPattern('en') };

/**
 * Parse an amount of money that a user typed in the locale `lang`.
 *
 * DE uses `.` for thousands and `,` for decimals (`1.234,56`); EN uses `,` for thousands
 * and `.` for decimals (`1,234.56`). A thousands separator is valid only between groups
 * of 3 digits. A trailing decimal separator (`12,`) is valid, so the text stays valid
 * while the user types. More than {@link MONEY_MAX_DECIMALS} decimals and any other text
 * give `invalid`; the parser never rounds and never drops characters. A leading `-` and
 * a `€` sign at either end are allowed.
 */
export function parseMoney(raw: string | null | undefined, lang: UiLang): MoneyParseResult {
  let s = (raw ?? '').trim();
  if (s.startsWith('€')) s = s.slice(1).trim();
  if (s.endsWith('€')) s = s.slice(0, -1).trim();
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  if (!s) return { status: 'empty' };
  const match = PATTERNS[lang].exec(s);
  if (!match) return { status: 'invalid' };
  const intRaw = match[1] ?? '';
  const frac = match[2] ?? '';
  if (!intRaw && !frac) return { status: 'invalid' };
  if (frac.length > MONEY_MAX_DECIMALS) return { status: 'invalid' };
  const int = intRaw.split(SEPARATORS[lang].group).join('').replace(/^0+(?=\d)/, '') || '0';
  const canonical = frac ? `${int}.${frac}` : int;
  return { status: 'valid', canonical: neg ? `-${canonical}` : canonical };
}

/**
 * Read a model value: a number or a canonical dot-decimal string (`"1234.56"`) as the
 * backend sends it. The result keeps every decimal of the model, because a model value
 * is not user input. Anything else falls back to {@link parseMoney} in `lang`.
 */
export function parseMoneyModel(
  value: string | number | null | undefined,
  lang: UiLang,
): MoneyParseResult {
  if (value == null) return { status: 'empty' };
  if (typeof value === 'number') {
    return Number.isFinite(value)
      ? { status: 'valid', canonical: String(value) }
      : { status: 'invalid' };
  }
  const s = value.trim();
  if (!s) return { status: 'empty' };
  const canonical = /^(-?)0*(\d+(?:\.\d+)?)$/.exec(s);
  if (canonical) return { status: 'valid', canonical: `${canonical[1]}${canonical[2]}` };
  return parseMoney(s, lang);
}
