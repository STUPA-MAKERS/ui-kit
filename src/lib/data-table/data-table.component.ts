import { NgTemplateOutlet } from '@angular/common';
import {
  type AfterContentInit,
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  type OnDestroy,
  Output,
  type QueryList,
  type TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
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
  /**
   * What this column becomes when the table stacks into cards below the mobile
   * breakpoint.
   *
   * A card is not a table row turned on its side. Stacking every column gives a label
   * and a value per column, so a nine-column table becomes a nine-line card: the
   * checkbox on a line of its own, a placeholder dash on a line of its own, and no
   * heading a reader can scan. Declaring a role per column keeps the card to what
   * identifies the record.
   *
   * * `title` — the card's heading: full width, left aligned, no label. Pick the column
   *   that says WHICH record this is.
   * * `hidden` — left out of the card. For a column that is redundant once the others
   *   are visible, or is a placeholder on most rows.
   * * `row` (the default) — the label/value pair.
   *
   * A table that declares nothing keeps the previous behaviour, where the first data
   * column becomes the heading.
   */
  card?: 'title' | 'row' | 'hidden';
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

/** How far one press of a scroll tongue moves the table, in px. */
const SCROLL_STEP = 240;
/** How long a tongue has to be held before it starts repeating. */
const HOLD_DELAY_MS = 300;
/** How often a held tongue scrolls once it repeats. */
const HOLD_INTERVAL_MS = 90;
/**
 * Height of a tongue, for the first sync — before layout there is nothing to measure,
 * and the centring needs a half-height to clamp against. Keep it equal to the height in
 * the stylesheet.
 */
const TONGUE_HEIGHT = 54;
/** Sub-pixel slack, so rounding at an edge does not read as hidden content. */
const EDGE_SLACK = 1;

/**
 * Shared, data-driven table. Columns come as a {@link ColumnDef} list; a single
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
  imports: [NgTemplateOutlet, UiKitTranslatePipe],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent implements AfterContentInit, AfterViewInit, OnDestroy {
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
  @ViewChild('box') private box?: ElementRef<HTMLElement>;
  @ViewChild('endTongue') private endTongue?: ElementRef<HTMLElement>;
  private readonly zone = inject(NgZone);
  private readonly cellMap = signal<Map<string, TemplateRef<unknown>>>(new Map());
  private readonly footMap = signal<Map<string, TemplateRef<unknown>>>(new Map());

  /**
   * True while the scroll container still hides a column past that edge — the condition
   * for showing the tongue that scrolls that way.
   */
  protected readonly hiddenStart = signal(false);
  protected readonly hiddenEnd = signal(false);
  /**
   * True while the END tongue is hovered or focused, which lights the cut.
   *
   * Per side on purpose, and only for the end. The start edge has no rule of its own —
   * the box border is already the boundary there — so one shared flag lit the cut at
   * the far edge while the reader pointed at the near one.
   */
  protected readonly cutHot = signal(false);
  /** Which tongue is held down, for its pressed colour. */
  protected readonly held = signal<-1 | 0 | 1>(0);
  private holdTimer?: ReturnType<typeof setTimeout>;
  private holdTick?: ReturnType<typeof setInterval>;
  private readonly teardown: (() => void)[] = [];

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
      this.sort?.key === col.key ? (this.sort.direction === 'asc' ? 'desc' : 'asc') : first;
    this.sortChange.emit({ key: col.key, direction });
  }

  /** `aria-sort` for one header, so the sort is announced and not only drawn. */
  protected ariaSort(col: ColumnDef): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    if (this.sort?.key !== col.key) return 'none';
    return this.sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  // -- sideways scrolling -----------------------------------------------------

  /** True when a column asks to be pinned, which is what puts a cut in the table. */
  protected get hasSticky(): boolean {
    return this.columns.some((c) => c.sticky === 'end');
  }

  /** Width of the pinned column, which is how far the cut sits in from the edge. */
  private stickyWidth(scroll: HTMLElement): number {
    const th = scroll.querySelector('thead .dt__cell--sticky');
    return th ? Math.round(th.getBoundingClientRect().width) : 0;
  }

  /**
   * Which edges still hide a column, measured rather than computed.
   *
   * NOT `scrollLeft < scrollWidth - clientWidth`. `.dt__scroll` sets
   * `scrollbar-gutter: stable`, so `scrollWidth - clientWidth` overshoots the maximum
   * the browser actually clamps `scrollLeft` to, by the width of the gutter: measured at
   * 612 against a real maximum of 597 on an 820px viewport, a 15px overshoot that no
   * one-pixel slack can absorb. The end cue then never switched off at full scroll.
   *
   * Geometry answers the question the cue really asks — does a column still stick out
   * past the cut? — and asks it of the same boxes the reader is looking at.
   */
  private occluded(scroll: HTMLElement, cut: number): { start: boolean; end: boolean } {
    const rect = scroll.getBoundingClientRect();
    let firstLeft = Number.POSITIVE_INFINITY;
    let lastRight = Number.NEGATIVE_INFINITY;
    for (const cell of Array.from(scroll.querySelectorAll('thead th'))) {
      if (cell.classList.contains('dt__cell--sticky')) continue;
      const r = cell.getBoundingClientRect();
      if (r.left < firstLeft) firstLeft = r.left;
      if (r.right > lastRight) lastRight = r.right;
    }
    return { start: firstLeft < rect.left - EDGE_SLACK, end: lastRight > cut + EDGE_SLACK };
  }

  /**
   * Height of the horizontal scrollbar, so nothing is drawn over it.
   *
   * Measured, never assumed: it is 0 on a table that fits, about 15px where a scrollbar
   * shows, and a different number again on another platform.
   */
  private gutter(scroll: HTMLElement): number {
    return Math.max(0, scroll.offsetHeight - scroll.clientHeight);
  }

  /**
   * Centre of the VISIBLE slice of the scroller, in the scroller's own space.
   *
   * The middle of the box is the wrong place on a long table: it leaves the tongues off
   * screen exactly while the reader needs them. Two corrections, both about the bottom
   * edge — the area that counts is the ROWS, so the scrollbar gutter comes off before
   * anything is measured, and the result is then clamped by half a tongue, so a thin
   * visible slice can never push the tongue itself down onto the scrollbar.
   */
  private visibleCentre(scroll: HTMLElement): number {
    const rect = scroll.getBoundingClientRect();
    const rowsTop = rect.top;
    const rowsBottom = rect.bottom - this.gutter(scroll);
    const rowsHeight = Math.max(0, rowsBottom - rowsTop);

    const top = Math.max(rowsTop, 0);
    const bottom = Math.min(rowsBottom, window.innerHeight || 0);
    const centre = bottom <= top ? rowsHeight / 2 : (top + bottom) / 2 - rowsTop;

    // +1 keeps the tongue's own border clear of the gutter as well as its box.
    const half = (this.endTongue?.nativeElement.offsetHeight || TONGUE_HEIGHT) / 2 + 1;
    if (rowsHeight - half < half) return rowsHeight / 2; // shorter than the tongue
    return Math.min(Math.max(centre, half), rowsHeight - half);
  }

  /** Recompute which edges hide content, and where the cut and the tongues belong. */
  protected onScroll(): void {
    const scroll = this.scroller?.nativeElement;
    const box = this.box?.nativeElement;
    if (!scroll || !box) return;

    const cueRight = this.stickyWidth(scroll);
    const edges = this.occluded(scroll, scroll.getBoundingClientRect().right - cueRight);
    this.hiddenStart.set(edges.start);
    this.hiddenEnd.set(edges.end);

    box.style.setProperty('--cue-right', `${cueRight}px`);
    box.style.setProperty('--cue-top', `${Math.round(this.visibleCentre(scroll))}px`);
    box.style.setProperty('--cut-bottom', `${this.gutter(scroll)}px`);
  }

  /** One step sideways. Instant where the reader asked for less motion. */
  private step(direction: -1 | 1): void {
    const el = this.scroller?.nativeElement;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    el.scrollBy({ left: direction * SCROLL_STEP, behavior: reduced ? 'auto' : 'smooth' });
  }

  /**
   * Press to step, hold to keep going.
   *
   * A reader who does not know shift+scroll should not have to click fifteen times to
   * cross a wide table.
   */
  protected onTonguePress(event: MouseEvent, direction: -1 | 1): void {
    if (event.button !== 0) return;
    this.stopHold();
    this.step(direction);
    this.held.set(direction);
    this.holdTimer = setTimeout(() => {
      this.holdTick = setInterval(() => this.step(direction), HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }

  /** Release, leave or cancel: the repeat stops with the gesture that started it. */
  protected stopHold(): void {
    if (this.holdTimer !== undefined) clearTimeout(this.holdTimer);
    if (this.holdTick !== undefined) clearInterval(this.holdTick);
    this.holdTimer = undefined;
    this.holdTick = undefined;
    this.held.set(0);
  }

  /**
   * Enter and Space step once and do not repeat: the key repeat of the platform already
   * does that, and two repeats would race.
   */
  protected onTongueKey(event: KeyboardEvent, direction: -1 | 1): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); // Space would otherwise scroll the page
    this.step(direction);
  }

  ngAfterViewInit(): void {
    // A table can already overflow before anyone scrolls it.
    this.onScroll();
    // Outside Angular: a page scroll fires this for every table on the page, and none of
    // that has to run change detection. The signals it sets schedule their own.
    this.zone.runOutsideAngular(() => {
      const resync = (): void => this.onScroll();
      window.addEventListener('scroll', resync, { passive: true });
      window.addEventListener('resize', resync);
      this.teardown.push(() => {
        window.removeEventListener('scroll', resync);
        window.removeEventListener('resize', resync);
      });
      // The width all of this depends on changes without anyone scrolling: a cell
      // template arrives, a sidebar opens, the font loads.
      if (typeof ResizeObserver !== 'undefined' && this.scroller) {
        const ro = new ResizeObserver(resync);
        ro.observe(this.scroller.nativeElement);
        this.teardown.push(() => ro.disconnect());
      }
    });
  }

  ngOnDestroy(): void {
    this.stopHold();
    for (const off of this.teardown) off();
  }
}
