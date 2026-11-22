import type { KeeperPeriod, Meeting } from './meeting.types';

/** The name of a keeper, or a dash when the server sent none. */
function nameOf(p: KeeperPeriod): string {
  return p.name?.trim() || '—';
}

/** Every keeper of the meeting once, in the order of the periods: "Lara Leitung, Uli Übernahme". */
export function keeperNames(m: Meeting): string {
  const names = m.keeperPeriods.filter((p) => p.fromAt !== null).map(nameOf);
  const unique = [...new Set(names)];
  if (unique.length) return unique.join(', ');
  return m.protokollantName ?? '';
}
