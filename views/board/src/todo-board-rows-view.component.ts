import { CdkScrollable } from "@angular/cdk/scrolling";
import { CdkDrag, CdkDropList, type CdkDragDrop } from "@angular/cdk/drag-drop";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import type {
  TodoAssignedBoard,
  TodoCardMove,
  TodoCardTile,
  TodoColumn,
  TodoLabel,
  Uuid,
} from "./board.types";
import {
  EmptyStateComponent,
  haptic,
  IconComponent,
  LongPressDirective,
  registerUiKitTexts,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from "@stupa-makers/ui-kit";
import { TodoCardTileViewComponent } from "./todo-card-tile-view.component";
import type { TileMenuRequest } from "./todo-move-sheet-view.component";
import {
  BOARD_ICON,
  DONE_PREVIEW,
  DROP_ENTER,
  dropMove,
  filterActive,
  insertAt,
  matchesFilter,
  moveRequest,
  rowDropId,
  sortedColumns,
  withHeld,
  type BoardFilter,
} from "./board.util";
import { KanbanKeyDrag, type KeyDragPosition } from "./kanban-key-drag";
import { UI_KIT_BOARD_TEXTS } from "./board.texts";

/** A set with `id` added, or taken out when it holds it. */
function toggled<T>(set: ReadonlySet<T>, id: T): ReadonlySet<T> {
  return set.has(id)
    ? new Set([...set].filter((x) => x !== id))
    : new Set([...set, id]);
}

/** The ids of the collapsed rows, per browser ("Meine To-Dos" and "Alle" share them). */
export const COLLAPSED_KEY = "ap.todos.rows.collapsed";

/** A card of another board (the personal board above the rows) landed in a row. */
export interface RowDrop {
  readonly boardId: Uuid;
  readonly cardId: Uuid;
  readonly move: TodoCardMove;
}

/** How `boardRows` reads the cards. */
export interface RowOptions {
  /**
   * "Alle": a row holds every card of its board, so "Zuständig: Ich" keeps the cards
   * assigned to `me`, and a board without a card stays a row while no filter is on
   * (unless no board has a card at all).
   */
  readonly all?: boolean;
  readonly me?: Uuid | null;
  /**
   * The labels of the label filter by id. Labels are per board, so a row keeps the cards
   * with a label of the same name (case-insensitive). Without it the filter compares ids.
   */
  readonly filterLabels?: ReadonlyMap<Uuid, TodoLabel>;
}

/** A row as shown: the board, its columns in order and the cards that pass the filters. */
export interface BoardRow {
  readonly board: TodoAssignedBoard;
  readonly columns: readonly TodoColumn[];
  readonly cards: ReadonlyMap<Uuid, readonly TodoCardTile[]>;
  readonly labels: ReadonlyMap<Uuid, TodoLabel>;
  readonly count: number;
}

/**
 * The first section of the phone list of "Meine To-Dos": the personal board of the page
 * with the cards that pass the filters of the page, by column.
 */
export interface RowLead {
  readonly board: TodoAssignedBoard;
  readonly cards: ReadonlyMap<Uuid, readonly TodoCardTile[]>;
}

/** A keyboard drag also knows the board of the held card. */
interface KeyDrag extends KeyDragPosition {
  readonly boardId: Uuid;
}

/**
 * Build the rows: every board with its columns and the cards that pass the filters.
 * A row without such a card is left out (see `RowOptions.all` for "Alle"). Under
 * "Meine To-Dos" every card of a row is assigned to the viewer, so "Zuständig: Ich"
 * keeps all of them.
 */
export function boardRows(
  boards: readonly TodoAssignedBoard[],
  filter: BoardFilter,
  today: string,
  opts: RowOptions = {},
): readonly BoardRow[] {
  const keepEmpty =
    !!opts.all &&
    !filterActive(filter) &&
    boards.some((b) => b.cards.length > 0);
  const byName = opts.filterLabels;
  const wanted = new Set(
    filter.labels.map((id) => byName?.get(id)?.name.toLowerCase() ?? ""),
  );
  const byLabelName = !!byName && filter.labels.length > 0;
  const filterOf = (board: TodoAssignedBoard): BoardFilter =>
    byLabelName ? rowFilter(board, filter, wanted) : filter;
  return boards
    .map((board) => boardRow(board, filterOf(board), today, opts))
    .filter((row) => row.count > 0 || keepEmpty);
}

/**
 * The label filter of one board: its labels whose name is in `wanted`, or `['']` (no card
 * passes) when the board has none of them, because label ids are per board.
 */
function rowFilter(
  board: TodoAssignedBoard,
  filter: BoardFilter,
  wanted: ReadonlySet<string>,
): BoardFilter {
  const ids = board.labels
    .filter((l) => wanted.has(l.name.toLowerCase()))
    .map((l) => l.id);
  return { ...filter, labels: ids.length ? ids : [""] };
}

/** One row of `boardRows`: the columns in order and the cards of each that pass `filter`. */
function boardRow(
  board: TodoAssignedBoard,
  filter: BoardFilter,
  today: string,
  opts: RowOptions,
): BoardRow {
  const labels = new Map(board.labels.map((l) => [l.id, l]));
  const mine = opts.all
    ? board.cards.filter(
        (c) => opts.me && c.assignees.some((a) => a.principalId === opts.me),
      )
    : board.cards;
  const ctx = { today, mine: new Set(mine.map((c) => c.id)), labels };
  const columns = sortedColumns(board.columns);
  const passes = (card: TodoCardTile, columnId: Uuid): boolean =>
    card.columnId === columnId && matchesFilter(card, filter, ctx);
  const cards = new Map<Uuid, readonly TodoCardTile[]>(
    columns.map((col) => [
      col.id,
      board.cards.filter((card) => passes(card, col.id)),
    ]),
  );
  const count = [...cards.values()].reduce((n, list) => n + list.length, 0);
  return { board, columns, cards, labels, count };
}

function readCollapsed(): ReadonlySet<Uuid> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(ids)
        ? ids.filter((x): x is string => typeof x === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeCollapsed(ids: ReadonlySet<Uuid>): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage is off or full: the rows stay open in the next visit.
  }
}

