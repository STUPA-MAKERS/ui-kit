/*
 * The to-do types of STUPA-Workflow that the board views read, with the same fields, so the
 * app passes its API objects as they are (S/framework/views/002271).
 */

export type Uuid = string;
export type IsoDateTime = string;
export type I18nMap = Readonly<Record<string, string>>;

/** A person reference of the server; a deleted or anonymized one has no name. */
export interface PersonRef {
  readonly principalId: Uuid | null;
  /** The name, else the account e-mail, else null. */
  readonly displayName: string | null;
}

export type TodoBoardKind = 'gremium' | 'free' | 'personal' | 'team';
export type TodoLabelColor = 'green' | 'blue' | 'violet' | 'amber' | 'red' | 'gray';
export type TodoLinkKind =
  | 'application'
  | 'meeting'
  | 'agenda_item'
  | 'vote'
  | 'appointment'
  | 'gremium'
  | 'invoice'
  | 'expense'
  | 'order'
  | 'budget'
  | 'ticket'
  | 'todo'
  | 'paperless';
export type TodoVoteStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type TodoVoteResult = 'passed' | 'rejected' | 'tie' | 'elected' | 'runoff' | 'no_majority';
export type TodoTicketStatus = 'new' | 'in_progress' | 'done' | 'rejected';

export interface TodoColumn {
  readonly id: Uuid;
  readonly name: string;
  readonly position: number;
  readonly isDone: boolean;
  readonly cardCount: number;
}

export interface TodoLabel {
  readonly id: Uuid;
  readonly name: string;
  readonly color: TodoLabelColor;
}

/** The facts of a link target; only the fields of its kind are set. */
export interface TodoLinkDetail {
  readonly stateLabel?: I18nMap | null;
  readonly date?: string | null;
  readonly meetingTitle?: string | null;
  readonly position?: number | null;
  readonly number?: string | null;
  readonly status?: TodoTicketStatus | null;
  readonly boardName?: string | null;
  readonly columnName?: string | null;
  readonly isDone?: boolean | null;
  /** Invoice (gross) or booking amount, a decimal string in EUR. */
  readonly amount?: string | null;
  readonly counterparty?: string | null;
  readonly costCentre?: string | null;
  readonly invoiceStatus?: 'open' | 'paid' | null;
  readonly bookingKind?: 'expense' | 'income' | null;
  readonly voteStatus?: TodoVoteStatus | null;
  readonly voteResult?: TodoVoteResult | null;
  readonly endDate?: string | null;
  readonly startTime?: string | null;
  readonly endTime?: string | null;
  readonly place?: string | null;
  /** The name of the document type of a Paperless document. */
  readonly documentType?: string | null;
}

export interface TodoLink {
  readonly id: Uuid;
  readonly kind: TodoLinkKind;
  readonly targetId: Uuid;
  /** false: title, url and detail are null ("<Kind> (kein Zugriff)"). */
  readonly accessible: boolean;
  readonly title: string | null;
  readonly url: string | null;
  readonly detail: TodoLinkDetail | null;
  readonly granted?: boolean;
}

/** The event data of a card: the card is an Event (`Veranstaltung`). Dates are `YYYY-MM-DD`. */
export interface TodoEventBrief {
  readonly startsOn: string | null;
  readonly endsOn: string | null;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly place: string | null;
  readonly participants: number | null;
  readonly seriesId: Uuid | null;
  readonly seriesName: string | null;
}

export interface TodoCardTile {
  readonly id: Uuid;
  readonly boardId: Uuid;
  readonly columnId: Uuid;
  readonly rank: string;
  readonly title: string;
  /** `YYYY-MM-DD`. */
  readonly dueDate: string | null;
  readonly completedAt: IsoDateTime | null;
  readonly labelIds: readonly Uuid[];
  readonly assignees: readonly PersonRef[];
  readonly checklist: { readonly done: number; readonly total: number };
  readonly commentCount: number;
  readonly primaryLink: TodoLink | null;
  readonly linkCount: number;
  /** Set for an Event. */
  readonly event: TodoEventBrief | null;
  readonly version: number;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

export interface TodoBoard {
  readonly id: Uuid;
  readonly name: string;
  readonly kind: TodoBoardKind;
  readonly gremiumId: Uuid | null;
  readonly archiveAfterDays: number | null;
  readonly canWrite: boolean;
  readonly canConfigure: boolean;
  readonly columns: readonly TodoColumn[];
  readonly labels: readonly TodoLabel[];
  readonly cards: readonly TodoCardTile[];
  readonly archivedCount: number;
  readonly archived?: boolean;
  readonly agendaGremiumIds?: readonly Uuid[];
}

/** A board of the rows ("Meine To-Dos", "Alle"). */
export interface TodoAssignedBoard {
  readonly id: Uuid;
  readonly name: string;
  readonly kind: TodoBoardKind;
  readonly gremiumId: Uuid | null;
  readonly canWrite: boolean;
  readonly columns: readonly TodoColumn[];
  readonly labels: readonly TodoLabel[];
  readonly cards: readonly TodoCardTile[];
}

/** A move inside a board: into `columnId`, after `afterId` or before `beforeId`, else at the end. */
export interface TodoCardMove {
  readonly columnId: Uuid;
  readonly beforeId?: Uuid | null;
  readonly afterId?: Uuid | null;
}
