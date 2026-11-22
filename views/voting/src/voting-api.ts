import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { BallotPick } from './ballot-view.component';
import type { Uuid, Vote } from './voting.types';

/**
 * The server calls of the voting views. The app provides it over its API client, so the
 * views know no route: the election ballot of the vote card casts through it, and the
 * election result draws the lot and opens the next round through it. Without the port
 * the card casts no election ballot and offers no lot and no next round.
 */
export interface VotingApi {
  castBallot(voteId: Uuid, choice: BallotPick, asDelegation?: boolean): Observable<unknown>;
  drawLot(voteId: Uuid): Observable<Vote>;
  nextRound(voteId: Uuid): Observable<Vote>;
}

export const VOTING_API = new InjectionToken<VotingApi>('VOTING_API');

/** The problem+json `detail` text of a failed request, or `''`. */
export function problemDetail(err: unknown): string {
  if (typeof err !== 'object' || err === null || !('error' in err)) return '';
  const body = (err as { error: unknown }).error;
  if (typeof body !== 'object' || body === null) return '';
  const detail = (body as Record<string, unknown>)['detail'];
  return typeof detail === 'string' ? detail : '';
}
