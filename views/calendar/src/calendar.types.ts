import type { ColourRole, RouteLink } from '@stupa-makers/ui-kit';

/** One entry of the calendar. Times are ISO 8601 strings. */
export interface CalendarEntry {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly start: string;
  readonly end?: string;
  readonly allDay?: boolean;
  readonly colour: ColourRole;
  readonly link: RouteLink;
}

/** The views of the calendar. */
export type CalendarMode = 'week' | 'month' | 'days';
