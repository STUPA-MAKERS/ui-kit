/** The one count of present members of a meeting (spec 000946). */

import type { Attendance, Meeting } from './meeting.types';

type Counted = Pick<Meeting, 'presentCount' | 'eligibleCount' | 'presentSeats'>;

/** The row is a delegate: the person holds the voting right of a member (spec 003150). */
export function isDelegate(a: Attendance): boolean {
  return (a.represents?.length ?? 0) > 0;
}

/**
 * The present count that the head, the attendance list and the votes show: the value
 * fixed at the close, else each present person with a voting right or a delegation
 * (spec 003151). A delegate row reads `present` also for a pool seat without a record.
 * Rows of an older server carry no delegates; the pool seats of the meeting then add.
 */
export function presentCount(meeting: Counted | null | undefined, rows: readonly Attendance[]): number {
  const withDelegates = rows.some((a) => a.represents !== undefined);
  return (
    meeting?.presentCount ??
    rows.filter((a) => a.status === 'present' && (a.canVote || isDelegate(a))).length +
      (withDelegates ? 0 : (meeting?.presentSeats ?? 0))
  );
}

/** The members with a voting right: the value fixed at the close, else the rows of now. */
export function eligibleCount(meeting: Counted | null | undefined, rows: readonly Attendance[]): number {
  return meeting?.eligibleCount ?? rows.filter((a) => a.canVote).length;
}
