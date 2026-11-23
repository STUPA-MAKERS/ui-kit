/*
 * The flow types of STUPA-Workflow that the flow editor views read, with the same fields, so the
 * app passes its flow as it is (S/framework/views/002277).
 */

/** A text in each content language. */
export type I18nMap = Readonly<Record<string, string>>;

/** State kind in the global flow: only normal + vote. */
export type StateKind = 'normal' | 'vote';

/** Per-state config depending on `kind`. Empty object for `normal`. */
/** Where a vote state takes its gremium from, besides a fixed `gremiumId`. */
export type GremiumSource = 'budget';

export interface StateConfig {
  /** vote: the fixed gremium that votes. Exactly one of `gremiumId` and `gremiumSource`. */
  readonly gremiumId?: string;
  /**
   * vote: `budget` takes the deciding gremium of the cost center of the application when
   * the application enters the state (`decisionGremiumId` of the node or an ancestor).
   */
  readonly gremiumSource?: GremiumSource;
}

export interface StateDef {
  readonly key: string;
  readonly label: I18nMap;
  /** Display color of the state badge (hex), optional. */
  readonly color?: string | null;
  readonly editAllowed?: boolean;
  readonly isInitial?: boolean;
  /** Terminal state: terminal applications are subject to retention/anonymization. */
  readonly isTerminal?: boolean;
  /** An Antrag in this state counts as approved (spec 000571). Never with `isDenied`. */
  readonly isApproved?: boolean;
  /** An Antrag in this state counts as denied (spec 000571). Never on a vote state. */
  readonly isDenied?: boolean;
  /**
   * "Ziel für ersetzte Anträge" (001722): the old Antrag moves here when its new version is
   * submitted. At most one state; it is terminal and denied.
   */
  readonly isReplacedTarget?: boolean;
  /** State kind. Absent ⇒ `normal`. */
  readonly kind?: StateKind | null;
  /** Kind-specific configuration. */
  readonly config?: StateConfig | null;
}

/** Result branch of a vote state: pass/fail. */
export type TransitionBranch = 'pass' | 'fail';

export interface TransitionDef {
  readonly from: string;
  readonly to: string;
  readonly label?: I18nMap | null;
  /** Optional color: tints the arrow in the editor + the decision button in the application. */
  readonly color?: string | null;
  readonly guard?: Guard | null;
  readonly actions?: readonly ActionDef[];
  readonly order?: number | null;
  /** Automatic transition: fires without user action as soon as the guard holds. */
  readonly automatic?: boolean;
  /** Result branch for vote states: pass/fail. */
  readonly branch?: TransitionBranch | null;
  /** "Requires action": counts as an open task in the tasks tab.
   *  Absent ⇒ `true`. `false` = a purely optional action. */
  readonly requiresAction?: boolean;
}

/** Visual node group. Only the editor renders it and the engine ignores it. On the
 *  canvas a group is always ONE labeled box. Its content opens through drill-down
 *  (breadcrumbs). Groups nest through `groupIds`. A state or group sits in at most
 *  one parent. */
export interface FlowGroup {
  readonly id: string;
  readonly name: string;
  readonly stateKeys: readonly string[];
  /** Directly contained sub-groups (nesting). */
  readonly groupIds?: readonly string[];
  readonly color?: string | null;
}

/** Optional editor layout (node positions + groups). The graph stores it. */
export interface FlowLayout {
  readonly positions?: Record<string, { readonly x: number; readonly y: number }>;
  readonly groups?: readonly FlowGroup[];
}

export interface FlowGraph {
  readonly states: readonly StateDef[];
  readonly transitions: readonly TransitionDef[];
  readonly layout?: FlowLayout | null;
}

/**
 * Comparison operators of the `compare` guard (type-dependent at runtime). The guard types
 * mirror the backend whitelist in `shared/guards.py`.
 */
export type CompareOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in';
export const COMPARE_OPS: readonly CompareOp[] = ['==', '!=', '<', '<=', '>', '>=', 'in'] as const;

