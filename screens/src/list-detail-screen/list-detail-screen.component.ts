import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet, type Params } from '@angular/router';
import { filter } from 'rxjs';
import {
  AvatarComponent,
  ButtonComponent,
  CheckboxComponent,
  EmptyStateComponent,
  FabComponent,
  FilterSelectComponent,
  IconComponent,
  ListDetailLayoutComponent,
  ListGroupComponent,
  ListItemComponent,
  LongPressDirective,
  PageFrame,
  PageHeaderComponent,
  RowMenuComponent,
  SearchPillComponent,
  SelectionBarComponent,
  SkeletonComponent,
  StatusTextComponent,
  StickyBarComponent,
  ToastService,
  UI_KIT_INTL,
  UiKitTranslatePipe,
  loadedData,
  placeActions,
  type Action,
  type FilterDef,
  type IconName,
  LIST_PAGE_STATE,
  type ListGroup,
  type ListNoneData,
  type ListPageState,
  type ListQuery,
  type ListRow,
  type PersonRef,
  type LoadState,
  type RowMenuItem,
  type RowMenuSection,
  type ScreenHead,
  type SearchDef,
  type SortDef,
} from '@stupa-makers/ui-kit';

import { injectWidthClass } from '../width';

/**
 * Extra content of a row, below its title, in place of the status and the trailing value.
 * Context: `$implicit` is the row.
 */
// The slot names are fixed by the screen contract (002217), not by the selector prefix.
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'ng-template[screenRow]', standalone: true })
export class ScreenRowDirective {
  readonly template = inject<TemplateRef<{ $implicit: ListRow }>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: ScreenRowDirective,
    _ctx: unknown,
  ): _ctx is { $implicit: ListRow } {
    return true;
  }
}

/** A block above the rows, for example a running meeting. */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'ng-template[screenListHead]', standalone: true })
export class ScreenListHeadDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** What the screen emits for an action: its key, and the ids of the selected rows. */
export interface ScreenAction {
  readonly key: string;
  readonly ids?: readonly string[];
}

/** The selection of a list: the actions of the selection bar. */
export interface ScreenSelection {
  readonly actions: readonly Action[];
}

/** The id of the menu item that starts or ends the selection on a phone. */
const SELECT_ITEM = '__select';

/** The settings of the list/detail screen. */
export interface ListDetailScreenConfig {
  /** The route parameter of the detail child route. Default `id`. */
  readonly param?: string;
  readonly listWidth?: 'normal' | 'wide';
  /**
   * The phone bar names the detail from the start (`app-list-detail` `barTitle`), as the
   * administration and Konto of the app do: for details whose page header docks in the bar,
   * such as the settings screen.
   */
  readonly barTitle?: boolean;
}

const SKELETON_ROWS = 8;

/**
 * The list/detail screen: the list column with its head, search, filter chips and rows, and
 * the detail of the child route beside it. The app gives data and slots; the screen places
 * every part, keeps the search and the filters in the URL and emits the query.
 * §S/framework/screens/002218 §S/framework/screens/002240
 */
@Component({
  selector: 'app-list-detail-screen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    RouterOutlet,
    AvatarComponent,
    ButtonComponent,
    CheckboxComponent,
    EmptyStateComponent,
    FabComponent,
    FilterSelectComponent,
    IconComponent,
    ListDetailLayoutComponent,
    ListGroupComponent,
    ListItemComponent,
    LongPressDirective,
    PageHeaderComponent,
    RowMenuComponent,
    SearchPillComponent,
    SelectionBarComponent,
    SkeletonComponent,
    StatusTextComponent,
    StickyBarComponent,
    UiKitTranslatePipe,
  ],
  providers: [
    {
      provide: LIST_PAGE_STATE,
      useExisting: forwardRef(() => ListDetailScreenComponent),
    },
  ],
  host: { '[class.pane-page]': 'split()' },
  templateUrl: './list-detail-screen.component.html',
  styleUrl: './list-detail-screen.component.scss',
})
export class ListDetailScreenComponent implements ListPageState {
  readonly head = input.required<ScreenHead>();
  readonly rows = input.required<LoadState<readonly ListRow[] | readonly ListGroup[]>>();
  readonly search = input<SearchDef | null>(null);
  readonly filters = input<readonly FilterDef[]>([]);
  readonly sort = input<readonly SortDef[]>([]);
  readonly actions = input<readonly Action[]>([]);
  /** Turns on the long press, the head toggle and the selection bar (001810, 001811). */
  readonly selection = input<ScreenSelection | null>(null);
  readonly noneText = input.required<{ readonly heading: string; readonly icon: IconName }>({
    alias: 'none',
  });
  readonly config = input<ListDetailScreenConfig>({});

