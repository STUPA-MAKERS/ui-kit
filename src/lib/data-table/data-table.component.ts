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
import { RowDetailDirective } from './row-detail.directive';

/** Column definition of the {@link DataTableComponent}. */
export interface ColumnDef {
  key: string;
  label: string;
  align?: 'start' | 'end';
  /** CSS width (for example `12rem`); optional. */
  width?: string;
  /** Renders the header as a sort control and emits `sortChange` on click. */
  sortable?: boolean;
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

  /** Current sort, or `undefined` when the table is unsorted. */
  @Input() sort?: SortState;
  /** Emits the next sort state when a sortable header is clicked. */
  @Output() sortChange = new EventEmitter<SortState>();

  @ContentChildren(CellDirective) private cellDirs!: QueryList<CellDirective>;
  @ContentChild(RowDetailDirective) protected rowDetail?: RowDetailDirective;
  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;
  private readonly cellMap = signal<Map<string, TemplateRef<unknown>>>(new Map());

  /** True while the scroll container has content hidden past that edge. */
  protected readonly fadeStart = signal(false);
  protected readonly fadeEnd = signal(false);

  ngAfterContentInit(): void {
    const build = (): void =>
      this.cellMap.set(new Map(this.cellDirs.map((c) => [c.key, c.tpl as TemplateRef<unknown>])));
    build();
    this.cellDirs.changes.subscribe(build);
  }

  protected cellFor(key: string): TemplateRef<unknown> | null {
    return this.cellMap().get(key) ?? null;
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
   * Clicking a new column starts ascending, which is what a reader expects from a first
   * click. Clicking the active column flips the direction.
   */
  protected toggleSort(col: ColumnDef): void {
    if (!col.sortable) return;
    const direction: SortState['direction'] =
      this.sort?.key === col.key && this.sort.direction === 'asc' ? 'desc' : 'asc';
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
