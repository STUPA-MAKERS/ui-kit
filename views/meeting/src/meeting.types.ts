import type { ListRow, RouteLink } from '@stupa-makers/ui-kit';

/** One item of an agenda. Times come from the app (S/framework/views/002275). */
export interface AgendaItem {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly sub?: string;
  readonly start?: string;
  readonly duration?: number;
  readonly state: 'open' | 'current' | 'done';
  readonly firstRow?: ListRow;
  readonly link?: RouteLink;
}

/** One cell of the attendance matrix. */
export interface AttendanceCell {
  readonly state: string;
  readonly badges?: readonly string[];
}

/** The attendance of people over meetings. */
export interface AttendanceMatrix {
  readonly people: readonly { readonly id: string; readonly label: string; readonly group?: string }[];
  readonly columns: readonly { readonly id: string; readonly label: string; readonly empty?: boolean }[];
  readonly cells: Readonly<Record<string, Readonly<Record<string, AttendanceCell>>>>;
}
