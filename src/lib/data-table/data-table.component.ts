import { NgTemplateOutlet } from '@angular/common';
import {
  type AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  type QueryList,
  type TemplateRef,
  ViewChild,
  signal,
} from '@angular/core';
import { CellDirective } from './cell.directive';
import { FootCellDirective } from './foot-cell.directive';
import { RowDetailDirective } from './row-detail.directive';

/** Column definition of the {@link DataTableComponent}. */
export interface ColumnDef {
  key: string;
  label: string;
  align?: 'start' | 'end';
  /**
   * Wie breit die Spalte sein soll, als UNTERGRENZE statt als Vorschlag.
   *
   * `width` allein ist bei `table-layout: auto` nur ein Wunsch: der Browser darf die
   * Spalte kleiner rechnen, wenn andere mehr fordern. Eine mit `22rem` angeforderte
   * Namensspalte landete gemessen bei 107px und brach um. Zusammen mit `min-width`
   * bleibt die Breite stehen und die Tabelle scrollt stattdessen — wofür die
   * Aktionsspalte `sticky: 'end'` bekommt.
   */
  width?: string;
  /** Renders the header as a sort control and emits `sortChange` on click. */
  sortable?: boolean;
  /**
   * Direction a FIRST click on this column asks for. Defaults to ascending, which is
   * what a name or a key wants; a date or an amount usually wants the largest first,
   * so those columns set `desc`.
   */
  initialSort?: 'asc' | 'desc';
  /**
   * Pins the column to the trailing edge while the table scrolls sideways.
   *
   * For the actions column of a wide table: edit and delete stay reachable instead of
   * sitting past the right edge, where a reader has to scroll to find them and scroll
   * back to see which row they belong to. Below the mobile breakpoint the table stacks
   * into cards and nothing scrolls sideways, so the pin lifts by itself.
   *
   * Pin ONE column at most, and pin it last: two pinned columns would overlap, because
   * each one is offset from the same edge.
   */
  sticky?: 'end';
}

/** Which column a table is sorted by, and in which direction. */
export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/** How many skeleton rows to draw while loading, when the caller gives no hint. */
const DEFAULT_SKELETON_ROWS = 5;

