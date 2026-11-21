import { InjectionToken, type Signal } from '@angular/core';
import type { IconName } from '../icon/icon.component';

/** The route data `none` of the empty child route of a list page. */
export interface ListNoneData {
  readonly icon: IconName;
  /** The text while a row can be picked. */
  readonly heading: string;
  /** The text of an empty list. */
  readonly emptyHeading: string;
  readonly emptyBody?: string;
}

/** What a list page tells the empty detail beside it. */
export interface ListPageState {
  readonly loading: Signal<boolean>;
  readonly error: Signal<boolean>;
  readonly hasRows: Signal<boolean>;
  /** The list and the detail sit side by side (the detail is a sheet beside the list). */
  readonly split: Signal<boolean>;
  /** The texts of the empty pane; they win over the route data `none` (a screen gives them). */
  readonly none?: Signal<ListNoneData | null>;
}

/** Provided by a list page with a detail outlet (`useExisting` the page). */
export const LIST_PAGE_STATE = new InjectionToken<ListPageState>('LIST_PAGE_STATE');

