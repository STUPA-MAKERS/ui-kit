import type { UiKitTextKey } from '@stupa-makers/ui-kit';
import type { PersonRef } from './board.types';

/*
 * The date, money and name texts of the board views: copies of the helpers of STUPA-Workflow
 * (`shared/date-format`, `shared/format-money`, `personName`), so a tile reads the same as in
 * the app. Every formatter takes the `Intl` format locale (`de-DE`, `en-GB`).
 */

/** The translate function of the views. */
export type Translate = (key: UiKitTextKey, params?: Record<string, string | number>) => string;

/** A date value as the API hands it over. */
export type DateValue = string | number | Date | null | undefined;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
const DAY_MS = 86_400_000;

/**
 * A date value as a `Date`, or null for no or an invalid value. A plain day and a month are
 * local noon, so the day stays the same west of Greenwich and across a DST change.
 */
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

function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
}

const formats: Record<string, Intl.DateTimeFormat | undefined> = {};

/** The `Intl.DateTimeFormat` of a locale and options, made once: a board formats on every tile. */
function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  const cached = formats[key];
  if (cached) return cached;
  const f = new Intl.DateTimeFormat(locale, options);
  Reflect.set(formats, key, f);
  return f;
}

/** Whole calendar days from `today` to `value` (negative in the past), or null. */
export function daysUntil(value: DateValue, today: DateValue = new Date()): number | null {
  const a = parseDay(today);
  const b = parseDay(value);
  return a && b ? dayNumber(b) - dayNumber(a) : null;
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

/** "14.10." in the year of `today`, else "14.10.2027". */
export function shortDay(value: DateValue, locale: string, today: DateValue = new Date()): string {
  const d = parseDay(value);
  if (!d) return '';
  const ref = parseDay(today);
  return ref && ref.getFullYear() === d.getFullYear() ? dayMonth(d, locale) : dayMonthYear(d, locale);
}

/** "Di, 14.10.2026": the short weekday without its dot, then the date. */
export function weekdayDate(value: DateValue, locale: string): string {
  const d = parseDay(value);
  if (!d) return '';
  return `${weekdayName(d, locale)}, ${dayMonthYear(d, locale)}`;
}

/** An amount as money in the format locale ("1.250,00 €"), or `''` without a number. */
export function formatMoney(value: unknown, locale: string): string {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n);
}

/** The name of a person, else "Gelöschte Person". */
export function personName(ref: PersonRef | null | undefined, t: Translate): string {
  return ref?.displayName || t('chat.deletedPerson');
}
