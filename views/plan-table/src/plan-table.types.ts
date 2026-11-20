import type { RouteLink } from '@stupa-makers/ui-kit';

/** One column of a plan table. */
export interface PlanColumn {
  readonly key: string;
  readonly label: string;
  readonly kind: 'text' | 'money' | 'percent';
  readonly editable?: boolean;
}

/** One row of a plan table, as a node of its tree. */
export interface PlanRow {
  readonly id: string;
  readonly label: string;
  readonly level: number;
  readonly parent?: string;
  readonly values: Readonly<Record<string, string | number | null>>;
  readonly muted?: boolean;
  readonly link?: RouteLink;
}
