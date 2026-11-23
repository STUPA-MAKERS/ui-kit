/*
 * The plan types of STUPA-Workflow that the plan table views read, with the same fields, so the
 * app passes its rows as they are (S/framework/views/002279).
 */

/** The side of a Titel: Einnahmen or Ausgaben. */
export type Side = 'income' | 'expense';

/** One Kostenstelle of a plan version, ready for the list and the tables. */
export interface PlanRow {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly pathKey: string;
  /** The side of the Titel of the row in the version. `null` while the Titel has none. */
  readonly side: Side | null;
  /** The Kostenstelle is active. An inactive one shows its mark. */
  readonly active: boolean;
  /** 0 for a direct child of the top-level Kostenstelle. */
  readonly depth: number;
  readonly amount: number;
  /** The Ansatz of the version in force, for a Nachtrag. `null` without such a line. */
  readonly base: number | null;
  /** The Ansatz of the year before. `null` when that year has no figure. */
  readonly prev: number | null;
  /** The booked amount of the year before. `null` when there is no year before. */
  readonly actual: number | null;
  /** The Kostenstelle of the year before that the row compares with instead of its own (001040). */
  readonly predecessorId: string | null;
  /** The Ansatz and the Ist of the year before that the line sets by hand (001042). */
  readonly prevByHand: number | null;
  readonly actualByHand: number | null;
  /** The figures of the year before without the values set by hand (001040, 001041). */
  readonly prevComputed: number | null;
  readonly actualComputed: number | null;
  readonly note: string;
  readonly transferable: boolean;
  readonly coverable: boolean;
  readonly blocked: number;
  /** A child Kostenstelle has a line in the version, so the Ansatz is at least their sum. */
  readonly hasChildren: boolean;
}

/** The group of a row in the list and the tables: its side, or the group of the Titel without one. */
export type PlanGroup = Side | 'none';

export function groupOf(row: Pick<PlanRow, 'side'>): PlanGroup {
  return row.side ?? 'none';
}

/** The sum of the Ansätze of one side, over the direct children of the top level. */
export function sideSum(rows: readonly PlanRow[], side: Side): number {
  return rows.filter((r) => r.depth === 0 && r.side === side).reduce((sum, r) => sum + r.amount, 0);
}

/** Round to cents, so a sum of decimals compares exactly. */
export function cents(value: number): number {
  return Math.round(value * 100);
}
