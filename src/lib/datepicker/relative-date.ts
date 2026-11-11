/**
 * Relative date shortcuts of the date field (specs 000700, 000702): `+1w`, `-1d`, `+1y`,
 * chains such as `+1m-2d`. Units: `d`/`t` day, `w` week, `m` month, `y`/`j` year. Case and
 * spaces are free. The terms apply from left to right, starting at `today`.
 */

const SHORTCUT = /^(?:[+-]\d{1,4}[dtwmyj])+$/;
const TERM = /([+-])(\d{1,4})([dtwmyj])/g;

interface Ymd {
  readonly y: number;
  readonly m: number; // 0-11
  readonly d: number;
}

const daysIn = (y: number, m: number): number => {
  const dt = new Date(2000, 0, 1, 12);
  dt.setFullYear(y, m + 1, 0);
  return dt.getDate();
};

/** A month step keeps the day; a shorter target month stops at its last day (000702). */
const addMonths = ({ y, m, d }: Ymd, n: number): Ymd => {
  const index = y * 12 + m + n;
  const ty = Math.floor(index / 12);
  const tm = index - ty * 12;
  return { y: ty, m: tm, d: Math.min(d, daysIn(ty, tm)) };
};

const addDays = ({ y, m, d }: Ymd, n: number): Ymd => {
  const dt = new Date(2000, 0, 1, 12);
  dt.setFullYear(y, m, d + n);
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
};

const step = (date: Ymd, n: number, unit: string): Ymd => {
  switch (unit) {
    case 'w':
      return addDays(date, n * 7);
    case 'm':
      return addMonths(date, n);
    case 'y':
    case 'j':
      return addMonths(date, n * 12);
    default:
      return addDays(date, n);
  }
};

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

/**
 * Resolves a shortcut to an ISO date (`YYYY-MM-DD`) relative to `today` (local date), or
 * returns `''` when the text is not a shortcut.
 */
export function resolveRelativeDate(text: string, today: Date = new Date()): string {
  const compact = text.replace(/\s+/g, '').toLowerCase();
  if (!SHORTCUT.test(compact)) return '';
  const start: Ymd = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
  const end = Array.from(compact.matchAll(TERM)).reduce(
    (date, [, sign, amount, unit]) =>
      step(date, (sign === '-' ? -1 : 1) * Number(amount), unit ?? 'd'),
    start,
  );
  if (end.y < 1 || end.y > 9999) return '';
  return `${pad(end.y, 4)}-${pad(end.m + 1, 2)}-${pad(end.d, 2)}`;
}
