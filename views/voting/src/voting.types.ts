import type { Action, StatusKind } from '@stupa-makers/ui-kit';

/** One vote as a card. */
export interface VoteCard {
  readonly id: string;
  readonly question: string;
  readonly rule: string;
  readonly state: 'draft' | 'open' | 'closed' | 'cancelled';
  readonly result?: {
    readonly label: string;
    readonly kind: StatusKind;
    readonly counts: readonly { readonly label: string; readonly value: number }[];
  };
  readonly actions: readonly Action[];
}

/** The ballot of a person. */
export interface Ballot {
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly multi?: boolean;
  readonly max?: number;
  readonly cast?: boolean;
  readonly weight?: number;
}
