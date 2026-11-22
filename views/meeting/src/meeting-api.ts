import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Delegation, Uuid } from './meeting.types';

/**
 * The server calls of the meeting views. The app provides it over its API client, so the
 * views know no route: the attendance sheet reads and revokes the delegations of the meeting
 * through it. Without the port the sheet shows no delegations.
 */
export interface MeetingApi {
  listDelegations(meetingId: Uuid): Observable<readonly Delegation[]>;
  revokeDelegation(delegationId: Uuid): Observable<unknown>;
}

export const MEETING_API = new InjectionToken<MeetingApi>('MEETING_API');