  /** The search, the filters or the sort changed. */
  readonly query = output<ListQuery>();
  readonly action = output<ScreenAction>();
  /** The person asked for the next rows. */
  readonly more = output<void>();
  readonly refresh = output<void>();

  protected readonly rowSlot = contentChild(ScreenRowDirective);
  protected readonly listHeadSlot = contentChild(ScreenListHeadDirective);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly frame = inject(PageFrame);
  private readonly toasts = inject(ToastService);
  private readonly intl = inject(UI_KIT_INTL);
  private readonly layout = viewChild(ListDetailLayoutComponent);
  protected readonly width = injectWidthClass();

  /** The list and the detail sit side by side. */
  readonly split = computed(() => this.layout()?.collapsed() === false);
  protected readonly selectedId = signal<string | null>(null);

  private readonly params = signal<Params>(this.route.snapshot.queryParams);
  protected readonly searchText = computed(() => {
    const def = this.search();
    return def ? String(this.params()[def.param ?? 'q'] ?? '') : '';
  });

  // ListPageState for the empty detail pane (app-list-none).
  readonly loading = computed(() => this.rows().state === 'loading' && !loadedData(this.rows()));
  readonly error = computed(() => this.rows().state === 'error');
  readonly hasRows = computed(() => this.rows().state === 'ready');
  /** The empty pane says "Kein … geöffnet", or the empty text of the list (000665). */
  readonly none = computed<ListNoneData>(() => {
    const own = this.noneText();
    const rows = this.rows();
    return {
      icon: own.icon,
      heading: own.heading,
      emptyHeading: rows.state === 'empty' ? rows.heading : own.heading,
    };
  });

  /** The rows in groups; a flat list is one group without a label. */
  protected readonly groups = computed<readonly ListGroup[]>(() => {
    const data = loadedData(this.rows());
    if (!data || data.length === 0) return [];
    return isGroups(data) ? data : [{ key: '', label: '', rows: data }];
  });
  protected readonly placed = computed(() => placeActions(this.actions(), this.width()));
  /** The selection mode is on: rows toggle instead of opening, and the bar shows. */
  protected readonly selecting = signal(false);
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  /** The rows that can join the selection. */
  private readonly selectableRows = computed(() =>
    this.groups().flatMap((g) => g.rows.filter((r) => this.canSelect(r))),
  );
  protected readonly selectedCount = computed(
    () => this.selectableRows().filter((r) => this.selectedIds().has(r.id)).length,
  );
  protected readonly allSelected = computed(() => {
    const rows = this.selectableRows();
    return rows.length > 0 && rows.every((r) => this.selectedIds().has(r.id));
  });
  /** On a phone the toggle of the selection is the first item of the ⋮ (002231). */
  protected readonly selectInMenu = computed(() => !!this.selection() && this.width() === 'phone');
  protected readonly menu = computed<readonly RowMenuSection[]>(() => {
    const key = this.selecting() ? 'screen.selectStop' : 'screen.select';
    const select: readonly RowMenuSection[] = this.selectInMenu()
      ? [{ items: [{ id: SELECT_ITEM, label: this.intl.translate(key), icon: 'boxok' }] }]
      : [];
    const own: readonly RowMenuSection[] = this.placed().menu.length
      ? [{ items: this.placed().menu.map(toMenuItem) }]
      : [];
    return [...select, ...own];
  });
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly titleId = `lds-title-${Math.random().toString(36).slice(2, 10)}`;

  constructor() {
    const read = (): void => {
      this.selectedId.set(
        this.route.snapshot.firstChild?.paramMap.get(this.config().param ?? 'id') ?? null,
      );
      this.params.set(this.route.snapshot.queryParams);
    };
    read();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(read);
    // The first query comes from the URL, so a reload or a shared link shows the same rows.
    afterNextRender(() => this.query.emit(this.currentQuery()));
    effect(() => this.frame.fill.set(this.split()));
    inject(DestroyRef).onDestroy(() => this.frame.fill.set(false));
    effect(() => {
      const state = this.rows();
      if (state.state === 'error')
        untracked(() => this.toasts.show({ text: state.message, kind: 'error' }));
    });
  }

