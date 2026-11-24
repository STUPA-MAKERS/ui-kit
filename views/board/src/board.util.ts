import type { IconName, UiKitTextKey } from '@stupa-makers/ui-kit';
import type {
  TodoBoard,
  TodoBoardKind,
  TodoCardMove,
  TodoCardTile,
  TodoLabel,
  TodoLink,
  TodoLinkKind,
  Uuid,
} from './board.types';
import { daysUntil, formatMoney, parseDay, shortDay, weekdayName, type Translate } from './board-format';

/*
 * The board helpers of STUPA-Workflow (`features/todos/todos.util`): the tile texts, the
 * filters, the move requests and the tile updates of a board.
 */

/** The done column shows this many cards until "n weitere" opens the rest. */
export const DONE_PREVIEW = 3;

/** The id of the drop list of a board column, for `cdkDropListConnectedTo`. */
export function boardDropId(columnId: Uuid): string {
  return `bv-list-${columnId}`;
}

/** The id of the drop list of a column in the rows, for `cdkDropListConnectedTo`. */
export function rowDropId(columnId: Uuid): string {
  return `br-list-${columnId}`;
}

/** The icon of each board kind. */
export const BOARD_ICON: Record<TodoBoardKind, IconName> = {
  personal: 'user',
  gremium: 'landmark',
  free: 'kanban',
  team: 'ticket',
};

export const LINK_ICON: Record<TodoLinkKind, IconName> = {
  application: 'file',
  meeting: 'users',
  agenda_item: 'list',
  vote: 'vote',
  appointment: 'cal',
  gremium: 'landmark',
  invoice: 'receipt',
  expense: 'swap',
  order: 'package',
  budget: 'pie',
  ticket: 'chat',
  todo: 'circleok',
  paperless: 'archive',
};

export const LINK_KIND_LABEL: Record<TodoLinkKind, UiKitTextKey> = {
  application: 'todos.linkKind.application',
  meeting: 'todos.linkKind.meeting',
  agenda_item: 'todos.linkKind.agenda_item',
  vote: 'todos.linkKind.vote',
  appointment: 'todos.linkKind.appointment',
  gremium: 'todos.linkKind.gremium',
  invoice: 'todos.linkKind.invoice',
  expense: 'todos.linkKind.expense',
  order: 'todos.linkKind.order',
  budget: 'todos.linkKind.budget',
  ticket: 'todos.linkKind.ticket',
  todo: 'todos.linkKind.todo',
  paperless: 'todos.linkKind.paperless',
};

/** The colour of a due date: overdue red, today and tomorrow amber. */
export type DueTone = 'overdue' | 'soon' | 'normal';

export interface DueInfo {
  /** "14.10." */
  readonly date: string;
  /** "überfällig", "heute", "morgen" or null. */
  readonly note: string | null;
  readonly tone: DueTone;
}

/**
 * The due date of a tile: the short date, and a note while it presses. A card in the
 * done column has no note and no colour.
 */
export function dueInfo(day: string, today: string, locale: string, t: Translate, done = false): DueInfo {
  const date = shortDay(day, locale, today) || day;
  const n = daysUntil(day, today);
  if (done || n === null || n > 1) return { date, note: null, tone: 'normal' };
  if (n < 0) return { date, note: t('todos.due.overdue'), tone: 'overdue' };
  return { date, note: t(n === 0 ? 'todos.due.today' : 'todos.due.tomorrow'), tone: 'soon' };
}

/** The title of a link, or "<Kind> (kein Zugriff)". */
export function linkTitle(link: Pick<TodoLink, 'kind' | 'accessible' | 'title'>, t: Translate): string {
  if (!link.accessible || !link.title) {
    return t('todos.link.noAccess', { kind: t(LINK_KIND_LABEL[link.kind]) });
  }
  return link.title;
}

/** A part of a link line that is present: neither null nor undefined. */
const isPart = (part: string | null | undefined): part is string =>
  part !== null && part !== undefined;

