import type { UiKitTextKey } from '@stupa-makers/ui-kit';

import type { BallotFailure } from './ballot-view.component';

/** The refusals of a cast that have their own text, by the code of the server. */
const REFUSAL_TEXT: Readonly<Record<string, UiKitTextKey>> = {
  vote_as_unit: 'voting.cast.toast.asUnit',
  delegation_not_in_election: 'voting.cast.toast.noDelegationInElection',
};

/** The text of a refused cast that has its own text, else null. */
export function castRefusalText(failure: BallotFailure): UiKitTextKey | null {
  return REFUSAL_TEXT[failure.error.error?.code ?? ''] ?? null;
}