  /** The URL holds the search and the filters, so a reload and a shared link keep them. */
  protected setSearch(value: string): void {
    const def = this.search();
    if (!def) return;
    this.setParams({ [def.param ?? 'q']: value.trim() === '' ? null : value });
  }

  protected setFilter(def: FilterDef, value: string | readonly string[]): void {
    const empty = Array.isArray(value) ? value.length === 0 : value === '';
    this.setParams({ [def.key]: empty ? null : value });
  }

  protected filterValue(def: FilterDef): string {
    const raw = this.params()[def.key] ?? def.value;
    return typeof raw === 'string' ? raw : '';
  }

  protected filterValues(def: FilterDef): readonly string[] {
    const raw = this.params()[def.key] ?? def.value;
    if (raw === null || raw === undefined) return [];
    return Array.isArray(raw) ? (raw as string[]) : [String(raw)];
  }

  /** The head toggle: a second press ends the selection (001811). */
  protected toggleSelecting(): void {
    if (this.selecting()) this.stopSelecting();
    else this.selecting.set(true);
  }

  protected stopSelecting(): void {
    this.selecting.set(false);
    this.selectedIds.set(new Set());
  }

  protected canSelect(row: ListRow): boolean {
    return !!this.selection() && row.selectable !== false;
  }

  protected isSelected(row: ListRow): boolean {
    return this.selectedIds().has(row.id);
  }

  protected toggleRow(row: ListRow, on: boolean): void {
    if (!this.canSelect(row)) return;
    this.selectedIds.update(
      (cur) => new Set(on ? [...cur, row.id] : [...cur].filter((id) => id !== row.id)),
    );
  }

  protected toggleAll(on: boolean): void {
    this.selectedIds.set(on ? new Set(this.selectableRows().map((r) => r.id)) : new Set());
  }

  /** A long press starts the selection with the row, or toggles it in the selection (001810). */
  protected pressRow(row: ListRow): void {
    if (!this.canSelect(row)) return;
    this.selecting.set(true);
    this.toggleRow(row, !this.isSelected(row));
  }

  /** In the selection a tap on a row toggles it instead of opening it. */
  protected activateRow(row: ListRow): void {
    if (this.selecting()) this.toggleRow(row, !this.isSelected(row));
  }

  /** An action of the selection bar is emitted with the ids of the selected rows. */
  protected runSelected(a: Action): void {
    const ids = this.selectableRows()
      .filter((r) => this.selectedIds().has(r.id))
      .map((r) => r.id);
    if (ids.length === 0) return;
    this.action.emit({ key: a.key, ids });
  }

  /** An action with a route navigates; every other action is emitted with its key. */
  protected run(item: Action | RowMenuItem): void {
    const key = 'key' in item ? item.key : item.id;
    if (key === SELECT_ITEM) {
      this.toggleSelecting();
      return;
    }
    const def = this.actions().find((a) => a.key === key);
    if (def?.route) {
      void this.router.navigate([...def.route.commands], {
        queryParams: def.route.query,
      });
      return;
    }
    this.action.emit({ key });
  }

  /** The person in front of a row: the first of several. */
  protected leadPerson(row: ListRow): PersonRef | null {
    const av = row.avatar;
    if (!av) return null;
    return isPersonList(av) ? (av[0] ?? null) : av;
  }

  protected back(): void {
    void this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    });
  }

  private setParams(patch: Params): void {
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: patch,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
      .then(() => this.query.emit(this.currentQuery()));
  }

  private currentQuery(): ListQuery {
    const params = this.route.snapshot.queryParams;
    const filters = Object.fromEntries(
      this.filters().map((f) => [
        f.key,
        (params[f.key] as string | string[] | undefined) ?? f.value,
      ]),
    );
    const active = this.sort().find((s) => s.active);
    return {
      search: this.searchText(),
      filters,
      sort: active ? { key: active.key, dir: active.dir } : null,
    };
  }
}

function isPersonList(av: PersonRef | readonly PersonRef[]): av is readonly PersonRef[] {
  return Array.isArray(av);
}

function isGroups(data: readonly ListRow[] | readonly ListGroup[]): data is readonly ListGroup[] {
  return data.length > 0 && 'rows' in data[0]!;
}

function toMenuItem(a: Action): RowMenuItem {
  return {
    id: a.key,
    label: a.label,
    icon: a.icon,
    danger: a.kind === 'danger',
  };
}
