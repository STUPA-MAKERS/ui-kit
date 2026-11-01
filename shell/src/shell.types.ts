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