/** The day and weekday of a meeting or agenda item link ("Di, 03.11."), else null. */
function linkDay(link: TodoLink, today: string, locale: string): string | null {
  const day =
    (link.kind === 'meeting' || link.kind === 'agenda_item' || link.kind === 'appointment') && link.detail?.date
      ? parseDay(link.detail.date)
      : null;
  return day ? `${weekdayName(day, locale)}, ${shortDay(day, locale, today)}` : null;
}

/** The link line of a tile: "Sitzung · Sondersitzung Haushalt 2027 · Di, 03.11.". */
export function linkLine(link: TodoLink, today: string, locale: string, t: Translate): string {
  const kind = t(LINK_KIND_LABEL[link.kind]);
  const number = link.kind === 'ticket' && link.detail?.number ? link.detail.number : null;
  const money = link.kind === 'invoice' || link.kind === 'expense' || link.kind === 'order';
  const amount = money && link.detail?.amount ? formatMoney(link.detail.amount, locale) : null;
  return !link.accessible || !link.title
    ? linkTitle(link, t)
    : [kind, number, link.title, amount, linkDay(link, today, locale)].filter(isPart).join(' · ');
}

/** The filters of the board and the list view; all run in the browser. */
export interface BoardFilter {
  readonly q: string;
  /** '' all, 'me' my cards, 'none' nobody, else a principal id. */
  readonly assignee: string;
  readonly labels: readonly string[];
  /** '' all, 'overdue', 'week' (within 7 days, overdue included), 'none' without a date. */
  readonly due: '' | 'overdue' | 'week' | 'none';
  /**
   * '' all cards, 'events' only Events, 'archive' the Events with the archived ones
   * ("Veranstaltungen mit Archiv"); the page reads those from the archive.
   */
  readonly kind: '' | 'events' | 'archive';
}

export const NO_FILTER: BoardFilter = { q: '', assignee: '', labels: [], due: '', kind: '' };

export function filterActive(f: BoardFilter): boolean {
  return !!(f.q.trim() || f.assignee || f.labels.length || f.due || f.kind);
}