/** A drag moved a card inside its board. */
export interface RowMove {
  readonly boardId: Uuid;
  readonly cardId: Uuid;
  readonly move: TodoCardMove;
}

/** A drag moved a card of one row to another board. */
export interface RowTransfer {
  readonly fromId: Uuid;
  readonly toId: Uuid;
  readonly tile: TodoCardTile;
  readonly move: TodoCardMove;
}

/**
 * The board rows: one row per board, headed by the board name (no count, spec 000560),
 * with the columns of that board. The app reads the boards, filters them with `boardRows`
 * and passes the rows; it runs the moves and the transfers.
 *
 * A row is a region with a heading; the heading button collapses it (remembered per
 * browser). A pointer drag reaches every column of every writable row and the drop lists
 * of `extraDrops` (the personal board above the rows): a drop on the same board emits
 * `rowMove`, a drop on another row `rowTransfer` (with the neighbors of the drop place). A
 * card from `extraDrops` comes out as `dropIn`. The keyboard drag stays in its row: Space
 * lifts, the arrows move, Space or Enter put down, Escape puts back. A row without
 * `canWrite` is read only: no drag source and no drop target. A card of a shared board
 * does not enter the row of the personal board (`DROP_ENTER`).
 *
 * Phone: every row is one list of its cards, in column order and then in rank order, each
 * tile with the tag of its column; a row without a card shows one muted line. Nothing
 * scrolls sideways and nothing drags: a long press on a tile of a writable row emits
 * `menu`. `lead` (the personal board of the page) is the first section there.
 */
