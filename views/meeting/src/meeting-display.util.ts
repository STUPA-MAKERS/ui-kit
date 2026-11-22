/** Pure display helpers of the meeting views (copied from STUPA-Workflow). */

/** `HH:MM` of a timestamp, always 24 h; empty without a valid value. */
export function clock(value: string | null | undefined, formatLocale: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(formatLocale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
}
