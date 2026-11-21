import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ButtonComponent,
  EmptyStateComponent,
  FabComponent,
  ListItemComponent,
  PageHeaderComponent,
  SkeletonComponent,
  StickyBarComponent,
  ToastService,
  UI_KIT_INTL,
  loadedData,
  placeActions,
  type Action,
  type ListRow,
  type LoadState,
  type ScreenHead,
} from '@stupa-makers/ui-kit';

/** The filter chips of the page, built with kit chips; the screen puts them in the sticky bar. */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenFilters]', standalone: true })
export class ScreenFiltersDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** A block under the rows, for example a pager. */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenListFoot]', standalone: true })
export class ScreenListFootDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * One record as a whole list item (`li`) with kit components, in place of the default row. The
 * list is then a `ul`. Context: the row.
 */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[screenRecord]', standalone: true })
export class ScreenRecordDirective {
  readonly template = inject<TemplateRef<{ $implicit: ListRow }>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: ScreenRecordDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: ListRow } {
    return true;
  }
}

/**
 * The records screen (002257): a copy of the record pages of the administration of
 * STUPA-Workflow (Erzwungene Statuswechsel, Agent-Zugänge, Audit-Log, …). The page header, the
 * filter chips in a sticky bar, one row group of records, the skeleton rows, the empty state and
 * the load error as a toast.
 */
@Component({
  selector: 'app-records-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ButtonComponent,
    EmptyStateComponent,
    FabComponent,
    ListItemComponent,
    PageHeaderComponent,
    SkeletonComponent,
    StickyBarComponent,
  ],
  templateUrl: './records-screen.component.html',
  styleUrl: './records-screen.component.scss',
})
export class RecordsScreenComponent {
  readonly head = input.required<ScreenHead>();
  readonly rows = input.required<LoadState<readonly ListRow[]>>();
  readonly actions = input<readonly Action[]>([]);
  /** The name of the filter row for screen readers. */
  readonly filtersLabel = input<string | null>(null);
  /** `records`: the denser row group of the record tables (`rowgroup--records`). */
  readonly variant = input<'rows' | 'records'>('rows');
  /** A load error keeps the rows or the empty state that showed before (Agent-Zugänge). */
  readonly keepOnError = input(false);
  /** Grey rows while the first page loads. */
  readonly skeleton = input(5);

  readonly acted = output<{ readonly key: string }>({ alias: 'action' });
  readonly more = output<void>();

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  protected readonly filtersSlot = contentChild(ScreenFiltersDirective);
  protected readonly recordSlot = contentChild(ScreenRecordDirective);
  protected readonly footSlot = contentChild(ScreenListFootDirective);
  /** The last rows or empty state that showed, for `keepOnError`. */
  private readonly settled = signal<LoadState<readonly ListRow[]> | null>(null);
  /** What the body draws: on an error with `keepOnError` the last settled state. */
  protected readonly shown = computed<LoadState<readonly ListRow[]> | null>(() => {
    const r = this.rows();
    if (r.state === 'error') return this.keepOnError() ? this.settled() : null;
    return r;
  });

  /** The rows on screen: the loaded ones, and the previous ones while a filter reloads. */
  protected readonly data = computed(() => {
    const r = this.shown();
    return r ? (loadedData(r) ?? []) : [];
  });
  protected readonly firstLoad = computed(
    () => this.rows().state === 'loading' && this.data().length === 0,
  );
  protected readonly hasMore = computed(() => {
    const r = this.rows();
    return r.state === 'ready' && !!r.more;
  });
  protected readonly placed = computed(() => placeActions(this.actions(), 'wide'));

  constructor() {
    effect(() => {
      const r = this.rows();
      if (r.state === 'ready' || r.state === 'empty') untracked(() => this.settled.set(r));
    });
    // A load error is a toast with Erneut versuchen, as `app-load-state` of the app shows it.
    effect(() => {
      const r = this.rows();
      if (r.state !== 'error') return;
      untracked(() =>
        this.toasts.show({
          text: r.message,
          kind: 'error',
          action: { key: 'retry', label: this.intl.translate('note.retry'), icon: 'reload' },
          closed: (how) => {
            if (how === 'action') r.retry();
          },
        }),
      );
    });
  }

  /** An action with a route navigates; every other action is emitted with its key. */
  protected run(a: Action): void {
    if (a.route) {
      void this.router.navigate([...a.route.commands], { queryParams: a.route.query });
      return;
    }
    this.acted.emit({ key: a.key });
  }
}