/** Condition operators (on automatic + manual transitions). */
export type GuardConditionOp =
  | 'applicantRoleIs'
  | 'applicantCommitteeIs'
  | 'applicationTypeIs'
  | 'attachmentPresent'
  | 'budgetIs'
  | 'budgetFitsApplication'
  | 'budgetHasDecisionGremium'
  | 'hasField'
  | 'compare';
/** Actor gates — only on manual transitions. */
export type GuardActorOp = 'roleIs' | 'isInCommittee' | 'isInVoteGremium' | 'actorIsApplicant';
export type GuardLeafOperator = GuardConditionOp | GuardActorOp;
export type GuardCombinator = 'and' | 'or' | 'not';

/** A single guard node (exactly one operator, like `validate_guard`). */
export type Guard = Record<string, unknown>;

export const GUARD_CONDITION_OPERATORS: readonly GuardConditionOp[] = [
  'applicantRoleIs',
  'applicantCommitteeIs',
  'applicationTypeIs',
  'attachmentPresent',
  'budgetIs',
  'budgetFitsApplication',
  'budgetHasDecisionGremium',
  'hasField',
  'compare',
] as const;
export const GUARD_ACTOR_OPERATORS: readonly GuardActorOp[] = [
  'roleIs',
  'isInCommittee',
  'isInVoteGremium',
  'actorIsApplicant',
] as const;
export const GUARD_LEAF_OPERATORS: readonly GuardLeafOperator[] = [
  ...GUARD_CONDITION_OPERATORS,
  ...GUARD_ACTOR_OPERATORS,
] as const;
export const GUARD_COMBINATORS: readonly GuardCombinator[] = ['and', 'or', 'not'] as const;


export type ActionType =
  | 'webhook'
  | 'notify'
  | 'addToNextSession'
  | 'assignBudget'
  | 'assignBudgetFromField'
  | 'assignBudgetFromApplicantGremium'
  | 'assignBudgetFromMap';
export const ACTION_TYPES: readonly ActionType[] = [
  'webhook',
  'notify',
  'addToNextSession',
  'assignBudget',
  'assignBudgetFromField',
  'assignBudgetFromApplicantGremium',
  'assignBudgetFromMap',
] as const;

/**
 * The actions that set the cost center. None of them may sit on a transition into a vote
 * state with `gremiumSource: 'budget'`: the state takes its gremium on entry, before the
 * action runs.
 */
export const ASSIGN_BUDGET_ACTIONS: readonly ActionType[] = [
  'assignBudget',
  'assignBudgetFromField',
  'assignBudgetFromApplicantGremium',
  'assignBudgetFromMap',
] as const;

/** Bool-valued guard operators. Mirrors `_BOOL_VALUE_OPERATORS` of the backend. */
export const GUARD_BOOL_OPERATORS: readonly GuardLeafOperator[] = [
  'budgetFitsApplication',
  'budgetHasDecisionGremium',
  'actorIsApplicant',
  'attachmentPresent',
  'isInVoteGremium',
] as const;

/**
 * Recipient kind of a `notify` action. `voteGremium` is the gremium that decides the
 * current vote; `budgetGremium` is the deciding gremium of the cost center. Both take
 * no `ref`.
 */
export type NotifyRecipientKind =
  | 'gremium'
  | 'role'
  | 'applicant'
  | 'email'
  | 'voteGremium'
  | 'budgetGremium';
export const NOTIFY_RECIPIENT_KINDS: readonly NotifyRecipientKind[] = [
  'gremium',
  'role',
  'applicant',
  'email',
  'voteGremium',
  'budgetGremium',
] as const;
export interface NotifyRecipient {
  readonly kind: NotifyRecipientKind;
  readonly ref?: string;
}

export interface ActionDef {
  readonly type: ActionType;
  readonly [param: string]: unknown;
}

export interface TransitionListRow {
  readonly index: number;
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly guard: string;
  readonly automatic: boolean;
  readonly branch: string | null;
}

export interface TransitionLists {
  readonly incoming: readonly TransitionListRow[];
  readonly outgoing: readonly TransitionListRow[];
}
