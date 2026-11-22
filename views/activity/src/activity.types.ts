import type { IconName, PersonRef, RouteLink } from '@stupa-makers/ui-kit';

/** One entry of the activity list. §S/framework/views/002280 */
export interface ActivityEntry {
  readonly id: string;
  readonly item: { readonly title: string; readonly icon: IconName; readonly link: RouteLink };
  /** Who made the change; the row then reads "actor · change". */
  readonly actor: PersonRef | null;
  readonly change: string;
  /** The label of the day of the entry ("Heute", "Mo, 16.11.2026"); entries in a row with the same label form one group. */
  readonly day: string;
  /** The time of the entry, formatted ("14:05"). */
  readonly time: string;
  readonly new?: boolean;
}

/** One day of the list: its label and its entries. */
export interface ActivityDay {
  readonly key: string;
  readonly label: string;
  readonly entries: readonly ActivityEntry[];
}

/** The entries in groups of consecutive entries with the same day label. */
export function activityDays(entries: readonly ActivityEntry[]): readonly ActivityDay[] {
  return entries.reduce<readonly ActivityDay[]>((days, e) => {
    const last = days.at(-1);
    return last?.label === e.day
      ? [...days.slice(0, -1), { ...last, entries: [...last.entries, e] }]
      : [...days, { key: `${days.length}-${e.day}`, label: e.day, entries: [e] }];
  }, []);
}
