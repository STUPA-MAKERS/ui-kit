import type { Params } from '@angular/router';
import type { AvatarPerson } from '../avatar/avatar.component';
import type { IconName } from '../icon/icon.component';
import type { StatusKind } from '../status-text/status-text.component';

/*
 * The shared view-model types of the screens and the views (specs S/framework/types/002230
 * to 002236). They are plain readonly data: an app maps its API data to them in an adapter.
 */

/** A link that a view model holds. A kit component renders it as `<a href>`. §S/framework/types/002236 */
export interface RouteLink {
  readonly commands: readonly unknown[];
  readonly query?: Params;
  readonly fragment?: string;
}

/** A person in a view model: the avatar person of the kit. */
export type PersonRef = AvatarPerson;

/** A colour as a role of the tokens, never a hex value: the status kinds and eight categories. */
export type ColourRole =
  | StatusKind
  | 'cat-1'
  | 'cat-2'
  | 'cat-3'
  | 'cat-4'
  | 'cat-5'
  | 'cat-6'
  | 'cat-7'
  | 'cat-8';

/** A mark on a row, a tab or a nav entry: a dot, never a count. */
export type Mark = 'new' | 'warn' | null;

/** The status chip in a head or on a row. */
export interface StatusChip {
  readonly label: string;
  readonly kind: StatusKind;
}

/** One chip of the meta line of a head. */
export interface MetaChip {
  readonly label: string;
  readonly icon?: IconName;
  readonly link?: RouteLink;
  readonly title?: string;
}

/** Where the back button of a head goes: a link, or an action key for the (action) output. */
export type BackTarget = RouteLink | { readonly action: string };

/** The language switch of a content editor in the head. */
export interface LangSwitch {
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

/** The head of a screen. §S/framework/types/002230 */
export interface ScreenHead {
  readonly title: string;
  readonly kicker?: string;
  readonly status?: StatusChip;
  readonly meta?: readonly MetaChip[];
  /** `null`: no back button. Absent: back to the parent route. */
  readonly back?: BackTarget | null;
  readonly lang?: LangSwitch;
}

/** The question an action asks before it runs. */
export interface ConfirmSpec {
  readonly title: string;
  readonly text?: string;
  readonly confirmLabel: string;
  /** A word the person must type, for example RESTORE. */
  readonly word?: string;
}

/** The kinds of an action. */
export type ActionKind = 'main' | 'normal' | 'danger';
/** How important an action is: the kit places it from this. */
export type ActionPriority = 'head' | 'menu' | 'fab';
/** The manual override of the ⋮ placement of one action. */
export type ActionOverflow = 'auto' | 'never' | 'always';

/** An action of a screen, a head, a row, a card or a dialog. §S/framework/types/002231 */
export interface Action {
  readonly key: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly kind?: ActionKind;
  readonly priority?: ActionPriority;
  readonly disabled?: boolean;
  /** Why the action is disabled: the tooltip of the button, the description of a menu item. */
  readonly disabledReason?: string;
  readonly busy?: boolean;
  readonly route?: RouteLink;
  readonly href?: string;
  readonly confirm?: ConfirmSpec;
  readonly group?: string;
  readonly overflow?: ActionOverflow;
}

/** How many head actions stay in the head per width. §S/framework/types/002231 */
export interface HeadSlots {
  readonly phone?: number;
  readonly narrow?: number;
  readonly wide?: number;
}

/** A row of a list screen or a row group. §S/framework/types/002232 */
export interface ListRow {
  readonly id: string;
  readonly title: string;
  readonly meta?: readonly string[];
  readonly status?: StatusChip;
  readonly avatar?: PersonRef | readonly PersonRef[];
  readonly icon?: IconName;
  readonly trailing?: string;
  readonly mark?: Mark;
  readonly link?: RouteLink;
  readonly actions?: readonly Action[];
  readonly selectable?: boolean;
  readonly swipe?: { readonly start?: Action; readonly end?: Action };
}

/** A group of rows with its head. */
export interface ListGroup {
  readonly key: string;
  readonly label: string;
  readonly rows: readonly ListRow[];
}

/** The search of a list. §S/framework/types/002233 */
export interface SearchDef {
  readonly placeholder: string;
  /** The URL parameter, default `q`. */
  readonly param?: string;
}

/** One option of a filter. */
export interface FilterOption {
  readonly value: string;
  readonly label: string;
  readonly icon?: IconName;
}

/** A filter of a list. §S/framework/types/002233 */
export interface FilterDef {
  /** Also the URL parameter. */
  readonly key: string;
  readonly label: string;
  readonly kind: 'single' | 'multi' | 'date-range' | 'toggle';
  readonly options?: readonly FilterOption[];
  readonly value: string | readonly string[] | null;
  readonly place?: 'chip' | 'sheet';
}

/** One sort of a list. §S/framework/types/002233 */
export interface SortDef {
  readonly key: string;
  readonly label: string;
  readonly active: boolean;
  readonly dir: 'asc' | 'desc';
}

/** The whole query of a list, which the list screen emits after each change. */
export interface ListQuery {
  readonly search: string;
  readonly filters: Readonly<Record<string, string | readonly string[] | null>>;
  readonly sort: { readonly key: string; readonly dir: 'asc' | 'desc' } | null;
}

/**
 * A side sheet of a detail screen; its content is the slot `screenSheet` with the same key.
 * An edge tab opens it beside the body; on a phone it is a bottom sheet, or it takes the
 * place of the body when `replaces` is true. §S/framework/screens/002241
 */
export interface SideSheetDef {
  readonly key: string;
  readonly label: string;
  readonly icon: IconName;
  readonly mark?: Mark;
  readonly replaces?: boolean;
}

/** A tab of a detail screen; its body is the slot with the same key. §S/framework/types/002235 */
export interface ScreenTab {
  readonly key: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly mark?: Mark;
  readonly hidden?: boolean;
}
