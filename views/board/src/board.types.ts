import type { Action, ColourRole, Mark, PersonRef, RouteLink } from '@stupa-makers/ui-kit';

/** The data of the board view. */
export interface BoardView {
  readonly columns: readonly BoardColumn[];
}

/** One column of a board. */
export interface BoardColumn {
  readonly id: string;
  readonly label: string;
  readonly done?: boolean;
  readonly cards: readonly BoardCard[];
  readonly actions?: readonly Action[];
}

/** One card of a board. */
export interface BoardCard {
  readonly id: string;
  readonly title: string;
  readonly labels?: readonly { readonly label: string; readonly colour: ColourRole }[];
  readonly avatars?: readonly PersonRef[];
  readonly due?: string;
  readonly mark?: Mark;
  readonly checklist?: { readonly done: number; readonly total: number };
  readonly link: RouteLink;
}

/** The move of a card: to a column, before a card or at the end. */
export interface BoardMove {
  readonly id: string;
  readonly column: string;
  readonly before: string | null;
}
