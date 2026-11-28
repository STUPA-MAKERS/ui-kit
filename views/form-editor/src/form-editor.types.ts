import type { I18nMap } from '@stupa-makers/ui-kit';

/*
 * The form types of STUPA-Workflow (`core/api/models`), copied with the same fields, so the app
 * passes its API objects as they are.
 */

/**
 * The type of a form field, a mirror of the backend `FormFieldDef`.
 *
 * - `gremium_select` and `budget_select` are dynamic pickers. The server injects the
 *   options: Gremien or the budget tree.
 * - `email` and `iban` are typed inputs with built-in validation.
 * - `daterange` is a date range `{from, to}`.
 * - `funding` is the requested funding, separate from the cost total of the positions.
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'gremium_select'
  | 'budget_select'
  | 'email'
  | 'iban'
  | 'daterange'
  | 'checkbox'
  | 'file'
  | 'table'
  | 'markdown'
  | 'computed'
  | 'positions'
  | 'funding'
  | 'section';

/**
 * The hint texts of a `positions` field (app spec 003010), per language. A text may hold
 * placeholders: `{key}` for an answer, `{costTotal}`, `{amount}`, `{noOffersSwitch}`.
 */
export interface FieldHints {
  readonly below?: Readonly<Record<string, string>>;
  readonly placeholderValue?: Readonly<Record<string, string>>;
  readonly placeholderLabel?: Readonly<Record<string, string>>;
  readonly placeholderDuplicate?: Readonly<Record<string, string>>;
  readonly useNoOffers?: Readonly<Record<string, string>>;
  readonly noOffers?: Readonly<Record<string, string>>;
  readonly noFileTitle?: Readonly<Record<string, string>>;
  readonly noFileBody?: Readonly<Record<string, string>>;
}

/**
 * One option of a select field. The server sets `parentId`, `key` and `color` on the
 * options of `budget_select`, so the form shows the cost centres as a tree.
 */
export interface FieldOption {
  readonly value: string;
  readonly label: I18nMap;
  /** The value of the parent cost centre, or null for a top-level one. */
  readonly parentId?: string | null;
  /** The path segment of the cost centre. */
  readonly key?: string | null;
  /** The own display colour of the cost centre, or null. */
  readonly color?: string | null;
  /** The path key of the cost centre (`VS-80004`). */
  readonly pathKey?: string | null;
}

export interface FieldValidation {
  readonly min?: number;
  readonly max?: number;
  readonly minLen?: number;
  readonly maxLen?: number;
  readonly pattern?: string;
  readonly fileTypes?: readonly string[];
  readonly maxSizeMB?: number;
  readonly maxRows?: number;
  /** `positions`. The minimum comparison offers per position and the minimum
   *  number of positions. */
  readonly minOffers?: number;
  readonly minPositions?: number;
  /** `positions`. Allow the opt-out of comparison offers for one position. The
   *  user ticks a checkbox and must give a reason. Then one offer is enough. If
   *  unset, the opt-out is allowed. */
  readonly allowNoOffers?: boolean;
  /** `positions`. The hint texts of the field (app spec 003010); without a text no hint. */
  readonly hints?: FieldHints;
  /** `funding`. The value must not be above the cost total (app spec 003004). Unset = on. */
  readonly capAtCost?: boolean;
  /** `number`. The field holds the number of participants (spec 001631); at most one
   *  field of a form. The cost line then shows the amount per person. */
  readonly participants?: boolean;
  /** `budget_select`. The path key of the Kostenstelle whose subtree the picker offers
   *  (spec 001680). The server sends only the options below it. */
  readonly rootPath?: string;
}

/** How a form rule acts when the answers break it (spec 001671). */
export type RuleSeverity = 'block' | 'warn';

/**
 * A rule of a form across fields (spec 001670). `logic` is a JsonLogic expression over
 * the answers by key, `amount` and `costTotal`; the answers meet the rule when it gives
 * `true`. `message` is shown when they do not.
 */
export interface FormRule {
  readonly logic: Readonly<Record<string, unknown>>;
  readonly message: I18nMap;
  readonly severity: RuleSeverity;
}

/** A field definition of the effective form. It is camelCase like the OpenAPI by_alias. */
export interface FormFieldDef {
  readonly key: string;
  readonly type: FieldType;
  readonly label: I18nMap;
  readonly help?: I18nMap;
  readonly required?: boolean;
  readonly validation?: FieldValidation;
  readonly options?: readonly FieldOption[];
  readonly visibleIf?: Readonly<Record<string, unknown>>;
  readonly compute?: Readonly<Record<string, unknown>>;
  readonly isPII?: boolean;
  readonly isPromoted?: boolean;
  readonly promoteTarget?: string;
  /** How a `computed` field shows and rounds its value (app spec 002962); without it `number`. */
  readonly format?: ComputedFormat;
}

/** The display format of a `computed` field (app spec 002962). */
export type ComputedFormat = 'number' | 'money' | 'percent';

/** One signature row of the Antrag PDF (app spec 003005): the label and the signer. */
export interface SignatureRow {
  readonly label: string;
  readonly signer: string;
}

/** The open tab of the form editor (app spec 003171). */
export type FormEditorPage = 'questions' | 'form' | 'rules' | 'versions';
