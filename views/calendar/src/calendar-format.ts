import type { UiKitTextKey } from '@stupa-makers/ui-kit';

/*
 * The date texts of the calendar views: copies of the helpers of STUPA-Workflow
 * (`shared/date-format`). Every formatter takes the `Intl` format locale (`de-DE`, `en-GB`).
 */

/** The translate function of the views. */
export type Translate = (key: UiKitTextKey, params?: Record<string, string | number>) => string;

/** A date value as the API hands it over. */
export type DateValue = string | number | Date | null | undefined;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;

const pad = (n: number): string => String(n).padStart(2, '0');

/** The local calendar day of a moment as `YYYY-MM-DD`. */
export function isoDay(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** A date value as a `Date`, or null; a plain day and a month are local noon. */
export function parseDay(value: DateValue): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDate(value: string | number): Date {
  const day = typeof value === 'string' ? DAY.exec(value) : null;
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]), 12);
  const month = typeof value === 'string' ? MONTH.exec(value) : null;
  return month ? new Date(Number(month[1]), Number(month[2]) - 1, 1, 12) : new Date(value);
}

const formats: Record<string, Intl.DateTimeFormat | undefined> = {};

/** The `Intl.DateTimeFormat` of a locale and options, made once. */
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  const cached = formats[key];
  if (cached) return cached;
  const f = new Intl.DateTimeFormat(locale, options);
  Reflect.set(formats, key, f);
  return f;
}

/** The short weekday without its abbreviation dot: "Di" (de), "Tue" (en). */
export function weekdayName(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  return dateFormat(locale, { weekday: 'short' }).format(d).replace(/\.$/, '');
}

/** Day and month: "14.10." (de, always with the closing dot) or "14/10" (en). */
export function dayMonth(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  const text = dateFormat(locale, { day: '2-digit', month: '2-digit' }).format(d);
  return locale.startsWith('de') && !text.endsWith('.') ? `${text}.` : text;
}

/** Day, month and year: "14.10.2026" (de) or "14/10/2026" (en). */
export function dayMonthYear(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  return dateFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

/** "Di, 14.10.2026": the short weekday without its dot, then the date. */
export function weekdayDate(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  return `${weekdayName(d, locale)}, ${dayMonthYear(d, locale)}`;
}

/** "14. Oktober 2026". */
export function longDate(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  return dateFormat(locale, { dateStyle: 'long' }).format(d);
}

/** "Mittwoch, 11. November 2026". */
export function fullDate(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  return dateFormat(locale, { dateStyle: 'full' }).format(d);
}

/** A SQL `time` (`18:00:00`) as `HH:MM`, always 24 h; a value that is no time stays. */
export function shortTime(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/.exec(raw);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : raw;
}