/** Whether a card passes the filters. `mine` holds the ids of the cards assigned to me. */
export function matchesFilter(
  card: TodoCardTile,
  f: BoardFilter,
  ctx: {
    readonly today: string;
    readonly mine: ReadonlySet<Uuid>;
    readonly labels: ReadonlyMap<Uuid, TodoLabel>;
  },
): boolean {
  if (f.kind && !card.event) return false;
  if (f.assignee === 'me' && !ctx.mine.has(card.id)) return false;
  if (f.assignee === 'none' && card.assignees.length) return false;
  if (f.assignee && f.assignee !== 'me' && f.assignee !== 'none') {
    if (!card.assignees.some((a) => a.principalId === f.assignee)) return false;
  }
  if (f.labels.length && !f.labels.some((id) => card.labelIds.includes(id))) return false;
  if (f.due) {
    const n = card.dueDate ? daysUntil(card.dueDate, ctx.today) : null;
    if (f.due === 'none' && card.dueDate) return false;
    if (f.due === 'overdue' && (n === null || n >= 0)) return false;
    if (f.due === 'week' && (n === null || n > 7)) return false;
  }
  const q = f.q.trim().toLowerCase();
  if (q) {
    const hay = [
      card.title,
      card.primaryLink?.title ?? '',
      ...card.labelIds.map((id) => ctx.labels.get(id)?.name ?? ''),
      ...card.assignees.map((a) => a.displayName ?? ''),
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** The columns by position. */
export function sortedColumns<T extends { readonly position: number }>(
  columns: readonly T[],
): readonly T[] {
  return [...columns].sort((a, b) => a.position - b.position);
}

/** A new list with `item` at `index` of `list` (the place `splice(index, 0, item)` puts it). */
export function insertAt<T>(list: readonly T[], index: number, item: T): readonly T[] {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

/**
 * The column lists with the held card of a keyboard drag taken out of its column and put
 * at its place now (`col`, `index`); the lists as they are when no list holds it.
 */
export function withHeld(
  lists: readonly (readonly TodoCardTile[])[],
  held: { readonly cardId: Uuid; readonly col: number; readonly index: number },
): readonly (readonly TodoCardTile[])[] {
  const card = lists
    .map((list) => list.find((c) => c.id === held.cardId))
    .filter((c): c is TodoCardTile => c !== undefined)
    .at(-1);
  const without = (list: readonly TodoCardTile[]): readonly TodoCardTile[] => {
    const i = list.findIndex((c) => c.id === held.cardId);
    return i >= 0 ? [...list.slice(0, i), ...list.slice(i + 1)] : list;
  };
  const put = (list: readonly TodoCardTile[], i: number): readonly TodoCardTile[] =>
    card && i === held.col ? insertAt(list, held.index, card) : list;
  return card ? lists.map(without).map(put) : lists;
}

/** The cards of a column in board order (the server sends them by rank). */
export function cardsOf(board: TodoBoard, columnId: Uuid): readonly TodoCardTile[] {
  return board.cards.filter((c) => c.columnId === columnId);
}

/**
 * The move request for a card at `index` of `list`, the target column in its new order
 * WITH the card. The neighbor above wins (`afterId`); the first place names the card
 * below (`beforeId`); an empty column needs neither. One neighbor is enough for the
 * server and stays valid when a filter hides cards between the two.
 */
export function moveRequest(list: readonly TodoCardTile[], index: number, columnId: Uuid): TodoCardMove {
  if (index > 0) return { columnId, afterId: list[index - 1].id };
  const below = list[index + 1];
  return below ? { columnId, beforeId: below.id } : { columnId };
}

/**
 * The move request for a card from another board that lands at `index` of `list`, the
 * target column WITHOUT the card (the same neighbors as `moveRequest`).
 */
export function dropMove(list: readonly TodoCardTile[], index: number, columnId: Uuid): TodoCardMove {
  if (index > 0) return { columnId, afterId: list[index - 1].id };
  return list[0] ? { columnId, beforeId: list[0].id } : { columnId };
}

/**
 * The move of the "Verschieben" sheet: the top of a column names its first other card
 * (`beforeId`); the end and an empty column need no neighbor.
 */
export function sheetMove(
  cards: readonly TodoCardTile[],
  cardId: Uuid,
  columnId: Uuid,
  position: 'top' | 'bottom',
): TodoCardMove {
  if (position === 'bottom') return { columnId };
  const top = cards.find((c) => c.columnId === columnId && c.id !== cardId);
  return top ? { columnId, beforeId: top.id } : { columnId };
}

/** What the tile helpers below read of a board: a board read or a row of "Meine To-Dos". */
export type TileBoard = Pick<TodoBoard, 'columns' | 'cards'>;

/**
 * The board after a move, before the server answers: the card leaves its place and sits
 * after `afterId`, before `beforeId`, or at the end of the column.
 */
export function applyMove<B extends TileBoard>(board: B, cardId: Uuid, move: TodoCardMove): B {
  const card = board.cards.find((c) => c.id === cardId);
  if (!card) return board;
  const moved: TodoCardTile = { ...card, columnId: move.columnId };
  const rest = board.cards.filter((c) => c.id !== cardId);
  const anchor = anchorIndex(rest, move);
  const at = anchor >= 0 ? anchor : endOfColumn(rest, move.columnId);
  const cards = [...rest.slice(0, at), moved, ...rest.slice(at)];
  return { ...board, cards, columns: recount(board, cards) };
}

/**
 * The index in `rest` where a move puts its card: after `afterId`, else at `beforeId`, or -1
 * when the move names no neighbor that `rest` holds.
 */
function anchorIndex(rest: readonly TodoCardTile[], move: TodoCardMove): number {
  const after = move.afterId ? rest.findIndex((c) => c.id === move.afterId) : -1;
  const afterAt = after >= 0 ? after + 1 : -1;
  const before = move.beforeId ? rest.findIndex((c) => c.id === move.beforeId) : -1;
  return move.afterId ? afterAt : before;
}

/** The index after the last card of `columnId` in `rest`, or the end of `rest` without one. */
function endOfColumn(rest: readonly TodoCardTile[], columnId: Uuid): number {
  const last = rest.map((c) => c.columnId).lastIndexOf(columnId);
  return last >= 0 ? last + 1 : rest.length;
}

/** Put a server tile into the board (a move answer, a new card). */
export function replaceTile<B extends TileBoard>(board: B, tile: TodoCardTile): B {
  const has = board.cards.some((c) => c.id === tile.id);
  const cards = has ? board.cards.map((c) => (c.id === tile.id ? tile : c)) : [...board.cards, tile];
  return { ...board, cards, columns: recount(board, cards) };
}

/**
 * Put a server tile into the board at its place. A tile that changed its column or its rank
 * (a move of another user inside the column), or that the board does not hold yet (a restored
 * card), goes before the first card of its column with a higher rank, else to the end of it;
 * any other tile keeps its place (`replaceTile`).
 */
export function placeTile<B extends TileBoard>(board: B, tile: TodoCardTile): B {
  const old = board.cards.find((c) => c.id === tile.id);
  if (old && old.columnId === tile.columnId && old.rank === tile.rank) return replaceTile(board, tile);
  const base = old ? board : { ...board, cards: [...board.cards, tile] };
  const next = base.cards.find((c) => c.id !== tile.id && c.columnId === tile.columnId && c.rank > tile.rank);
  const moved = applyMove(base, tile.id, next ? { columnId: tile.columnId, beforeId: next.id } : { columnId: tile.columnId });
  return replaceTile(moved, tile);
}

/** The board after a card of another board landed on it, before the server answers. */
export function insertTile<B extends TileBoard & { readonly id: Uuid }>(
  board: B,
  tile: TodoCardTile,
  move: TodoCardMove,
): B {
  const base = { ...board, cards: [...board.cards.filter((c) => c.id !== tile.id), { ...tile, boardId: board.id }] };
  return applyMove(base, tile.id, move);
}

/**
 * Tell if a card may move from a board of kind `from` to a board of kind `to`. A card of a
 * shared board (gremium, team) never moves into a personal board: the server refuses it with
 * 403 `transfer_to_personal`, because the comments, files and links would then leave the
 * reach of everyone else on the board. The transfer dialog and every drop list ask this.
 */
export function canTransfer(from: TodoBoardKind, to: TodoBoardKind): boolean {
  return from === 'personal' || to !== 'personal';
}

/** The parts of a CDK drag that `dropEnter` reads (the element of the list it comes from). */
export interface DragSource {
  readonly dropContainer: { readonly element: { readonly nativeElement: HTMLElement } };
}

/**
 * The `cdkDropListEnterPredicate` of the drop lists of a board of kind `to`. The kind of the
 * board a drag comes from is the `data-board-kind` attribute of its drop list; a list without
 * it lets the card in (the server decides).
 */
export function dropEnter(to: TodoBoardKind): (drag: DragSource) => boolean {
  return (drag) => {
    const from = drag.dropContainer.element.nativeElement.dataset['boardKind'] as TodoBoardKind | undefined;
    return !from || canTransfer(from, to);
  };
}

/** The drop predicate of each board kind, one function per kind (a stable input). */
export const DROP_ENTER: Record<TodoBoardKind, (drag: DragSource) => boolean> = {
  personal: dropEnter('personal'),
  gremium: dropEnter('gremium'),
  free: dropEnter('free'),
  team: dropEnter('team'),
};

/** Drop a card from the board (archived). */
export function removeTile<B extends TileBoard>(board: B, cardId: Uuid): B {
  const cards = board.cards.filter((c) => c.id !== cardId);
  return { ...board, cards, columns: recount(board, cards) };
}

function recount(board: TileBoard, cards: readonly TodoCardTile[]): TodoBoard['columns'] {
  return board.columns.map((col) => ({ ...col, cardCount: cards.filter((c) => c.columnId === col.id).length }));
}

