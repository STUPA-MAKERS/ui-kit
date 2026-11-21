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
import {
  DetailNoneComponent,
  LIST_PAGE_STATE,
  type DetailNoneState,
  type ListNoneData,
} from '@stupa-makers/ui-kit';

// The state of a list page lives in core, so that a screen can provide it (002215).
export { LIST_PAGE_STATE, type ListNoneData, type ListPageState } from '@stupa-makers/ui-kit';

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

  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  }) as unknown as Signal<{ none?: ListNoneData }>;
  protected readonly data = computed<{ none?: ListNoneData }>(() => {
    const own = this.page?.none?.();
    return own ? { none: own } : this.routeData();
  });

  protected readonly state = computed<DetailNoneState>(() => {
    const page = this.page;
    if (!page || page.loading() || page.error()) return 'busy';
    return page.hasRows() ? 'pick' : 'empty';
  });
}
