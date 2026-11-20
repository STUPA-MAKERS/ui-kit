import type { IconName, PersonRef, RouteLink } from '@stupa-makers/ui-kit';

/** One entry of the activity list. */
export interface ActivityEntry {
  readonly id: string;
  readonly item: { readonly title: string; readonly icon: IconName; readonly link: RouteLink };
  readonly actor: PersonRef | null;
  readonly change: string;
  readonly time: string;
  readonly new?: boolean;
}
