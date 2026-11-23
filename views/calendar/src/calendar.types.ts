/*
 * The calendar types of STUPA-Workflow that the calendar views read, with the same fields, so
 * the app passes its API objects as they are (S/framework/views/002272).
 */

export type Uuid = string;

/** The kinds of entries on the wire. The page counts an Event to the Termine. */
export type EntryKind = 'meeting' | 'card' | 'event' | 'appointment' | 'external';

/** The answers of an invited person, in the order of the answer control. */
export type AnswerKey = 'accept' | 'tentative' | 'decline';

/** One entry of the Kalender. A time is `HH:MM:SS`, and null for an all-day entry. */
export interface CalendarEntry {
  readonly kind: EntryKind;
  readonly id: Uuid;
  readonly title: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly place: string | null;
  /** The Gremium of a meeting, the board of a card, the first Gremium of a Termin, the calendar. */
  readonly source: string | null;
  readonly gremiumIds: readonly Uuid[];
  /** A card assigned to the caller, a Termin that the caller created or is invited to. */
  readonly mine: boolean;
  readonly myAnswer: AnswerKey | null;
}

/** An entry of an external calendar. */
export interface ExternalEntry {
  readonly id: Uuid;
  readonly title: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly place: string | null;
  readonly description: string | null;
  readonly calendar: string;
}

/** The public fields of a Termin. */
export interface PublicAppointment {
  readonly id: Uuid;
  readonly title: string;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly place: string | null;
  readonly description: string | null;
}

/** The public fields of a meeting. `tops` holds the titles of the TOPs that are not internal. */
export interface PublicMeeting {
  readonly id: Uuid;
  readonly title: string;
  readonly day: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly gremium: string;
  readonly tops: readonly string[];
  /** The public protocol of the meeting, when it exists. */
  readonly protocolId: Uuid | null;
}
