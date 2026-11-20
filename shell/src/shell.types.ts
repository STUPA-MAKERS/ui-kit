import type { IconName } from '@stupa-makers/ui-kit';

/**
 * The frame around a page.
 *
 * - `rail`: a signed-in person. The navigation rail at the start edge, or the bottom bar
 *   on a phone. The footer shows only on a route with `footer: true`.
 * - `public`: nobody signed in. The public header and the footer, always.
 * - `bare`: only the page (for example a projector view). The shell also takes this frame
 *   by itself on a route with `chrome: false`.
 * - `pending`: the session is not known yet. Only the page, so no frame flashes up and
 *   changes a moment later.
 */
export type ShellFrame = 'rail' | 'public' | 'bare' | 'pending';

/** One entry of the navigation rail and of the phone bar. */
export interface ShellNavItem {
  /** A stable key, also the key of the nav mark template. */
  readonly key: string;
  /** The route of the entry. */
  readonly path: string;
  /** The visible label, already translated. */
  readonly label: string;
  readonly icon: IconName;
  /** `end` entries sit at the foot of the rail, after the spacer. */
  readonly place: 'main' | 'end';
  /** Match the active route exactly. */
  readonly exact?: boolean;
  /**
   * The collapsible group of the entry. Entries with the same group key form one group,
   * which shows as one entry that opens and closes, after the other `main` entries of the
   * rail and of "More". A grouped entry never goes into the phone bar itself.
   */
  readonly group?: ShellNavGroupRef;
}

/** The collapsible group of navigation entries (see `ShellNavItem.group`). */
export interface ShellNavGroupRef {
  readonly key: string;
  /** The visible label, already translated. */
  readonly label: string;
  readonly icon: IconName;
}

/** One group with its entries, in the order of the entries. */
export interface ShellNavGroup extends ShellNavGroupRef {
  readonly items: readonly ShellNavItem[];
}

/** The groups of `items`, in the order of their first entry. */
export function navGroups(items: readonly ShellNavItem[]): readonly ShellNavGroup[] {
  const keys = [...new Set(items.flatMap((i) => (i.group ? [i.group.key] : [])))];
  return keys.map((key) => {
    const members = items.filter((i) => i.group?.key === key);
    return { ...(members[0].group as ShellNavGroupRef), items: members };
  });
}

/** The mark of the app at the top of the rail. */
export interface ShellBrand {
  /** The route of the start page, which the mark links to. */
  readonly home: string;
  /** The name of the app, for the accessible name of the mark ("{name}, Start"). */
  readonly label: string;
  /** The image of the mark: one URL, or one per theme. */
  readonly mark: string | { readonly light: string; readonly dark: string };
}

/** One language of the language control of the account menu. */
export interface ShellLanguage {
  /** The language code, for example `de`. */
  readonly value: string;
  /** The name of the language in its own language, for example "Deutsch". */
  readonly label: string;
}
