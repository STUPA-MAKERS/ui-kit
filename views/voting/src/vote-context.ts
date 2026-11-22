/** Where a vote takes place: its meeting and the number of its agenda item. */
export interface VoteContext {
  readonly meeting: { readonly id: string; readonly title: string } | null;
  /** The 1-based number of the agenda item in the agenda order ("TOP 3"), or `null`. */
  readonly position: number | null;
}

export const NO_CONTEXT: VoteContext = { meeting: null, position: null };