@Component({
  selector: "app-todo-board-rows-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    CdkDrag,
    CdkDropList,
    CdkScrollable,
    RouterLink,
    UiKitTranslatePipe,
    IconComponent,
    LongPressDirective,
    TodoCardTileViewComponent,
  ],
  host: {
    class: "br-host",
    "(document:focusin)": "leaveDrag($event)",
    "(document:pointerdown)": "leaveDrag($event)",
  },
  templateUrl: "./todo-board-rows-view.component.html",
  styleUrl: "./todo-board-rows-view.component.scss",
})
export class TodoBoardRowsViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_BOARD_TEXTS);

  private readonly i18n = inject(UI_KIT_INTL);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The rows as `boardRows` builds them. */
  readonly rows = input.required<readonly BoardRow[]>();
  readonly today = input.required<string>();
  readonly phone = input(false);
  /** The drop lists of the personal board above the rows, which a pointer drag reaches too. */
  readonly extraDrops = input<string[]>([]);
  /**
   * Phone, "Meine To-Dos": the personal board as the first section of the list. Its head
   * has no link to the board, because the page shows that board.
   */
  readonly lead = input<RowLead | null>(null);
  /** The link of a board in a row head; null shows no link. */
  readonly boardLink = input<((id: Uuid) => string) | null>(null);
  /** The id of the board of `lead`: its section head has no link to the board. */
  readonly leadId = computed(() => this.lead()?.board.id ?? null);

  readonly openCard = output<Uuid>();
  /** Phone: a long press on a tile of a writable row asks for the "Verschieben" sheet. */
  readonly menu = output<TileMenuRequest>();
  /** A card of `extraDrops` landed in a row: the page transfers it. */
  readonly dropIn = output<RowDrop>();
  /** A drag moved a card inside its board. */
  readonly rowMove = output<RowMove>();
  /** A drag moved a card to another row. */
  readonly rowTransfer = output<RowTransfer>();
  /**
   * The drop lists of the writable open rows (`dropIds`), each time they change: the page
   * hands them to the personal board above, so a card of the board reaches the rows.
   */
  readonly drops = output<string[]>();

  readonly collapsed = signal<ReadonlySet<Uuid>>(readCollapsed());
  /** Done columns opened past the preview, by column id. */
  readonly expanded = signal<ReadonlySet<Uuid>>(new Set());
  /** The keyboard drag; `kb` is the held card. */
  private readonly keyDrag = new KanbanKeyDrag<KeyDrag>();
  readonly kb = this.keyDrag.held;
  /** A touch lifts a card after this long press, so a swipe over the cards scrolls; a mouse lifts it at once. */
  protected readonly dragDelay = { touch: 400, mouse: 0 };
  /** The column a pointer drag started in; null without a pointer drag. */
  readonly ptr = signal<Uuid | null>(null);
  /** A card of the rows is held, by pointer or keyboard. */
  readonly dragging = computed(() => this.ptr() !== null || this.kb() !== null);
  readonly announce = signal("");
  readonly icon = BOARD_ICON;

  /**
   * The sections as shown: the rows, and on the phone of "Meine To-Dos" the personal board
   * (`lead`) before them.
   */
  readonly sections = computed<readonly BoardRow[]>(() => {
    const rows = this.rows();
    const lead = this.lead();
    if (!lead) return rows;
    const columns = sortedColumns(lead.board.columns);
    const count = columns.reduce(
      (n, c) => n + (lead.cards.get(c.id)?.length ?? 0),
      0,
    );
    const labels = new Map(lead.board.labels.map((l) => [l.id, l]));
    const first: BoardRow = {
      board: lead.board,
      columns,
      cards: lead.cards,
      labels,
      count,
    };
    return [first, ...rows.filter((r) => r.board.id !== lead.board.id)];
  });
  /** The drop lists of the writable open rows. */
  readonly dropIds = computed(() =>
    this.phone()
      ? []
      : this.rows()
          .filter((r) => r.board.canWrite && this.isOpen(r))
          .flatMap((r) => r.columns.map((c) => rowDropId(c.id))),
  );
  /** Where a drag of a writable row may go: every writable row and `extraDrops`. */
  readonly connected = computed(() => [
    ...this.dropIds(),
    ...this.extraDrops(),
  ]);
  /** A card of a shared board does not enter the row of the personal board (`canTransfer`). */
  readonly enter = DROP_ENTER;
  readonly dropId = rowDropId;

  constructor() {
    effect(() => {
      const ids = this.dropIds();
      untracked(() => this.drops.emit(ids));
    });
  }

  /** Ask the page for the "Verschieben" sheet of a tile (a long press on the phone). */
  askMenu(row: BoardRow, card: TodoCardTile): void {
    this.menu.emit({
      card,
      boardId: row.board.id,
      boardKind: row.board.kind,
      columns: row.columns,
    });
  }

  isOpen(row: BoardRow): boolean {
    return !this.collapsed().has(row.board.id);
  }

  toggle(row: BoardRow): void {
    const next = toggled(this.collapsed(), row.board.id);
    this.collapsed.set(next);
    writeCollapsed(next);
    if (this.kb()?.boardId === row.board.id) this.kb.set(null);
  }

  canDrag(row: BoardRow): boolean {
    return row.board.canWrite && !this.phone();
  }

  /** The cards of a column as shown: the keyboard drag and the done preview. */
  list(row: BoardRow, col: TodoColumn): readonly TodoCardTile[] {
    return this.shown(row).get(col.id) ?? [];
  }

  /** The done cards past the preview; none while a keyboard drag holds a card of the row. */
  more(row: BoardRow, col: TodoColumn): number {
    if (!col.isDone || this.kb()?.boardId === row.board.id) return 0;
    return this.cardsIn(row, col.id).length - this.list(row, col).length;
  }

  onDragStart(col: TodoColumn): void {
    haptic("lift");
    this.kb.set(null);
    this.ptr.set(col.id);
  }

  /** The cards of a column that pass the filters. */
  private cardsIn(row: BoardRow, columnId: Uuid): readonly TodoCardTile[] {
    return row.cards.get(columnId) ?? [];
  }

  expand(col: TodoColumn): void {
    this.expanded.update((set) => new Set([...set, col.id]));
  }

  private shown(row: BoardRow): ReadonlyMap<Uuid, readonly TodoCardTile[]> {
    const kb = this.kb();
    const held = kb?.boardId === row.board.id ? kb : null;
    const cards = row.columns.map((c) => this.cardsIn(row, c.id));
    const lists = held ? withHeld(cards, held) : cards;
    const limit = (col: TodoColumn, list: readonly TodoCardTile[]): number =>
      col.isDone && !this.expanded().has(col.id) && !held
        ? DONE_PREVIEW
        : list.length;
    return new Map(
      row.columns.map((col, i) => [
        col.id,
        lists[i].slice(0, limit(col, lists[i])),
      ]),
    );
  }

  drop(row: BoardRow, event: CdkDragDrop<Uuid>): void {
    const cardId = event.item.data as Uuid;
    const toCol = event.container.data;
    if (
      toCol === event.previousContainer.data &&
      event.previousIndex === event.currentIndex
    )
      return;
    const col = row.columns.find((c) => c.id === toCol);
    if (!col) return;
    const target = this.list(row, col).filter((c) => c.id !== cardId);
    const from = this.rows()
      .map((r) => r.board)
      .find((b) => b.cards.some((c) => c.id === cardId));
    const held = from?.cards.find((c) => c.id === cardId);
    if (!from || !held) {
      this.dropIn.emit({
        boardId: row.board.id,
        cardId,
        move: dropMove(target, event.currentIndex, toCol),
      });
      return;
    }
    if (from.id !== row.board.id) {
      this.rowTransfer.emit({
        fromId: from.id,
        toId: row.board.id,
        tile: held,
        move: dropMove(target, event.currentIndex, toCol),
      });
      return;
    }
    const placed = insertAt(target, event.currentIndex, held);
    this.rowMove.emit({
      boardId: row.board.id,
      cardId,
      move: moveRequest(placed, event.currentIndex, toCol),
    });
  }

  onTileKeyUp(event: KeyboardEvent): void {
    this.keyDrag.keyUp(event);
  }

  onTileKey(
    event: KeyboardEvent,
    row: BoardRow,
    card: TodoCardTile,
    colIndex: number,
    index: number,
  ): void {
    if (!this.canDrag(row)) return;
    const cols = row.columns;
    const step = this.keyDrag.key(
      event,
      card.id,
      () => ({
        boardId: row.board.id,
        cardId: card.id,
        col: colIndex,
        index,
        fromCol: colIndex,
        fromIndex: index,
      }),
      {
        count: cols.length,
        length: (col) => this.list(row, cols[col]).length,
        others: (col, id) =>
          this.cardsIn(row, cols[col].id).filter((c) => c.id !== id).length,
      },
    );
    switch (step.kind) {
      case "lift":
        this.say("todos.drag.lifted", row, card);
        return;
      case "move":
        this.say("todos.drag.moved", row, card);
        this.refocus(card.id);
        return;
      case "drop":
        this.commit(step.at, row, card);
        return;
      case "cancel":
        this.say("todos.drag.cancelled", row, card);
        if (step.refocus) this.refocus(card.id);
        return;
      default:
        return;
    }
  }

  /** A keyboard drag ends when the focus or a pointer goes anywhere but the held card. */
  leaveDrag(event: Event): void {
    const kb = this.kb();
    if (!kb) return;
    const target = event.target instanceof Element ? event.target : null;
    if (
      target
        ?.closest(".br__item")
        ?.querySelector(`[data-card-id="${kb.cardId}"]`)
    )
      return;
    this.kb.set(null);
    const row = this.rows().find((r) => r.board.id === kb.boardId);
    const card = row?.board.cards.find((c) => c.id === kb.cardId);
    if (row && card) this.say("todos.drag.cancelled", row, card);
  }

  private commit(kb: KeyDrag, row: BoardRow, card: TodoCardTile): void {
    const col = row.columns[kb.col];
    const list = this.list(row, col);
    this.kb.set(null);
    if (kb.col === kb.fromCol && kb.index === kb.fromIndex) {
      this.say("todos.drag.cancelled", row, card);
      this.refocus(card.id);
      return;
    }
    this.rowMove.emit({
      boardId: row.board.id,
      cardId: card.id,
      move: moveRequest(list, kb.index, col.id),
    });
    this.say("todos.drag.dropped", row, card, col.name);
    this.refocus(card.id);
  }

  private say(
    key:
      | "todos.drag.lifted"
      | "todos.drag.moved"
      | "todos.drag.dropped"
      | "todos.drag.cancelled",
    row: BoardRow,
    card: TodoCardTile,
    column?: string,
  ): void {
    const kb = this.kb();
    const col = kb ? row.columns[kb.col] : null;
    this.announce.set(
      this.i18n.translate(key, {
        title: card.title,
        column: column ?? col?.name ?? "",
        n: (kb?.index ?? 0) + 1,
        total: col ? this.list(row, col).length : 0,
      }),
    );
  }

  private refocus(cardId: Uuid): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-card-id="${cardId}"]`)
          ?.focus(),
      { injector: this.injector },
    );
  }
}
