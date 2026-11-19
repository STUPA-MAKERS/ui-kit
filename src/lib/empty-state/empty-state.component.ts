import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from "@angular/core";
import { IconComponent, type IconName } from "../icon/icon.component";

/** Bar widths in percent of the ghost rows, title and sub line. Uneven, so they read as text. */
const GHOST_ROWS: readonly { readonly title: number; readonly sub: number }[] =
  [
    { title: 62, sub: 34 },
    { title: 48, sub: 28 },
    { title: 70, sub: 40 },
    { title: 52, sub: 30 },
    { title: 44, sub: 26 },
  ];

/**
 * The dots around the face of an empty list: centre, radius, and the periods and delays of
 * the wobble and the flicker. Uneven distances and periods, so the dots never move in step.
 */
const FACE_DOTS: readonly {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly wobble: string;
  readonly wobbleDelay: string;
  readonly flicker: string;
  readonly flickerDelay: string;
}[] = [
  [63.1, 11.4, 2.3, 4.22, -3.75, 6.46, -0.52],
  [86.2, 17.0, 2.0, 4.21, -0.63, 6.7, -7.44],
  [100.7, 22.2, 2.2, 6.84, -4.04, 6.59, -8.79],
  [123.3, 33.9, 1.9, 4.43, -0.82, 6.23, -7.35],
  [118.5, 57.4, 2.2, 5.12, -3.83, 5.25, -0.54],
  [107.4, 76.7, 2.0, 4.94, -4.1, 6.81, -2.7],
  [73.6, 90.9, 1.8, 5.72, -3.68, 8.5, -6.57],
  [55.8, 95.0, 1.7, 5.25, -5.3, 5.61, -4.4],
  [36.4, 84.1, 2.4, 5.72, -6.13, 6.25, -6.26],
  [14.8, 60.7, 2.1, 6.52, -6.61, 6.9, -5.98],
  [9.5, 48.7, 2.2, 6.98, -5.75, 6.14, -3.47],
  [32.2, 26.2, 2.1, 4.5, -0.82, 5.24, -6.91],
  [38.6, 16.7, 2.0, 6.61, -0.56, 6.8, -4.94],
].map(([x, y, r, w, wd, f, fd]) => ({
  x,
  y,
  r,
  wobble: `${w}s`,
  wobbleDelay: `${wd}s`,
  flicker: `${f}s`,
  flickerDelay: `${fd}s`,
}));

/**
 * The shape of the ghost rows: the real rows of the list they stand in for.
 *
 * - `row`: title and sub line, a short tag at the end (most lists).
 * - `choice`: a radio ring before the text (a list to pick one from).
 * - `person`: an avatar before the name (members, guests, users).
 * - `date`: a date block before the title (meetings, protocols).
 * - `agenda`: a number before the title (agenda items).
 * - `file`: a file square before the name (attachments, logos).
 * - `table`: cells in columns (data tables).
 * - `card`: a card with title, sub line and a foot of chips (to-do cards).
 * - `chat`: message bubbles, left and right (a conversation).
 * - `text`: lines of running text (a protocol text).
 */
export type EmptyStateShape =
  | "row"
  | "choice"
  | "person"
  | "date"
  | "agenda"
  | "file"
  | "table"
  | "card"
  | "chat"
  | "text";

/**
 * One shape for "there is nothing here", in two looks.
 *
 * A list: a flat face in a ring of faint dots stands for the list that is missing, and
 * below it sit the message and, if the caller projects one, one way on (a tonal button).
 * The face blinks and glances aside, the dots wobble and flicker, without end. With less
 * motion (000219) the face is a still picture. It serves an empty list and a search
 * without a match.
 *
 * One row (`rows="1"`, a section or a small tile): one faint row surface that holds the
 * message (000613). The face would not fit there.
 *
 * `plain`: no ghost rows, a muted glyph above the message. It serves everything that is
 * not a list: a detail pane with nothing open, a missing record (`code`), a page the
 * reader has no access to. Ghost rows there would promise a list that never comes.
 *
 * Set `fill` when the empty state is the whole page or pane. The host then takes the free
 * height of its flex-column parent. The ghost rows stay at the top, where the list would
 * start; a `plain` state centres in that height. Without it, the block keeps its own
 * height, for a card, a tab or a dialog.
 */
@Component({
  selector: "app-empty-state",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: "./empty-state.component.html",
  styleUrl: "./empty-state.component.scss",
  host: {
    "[class.es-host--fill]": "fill()",
    "[class.es-host--plain]": "plain()",
    "[class.es-host--face]": "face()",
  },
})
export class EmptyStateComponent {
  /** Short statement of what is missing. Never an error code on its own. */
  readonly heading = input.required<string>();
  /** One short line of context, only where the heading alone leaves the reader stuck. */
  readonly body = input<string | null>(null);
  /** Displayed above the heading, for a code such as 404. */
  readonly code = input<string | null>(null);
  /** No ghost rows: the look for everything that is not an empty list. */
  readonly plain = input(false, { transform: booleanAttribute });
  /** Muted glyph above the message of a `plain` state. A `code` takes its place. */
  readonly icon = input<IconName>("file");
  /** The shape of the ghost rows, after the real rows of the list. */
  readonly shape = input<EmptyStateShape>("row");
  /** Number of ghost rows, 1 to 5. A small box (a dashboard tile) passes fewer. */
  readonly rows = input(5, { transform: numberAttribute });
  /**
   * Fill the free height of the parent: ghost rows at the top, a `plain` state centred.
   * The parent must be a flex column that has that height.
   */
  readonly fill = input(false, { transform: booleanAttribute });
  /**
   * Heading level of the message, 1 to 3. Without it, a `fill` state is an `h2` and any
   * other state a plain line, so a list inside a page adds no heading.
   */
  readonly level = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) =>
      v == null || v === "" ? undefined : numberAttribute(v),
  });

  protected readonly headingLevel = computed(() => {
    const level = this.level();
    if (level === undefined || Number.isNaN(level)) return this.fill() ? 2 : 0;
    return Math.min(3, Math.max(1, Math.round(level)));
  });

  protected readonly ghosts = computed(() =>
    GHOST_ROWS.slice(
      0,
      Math.min(GHOST_ROWS.length, Math.max(1, this.rows() || 1)),
    ),
  );

  /**
   * One ghost row: it is lower than the message, so it grows to the height of the message
   * and shows no bars. Bars beside the heading look like a list that is still loading.
   */
  protected readonly one = computed(
    () => !this.plain() && this.ghosts().length === 1,
  );

  /** An empty list of two or more rows: the face in its ring of dots, no ghost rows. */
  protected readonly face = computed(() => !this.plain() && !this.one());

  protected readonly dots = FACE_DOTS;
}
