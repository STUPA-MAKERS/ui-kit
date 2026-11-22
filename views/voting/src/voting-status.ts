import type { StatusKind, UiKitTextKey } from '@stupa-makers/ui-kit';
import type { MeetingVoteStatus, VoteResult } from './voting.types';

/** A status as a kind and the key of its label. */
export interface StatusView {
  readonly kind: StatusKind;
  readonly key: UiKitTextKey;
}

/**
 * The result of a closed vote.
 *
 * A tie is a rejection: the motion did not get a majority. The UI never says
 * "Stimmengleichheit", so a tie shows the label of `rejected`.
 */
export function voteResultStatus(result: VoteResult): StatusView {
  if (result === 'passed') return { kind: 'accent', key: 'vote.result.passed' };
  return { kind: 'error', key: 'vote.result.rejected' };
}

const MEETING_VOTE: Record<MeetingVoteStatus, StatusView> = {
  draft: { kind: 'neutral', key: 'meetings.voteStatus.draft' },
  open: { kind: 'accent', key: 'meetings.voteStatus.open' },
  closed: { kind: 'neutral', key: 'meetings.voteStatus.closed' },
  cancelled: { kind: 'muted', key: 'meetings.voteStatus.cancelled' },
};

/** The status of a vote in a meeting. */
export function meetingVoteStatus(status: MeetingVoteStatus): StatusView {
  return MEETING_VOTE[status];
}
