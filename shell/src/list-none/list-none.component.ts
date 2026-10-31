import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  type Signal,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DetailNoneComponent, type DetailNoneState, type IconName } from '@stupa-makers/ui-kit';

/** What a list page tells the empty detail beside it. */
export interface ListPageState {
  readonly loading: Signal<boolean>;
  readonly error: Signal<boolean>;
  readonly hasRows: Signal<boolean>;
  /** The list and the detail sit side by side (the detail is a sheet beside the list). */
  readonly split: Signal<boolean>;
}

/** Provided by a list page with a detail outlet (`useExisting` the page). */
export const LIST_PAGE_STATE = new InjectionToken<ListPageState>('LIST_PAGE_STATE');

/**
 * Turns a text of the route data of `app-list-none` into the text it shows. The default
 * shows the text as it is. An app that puts translation keys into the route data provides
 * its own translation, for example
 * `{ provide: LIST_NONE_TEXT, useFactory: () => { const i18n = inject(I18n); return (k: string) => i18n.translate(k); } }`.
 * The function runs in the template, so a translation that reads a language signal
 * follows a change of the language.
 */
export const LIST_NONE_TEXT = new InjectionToken<(text: string) => string>('LIST_NONE_TEXT', {
  providedIn: 'root',
  factory: () => (text: string) => text,
});

/** The route data `none` of the empty child route of a list page. */
export interface ListNoneData {
  readonly icon: IconName;
  /** The text while a row can be picked. */
  readonly heading: string;
  /** The text of an empty list. */
  readonly emptyHeading: string;
  readonly emptyBody?: string;
}

/**
 * The detail pane of a list page before a row is open: the component of the empty child
 * route (`path: ''`, `data: { none: ListNoneData }`). Only the side-by-side layout shows
 * it. While the list loads or after an error it shows only the empty sheet, because the
 * list pane says what happens. The list page provides {@link LIST_PAGE_STATE}.
 */
@Component({
  selector: 'app-list-none',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DetailNoneComponent],
  template: `
    @if (data().none; as d) {
      <app-detail-none
        [state]="state()"
        [icon]="d.icon"
        [heading]="text(d.heading)"
        [emptyHeading]="text(d.emptyHeading)"
        [emptyBody]="d.emptyBody ? text(d.emptyBody) : null"
      />
    }
  `,
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class ListNoneComponent {
  private readonly page = inject(LIST_PAGE_STATE, { optional: true });
  private readonly route = inject(ActivatedRoute);
  protected readonly text = inject(LIST_NONE_TEXT);

  protected readonly data = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  }) as unknown as Signal<{ none?: ListNoneData }>;

  protected readonly state = computed<DetailNoneState>(() => {
    const page = this.page;
    if (!page || page.loading() || page.error()) return 'busy';
    return page.hasRows() ? 'pick' : 'empty';
  });
}
