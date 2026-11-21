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

/** The content of a record, in place of the title and the meta line. Context: the row. */
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
  /** Grey rows while the first page loads. */
  readonly skeleton = input(5);

  readonly acted = output<{ readonly key: string }>({ alias: 'action' });
  readonly more = output<void>();

  protected readonly intl = inject(UI_KIT_INTL);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  protected readonly filtersSlot = contentChild(ScreenFiltersDirective);
  protected readonly recordSlot = contentChild(ScreenRecordDirective);

  /** The rows on screen: the loaded ones, and the previous ones while a filter reloads. */
  protected readonly data = computed(() => loadedData(this.rows()) ?? []);
  protected readonly firstLoad = computed(
    () => this.rows().state === 'loading' && this.data().length === 0,
  );
  protected readonly hasMore = computed(() => {
    const r = this.rows();
    return r.state === 'ready' && !!r.more;
  });
  protected readonly placed = computed(() => placeActions(this.actions(), 'wide'));

  constructor() {
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