/**
 * Shared, data-driven table (#26). Columns come as a {@link ColumnDef} list; a single
 * cell can be rendered freely with `<ng-template appCell="key" let-row>` (badges,
 * buttons, links). Without a template the cell shows `row[key]` as text. Boxed by
 * default, optionally with row clicks.
 *
 * This keeps every table visually consistent — one source for the header, the border,
 * the hover, the empty state, the loading state and the sort affordance — instead of
 * each page building its own `<table>`.
 *
 * **Loading:** set `loading` while data is in flight. The table keeps its header and
 * column widths and draws skeleton rows. It deliberately does NOT collapse to the empty
 * state, because "nothing here" and "not here yet" mean different things to a reader.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent implements AfterContentInit {
  @Input() columns: ColumnDef[] = [];
  @Input() rows: readonly unknown[] = [];
  @Input() emptyText = '—';
  @Input() boxed = true;
  /** Stable track key per row (index otherwise). */
  @Input() rowKey?: (row: unknown, index: number) => unknown;
  /** Makes rows clickable (cursor/tab/enter) and emits `rowClick`. */
  @Input() clickable = false;
  @Output() rowClick = new EventEmitter<unknown>();

  /** Predicate: which rows show their detail row. */
  @Input() isExpanded?: (row: unknown) => boolean;

  /** Draws skeleton rows instead of the body, keeping the header in place. */
  @Input() loading = false;
  /** How many skeleton rows to draw. Match it to the usual page size. */
  @Input() skeletonRowCount = DEFAULT_SKELETON_ROWS;
  /** Announced to a screen reader while `loading`, because the skeleton is hidden. */
  @Input() loadingText = 'Loading…';

  /**
   * Adds a leading checkbox column and makes rows selectable.
   *
   * The table owns the selection rather than the caller wiring a column of its own,
   * because a hand-built checkbox column has to agree with `rowKey`, with the header's
   * select-all, and with the skeleton — and every table that built one got at least one
   * of those subtly different.
   */
  @Input() selectable = false;
  /** The selected rows, as `rowKey` values. */
  @Input() selected: ReadonlySet<unknown> = new Set();
  /** Emits the next selection. The caller holds it; the table never mutates the input. */
  @Output() selectedChange = new EventEmitter<Set<unknown>>();
  /** Accessible name for the select-all checkbox in the header. */
  @Input() selectAllLabel = 'Select all';
  /** Accessible name for one row's checkbox. Falls back to the row's position. */
  @Input() rowSelectLabel?: (row: unknown, index: number) => string;

  /**
   * Child rows of one row, rendered directly under it with the SAME columns.
   *
   * Different from `appRowDetail`, which renders one full-width cell for a panel. A
   * child here is another record of the same shape — a sub-booking under its booking —
   * so it reuses the caller's `appCell` templates and lines up with the parent column
   * for column. The template context carries `child: true`, so a cell can render a child
   * differently without the caller writing the column twice.
   */
  @Input() childrenOf?: (row: unknown) => readonly unknown[];

  /** Extra class per row, for a state the table cannot know about. */
  @Input() rowClass?: (row: unknown, child: boolean) => string | null;

  /** Current sort, or `undefined` when the table is unsorted. */
  @Input() sort?: SortState;
  /** Emits the next sort state when a sortable header is clicked. */
  @Output() sortChange = new EventEmitter<SortState>();

  @ContentChildren(CellDirective) private cellDirs!: QueryList<CellDirective>;
  @ContentChildren(FootCellDirective) private footDirs!: QueryList<FootCellDirective>;
  @ContentChild(RowDetailDirective) protected rowDetail?: RowDetailDirective;
  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;
  private readonly cellMap = signal<Map<string, TemplateRef<unknown>>>(new Map());
  private readonly footMap = signal<Map<string, TemplateRef<unknown>>>(new Map());

  /** True while the scroll container has content hidden past that edge. */
  protected readonly fadeStart = signal(false);
  protected readonly fadeEnd = signal(false);

  ngAfterContentInit(): void {
    const build = (): void => {
      this.cellMap.set(new Map(this.cellDirs.map((c) => [c.key, c.tpl as TemplateRef<unknown>])));
      this.footMap.set(new Map(this.footDirs.map((c) => [c.key, c.tpl as TemplateRef<unknown>])));
    };
    build();
    this.cellDirs.changes.subscribe(build);
    this.footDirs.changes.subscribe(build);
  }

  protected cellFor(key: string): TemplateRef<unknown> | null {
    return this.cellMap().get(key) ?? null;
  }

  protected footCellFor(key: string): TemplateRef<unknown> | null {
    return this.footMap().get(key) ?? null;
  }

  /** True when any column contributes a footer, so `<tfoot>` stays out otherwise. */
  protected get hasFooter(): boolean {
    return this.footMap().size > 0;
  }

  protected childrenFor(row: unknown): readonly unknown[] {
    return this.childrenOf ? this.childrenOf(row) : [];
  }

  protected classFor(row: unknown, child: boolean): string | null {
    return this.rowClass ? this.rowClass(row, child) : null;
  }

  // -- selection --------------------------------------------------------------

  protected isSelected(row: unknown, index: number): boolean {
    return this.selected.has(this.trackRow(row, index));
  }

  /** True only when every row is selected. An empty table is not "all selected". */
  protected get allSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((r, i) => this.isSelected(r, i));
  }

  /** True when some but not all are selected, for the header's indeterminate state. */
  protected get someSelected(): boolean {
    return !this.allSelected && this.rows.some((r, i) => this.isSelected(r, i));
  }

  protected toggleRow(row: unknown, index: number): void {
    const next = new Set(this.selected);
    const key = this.trackRow(row, index);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.selectedChange.emit(next);
  }

  /** Select-all applies to the rows ON SCREEN, which is what the checkbox sits above. */
  protected toggleAll(): void {
    if (this.allSelected) {
      this.selectedChange.emit(new Set());
      return;
    }
    this.selectedChange.emit(new Set(this.rows.map((r, i) => this.trackRow(r, i))));
  }

  protected selectLabel(row: unknown, index: number): string {
    return this.rowSelectLabel ? this.rowSelectLabel(row, index) : `Row ${index + 1}`;
  }

  /**
   * Total column count, for a `colspan` that has to span the whole table.
   *
   * The selection column is not in `columns`, so anything spanning the table has to add
   * it back or the detail row comes up one cell short.
   */
  protected get columnSpan(): number {
    return this.columns.length + (this.selectable ? 1 : 0);
  }

  protected text(row: unknown, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  protected trackRow(row: unknown, index: number): unknown {
    return this.rowKey ? this.rowKey(row, index) : index;
  }

  protected onRow(row: unknown): void {
    if (this.clickable) this.rowClick.emit(row);
  }

  /** A plain index list, so the template can repeat the skeleton row. */
  protected skeletonRows(): number[] {
    return Array.from({ length: Math.max(1, this.skeletonRowCount) }, (_, i) => i);
  }

  /**
   * Toggle the sort for one column.
   *
   * A new column starts at its own `initialSort`; clicking the active column flips it.
   */
  protected toggleSort(col: ColumnDef): void {
    if (!col.sortable) return;
    const first = col.initialSort ?? 'asc';
    // Clicking the active column flips it; a new column starts at its own default.
    const direction: SortState['direction'] =
      this.sort?.key === col.key
        ? this.sort.direction === 'asc'
          ? 'desc'
          : 'asc'
        : first;
    this.sortChange.emit({ key: col.key, direction });
  }

  /** `aria-sort` for one header, so the sort is announced and not only drawn. */
  protected ariaSort(col: ColumnDef): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    if (this.sort?.key !== col.key) return 'none';
    return this.sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  /** Recompute which edges have hidden content, so only real overflow gets a fade. */
  protected onScroll(): void {
    const el = this.scroller?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.fadeStart.set(el.scrollLeft > 1);
    // A one-pixel slack absorbs sub-pixel rounding at the far end, which would
    // otherwise leave the fade on forever at full scroll.
    this.fadeEnd.set(max > 1 && el.scrollLeft < max - 1);
  }

  ngAfterViewInit(): void {
    // A table can already overflow before anyone scrolls it.
    this.onScroll();
  }
}
