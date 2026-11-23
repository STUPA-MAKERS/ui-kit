import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

/** The nearest box above `el` that scrolls up and down by itself, or null for the page. */
function scrollBox(el: HTMLElement): HTMLElement | null {
  const up = el.parentElement;
  if (!up || up === document.body || up === document.documentElement) return null;
  const y = getComputedStyle(up).overflowY;
  return y === 'auto' || y === 'scroll' ? up : scrollBox(up);
}

/** A length of a computed style in px (0 when it is not set). */
function px(el: Element, prop: string): number {
  return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;
}

/**
 * The free height below the top of `el`, in px: down to the bottom of the content box of the
 * box that scrolls it, or, when the page scrolls, down to the bottom of the screen above the
 * bottom bar and the padding of the main area. Scroll offsets do not change it.
 */
function freeHeight(el: HTMLElement): number {
  const top = el.getBoundingClientRect().top;
  const box = scrollBox(el);
  if (box) {
    const offset = top - box.getBoundingClientRect().top + box.scrollTop;
    return box.clientHeight - px(box, 'padding-bottom') - offset;
  }
  const inset = px(el, '--app-bottom-inset') + px(el, '--main-pad-bottom');
  return globalThis.innerHeight - inset - (top + globalThis.scrollY);
}

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
 * The shape of the rows of the list that an empty state stands in for. It no longer changes
 * the look (001360) and stays so that callers keep compiling.
 */
export type EmptyStateShape =
  'row' | 'choice' | 'person' | 'date' | 'agenda' | 'file' | 'table' | 'card' | 'chat' | 'text';

/**
 * One shape for "there is nothing here", in two looks.
 *
 * The face (001360): a flat face in a ring of faint dots, and below it a small muted hint
 * (the `icon` and the heading) and, if the caller projects one, one way to create
 * something. Never a reset (001363). The face blinks and glances aside, the dots wobble
 * and flicker, without end; with less motion it is a still picture (001361), and in very
 * high contrast it is white (001362). It serves every empty list, search without a hit,
 * section, tile and dialog list.
 *
 * In the list column of a list-detail page (`.ld-pane`) the face is large and centres in
 * the free height. Everywhere else it is small and keeps its own height.
 *
 * `plain`: no face, a muted glyph above the message. It serves everything that is not a
 * list: a detail pane with nothing open, a missing record (`code`), a page the reader has
 * no access to.
 *
 * Set `fill` when the empty state is the whole page or pane, the content of a tab or of a
 * side pane. The host then takes the free height of its flex-column parent and centres in it;
 * in a tab panel or a side pane the kit passes that height down (002650). Without it, the
 * block keeps its own height, for a card, a section or a dialog.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  host: {
    '[class.es-host--fill]': 'fill()',
    '[class.es-host--plain]': 'plain()',
    '[class.es-host--face]': 'face()',
  },
})
export class EmptyStateComponent {
  /** Short statement of what is missing. Never an error code on its own. */
  readonly heading = input.required<string>();
  /** One short line of context, only where the heading alone leaves the reader stuck. */
  readonly body = input<string | null>(null);
  /** Displayed above the heading, for a code such as 404. */
  readonly code = input<string | null>(null);
  /** No face, a glyph instead: the look for everything that is not an empty list. */
  readonly plain = input(false, { transform: booleanAttribute });
  /**
   * The icon of the state: before the hint below the face, or the glyph above the message of
   * a `plain` state. It names what is missing (001364): `searchOff` only for a search or a
   * filter without a hit, else the icon of the section or of the missing thing.
   */
  readonly icon = input<IconName>('file');
  /** No longer changes the look (001360); kept so that callers keep compiling. */
  readonly shape = input<EmptyStateShape>('row');
  /** No longer changes the look (001360); kept so that callers keep compiling. */
  readonly rows = input(5, { transform: numberAttribute });
  /**
   * Fill the free height of the parent and centre in it.
   * The parent must be a flex column that has that height.
   */
  readonly fill = input(false, { transform: booleanAttribute });
  /**
   * Heading level of the message, 1 to 3. Without it, a `fill` state is an `h2` and any
   * other state a plain line, so a list inside a page adds no heading.
   */
  readonly level = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });

  protected readonly headingLevel = computed(() => {
    const level = this.level();
    if (level === undefined || Number.isNaN(level)) return this.fill() ? 2 : 0;
    return Math.min(3, Math.max(1, Math.round(level)));
  });

  /** Every state that is not `plain` shows the face in its ring of dots. */
  protected readonly face = computed(() => !this.plain());

  protected readonly dots = FACE_DOTS;

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    // A `fill` state takes at least the free height below its own top and centres in it, so a
    // page, a pane or a tab with nothing in it shows the state in the middle of the free area,
    // whatever boxes stand between them (002650, 002405).
    const measure = (): void => {
      const el = this.host.nativeElement;
      if (!this.fill()) {
        el.style.removeProperty('--es-free');
        return;
      }
      el.style.setProperty('--es-free', `${Math.max(0, Math.floor(freeHeight(el)))}px`);
    };
    afterRenderEffect({ read: measure });
    globalThis.addEventListener?.('resize', measure);
    inject(DestroyRef).onDestroy(() => globalThis.removeEventListener?.('resize', measure));
  }
}
