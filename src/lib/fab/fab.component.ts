import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  Injectable,
  InjectionToken,
  inject,
  input,
  output,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { MEDIA } from '../breakpoints/breakpoints';
import { ButtonComponent } from '../button/button.component';
import { IconComponent, type IconName } from '../icon/icon.component';
import { reducedMotion } from '../motion/motion';
import { mediaQuery } from '../signals/media-query';
import { FabGroupComponent } from './fab-group.component';

/** A route for a fab: a press opens it instead of emitting `activate`. */
export interface FabLink {
  open(): void;
}

/**
 * Set by a directive on the same `app-fab` (for example `FabLinkDirective` of
 * `@stupa-makers/ui-kit/shell`), so the main entry does not need the router.
 */
export const FAB_LINK = new InjectionToken<FabLink>('FAB_LINK');

/** How far (px) a scroll area must be down before a phone fab folds. */
export const FAB_FOLD_SCROLL_PX = 8;

/** The side of a folded fab: a square. */
const FAB_FOLDED_PX = 56;

/** The size of an unfolded fab, read while it is unfolded. */
interface FabGeometry {
  readonly width: number;
  /** The padding before the icon. */
  readonly padStart: number;
  /** The padding before the icon that centres it in the folded square. */
  readonly foldedPadStart: number;
  readonly duration: number;
  readonly easing: string;
}

/** A CSS time such as `200ms` or `0.2s` in milliseconds. */
function cssMs(value: string): number {
  const v = parseFloat(value);
  if (Number.isNaN(v)) return 0;
  return value.trim().endsWith('ms') ? v : v * 1000;
}

/** How long a fab shown again waits for the leaving sheet of its form to drop the focus. */
const FAB_FOCUS_WAIT_MS = 1000;

/**
 * The label of the fab that was pressed last and has not had the focus back since. A page
 * hides its fab while the form that the fab opened is open, so the dialog or the sheet of
 * the form finds no opener to give the focus back to. The fab that the page shows again
 * takes it.
 */
@Injectable({ providedIn: 'root' })
export class FabFocusReturn {
  label: string | null = null;
}

/**
 * The floating main action of a page: one per page, at the bottom end of the content, on
 * every width. It is the "new" action of a list, or the save action (`icon="check"`,
 * `[loading]` while the save runs) of an editor or a settings page. The save action shows
 * only while the page has unsaved changes, and it replaces the "new" action of the page
 * then, so a page never shows two floating buttons.
 *
 * The look is the kit button `variant="fab"`: 56px high, accent surface, the elevated
 * shadow, the icon and the label in one row. The label always shows, also on a phone.
 *
 * Position:
 *
 * - Default: fixed at the end edge of the content column, above the bottom of the window
 *   or above the phone bottom bar (`--app-bottom-inset` holds the bar and the safe area).
 *   The end edge is the gutter beside a centred column (`--layout-max-width`, less
 *   `--rail-width`), or the gutter of a wide page (`.main--wide`). In a phone frame
 *   (`.frame--phone`) it sits 16px from the end and the bottom. `--fab-inset` adds the side
 *   padding of a sheet, so the button clears its round corner, and `--pane-foot-gap`
 *   replaces the gutter below it.
 * - `contained`: absolute at the bottom end of the nearest positioned ancestor, for a list
 *   pane beside a detail pane (`.ld-pane` is positioned). A list column with a head over
 *   its rows reaches down to the bottom edge of the screen, so the button adds its `--ld-pane-drop` to the gap below it.
 *
 * The button floats over the content, so the end of what scrolls below it keeps room for
 * it: a list pane pads its end by `calc(56px + var(--space-6))` (see `frame` of
 * `list-pane`).
 *
 * It sits below dialogs, sheets and drawers (`--z-sticky`). A page hides it while a
 * selection bar or a form with its own primary action is open.
 *
 * On a phone the label folds away while the page is scrolled down (spec 000567): the fab
 * shrinks to a 56px square with its icon in `--motion-base` and gets the label back at the
 * top. Any scroll area that scrolls vertically counts, so a list pane folds it too; a row
 * that scrolls only sideways does not. The label stays the accessible name.
 *
 * The fold runs between two measured sizes (app spec 002407): the width of the button goes
 * from the measured width to 56px and the padding before the icon to the one that centres
 * it, so the icon stays at the start edge and the label is cut at the end edge
 * (`fab--folding` clips it) while it fades. The fabs before it in a group follow the edge
 * in the layout. Every frame is the real layout of the button, so the end of the
 * animation is the folded state (`fab--folded`) pixel for pixel and nothing jumps. A clip or
 * a slide on the compositor next to a size on the main thread would run out of step on a
 * phone that is busy with the scroll. The unfold runs the other way. A change of direction
 * while the fold runs turns the animation round. With reduced motion, before the first
 * measure, or without the Web Animations API the size changes at once.
 *
 * `iconOnly` makes it the round 56px icon button; the label is then its accessible name
 * and its title. `tone="neutral"` gives it the surface of a secondary action, for example
 * "Reset" beside "Save".
 *
 * Several floating buttons of one page sit side by side in an `app-fab-group`, which takes
 * the position at the bottom end; a fab in a group has no position of its own.
 *
 * A page that removes the fab while the form of the fab is open gets the focus back on
 * the fab when it shows it again (spec 000513): a press notes the label, and the next fab
 * with that label takes the focus if nothing has it. A fab that gets the focus back (the
 * page kept it) clears the note.
 *
 * To open a route, use `FabLinkDirective` of `@stupa-makers/ui-kit/shell`
 * (`<app-fab link="/apply" …>`). A fab with a link opens the route and does not emit
 * `activate`.
 */
@Component({
  selector: 'app-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  host: {
    class: 'fab',
    '[class.fab--contained]': 'contained()',
    '[class.fab--grouped]': 'grouped',
    '[class.fab--neutral]': "tone() === 'neutral'",
  },
  template: `<app-button
    variant="fab"
    [iconOnly]="iconOnly()"
    [ariaLabel]="label()"
    [title]="iconOnly() ? label() : ''"
    [loading]="loading()"
    [disabled]="disabled()"
    (click)="onClick()"
  >
    <app-icon [name]="icon()" />@if (!iconOnly()) {<span class="fab__label">{{ label() }}</span>}
  </app-button>`,
  styleUrl: './fab.component.scss',
})
export class FabComponent {
  /** The visible text and the accessible name, for example "New application". */
  readonly label = input.required<string>();
  readonly icon = input<IconName>('plus');
  /** Absolute in the nearest positioned ancestor instead of fixed in the window. */
  readonly contained = input(false);
  /** The action runs, for example a save: the button shows the spinner and takes no click. */
  readonly loading = input(false);
  /** The action cannot run now, for example a save of a form with an error. */
  readonly disabled = input(false);
  /** The round icon button without the visible label. */
  readonly iconOnly = input(false);
  /** `accent`: the main action. `neutral`: a secondary action beside it in a group. */
  readonly tone = input<'accent' | 'neutral'>('accent');

  private readonly phone = mediaQuery(MEDIA.phone);
  /** The last scroll area that moved is down from its top. */
  private readonly scrolled = signal(false);
  /** A phone fab with a label shows only its icon while the page is scrolled down. */
  protected readonly folded = computed(() => this.phone() && this.scrolled() && !this.iconOnly());

  /** The fab sits in an `app-fab-group`, which positions it. */
  protected readonly grouped = !!inject(FabGroupComponent, { optional: true });

  private readonly link = inject(FAB_LINK, { optional: true, self: true });

  /** The button was pressed (not emitted when a link is set). */
  readonly activate = output<void>();

  private readonly back = inject(FabFocusReturn);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** The fold state that the fab goes to, or is in. */
  private foldTarget = false;
  /** The running fold or unfold, all with the same timing. */
  private anims: Animation[] = [];
  /** The size of the unfolded fab, from a `ResizeObserver` (app spec 002161). */
  private geometry: FabGeometry | null = null;

  constructor() {
    const host = this.host;
    const doc = host.ownerDocument;
    const take = (): void => {
      if (!doc.activeElement || doc.activeElement === doc.body) host.querySelector('button')?.focus();
    };
    // The sheet of the form can still hold the focus while it leaves: the focus that it
    // drops to nothing comes here.
    const onOut = (event: FocusEvent): void => {
      if (!event.relatedTarget) setTimeout(take);
    };
    const stopWaiting = (): void => doc.removeEventListener('focusout', onOut);
    afterNextRender(() => {
      if (this.back.label !== this.label()) return;
      this.back.label = null;
      take();
      doc.addEventListener('focusout', onOut);
      setTimeout(stopWaiting, FAB_FOCUS_WAIT_MS);
    });
    const clear = (): void => {
      if (this.back.label === this.label()) this.back.label = null;
    };
    host.addEventListener('focusin', clear);
    // Scroll events do not bubble, so the capture phase on the document sees every scroll area.
    const onScroll = (event: Event): void => {
      const target = event.target;
      const area = target instanceof Element ? target : doc.scrollingElement;
      if (!area || area.scrollHeight <= area.clientHeight) return;
      this.scrolled.set(area.scrollTop > FAB_FOLD_SCROLL_PX);
    };
    doc.addEventListener('scroll', onScroll, { capture: true, passive: true });
    effect(() => {
      const folded = this.folded();
      untracked(() => this.fold(folded));
    });
    const sizes =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => entries.forEach((e) => this.measure(e.target as HTMLElement)));
    afterNextRender({
      read: () => {
        const button = host.querySelector('button');
        if (button) sizes?.observe(button);
      },
    });
    inject(DestroyRef).onDestroy(() => {
      sizes?.disconnect();
      this.stopFold();
      doc.removeEventListener('scroll', onScroll, { capture: true });
      host.removeEventListener('focusin', clear);
      stopWaiting();
    });
  }

  /** Read the size of the unfolded fab; a folded one keeps the last size. */
  private measure(button: HTMLElement): void {
    const host = this.host.classList;
    if (host.contains('fab--folded') || host.contains('fab--folding')) return;
    const icon = button.querySelector('app-icon');
    if (!icon) return;
    const style = getComputedStyle(button);
    const tokens = getComputedStyle(this.host);
    const border = parseFloat(style.borderLeftWidth) || 0;
    this.geometry = {
      width: button.getBoundingClientRect().width,
      padStart: parseFloat(style.paddingLeft) || 0,
      foldedPadStart: (FAB_FOLDED_PX - icon.getBoundingClientRect().width) / 2 - border,
      duration: cssMs(tokens.getPropertyValue('--motion-base')),
      easing: tokens.getPropertyValue('--ease-standard').trim() || 'ease',
    };
  }

  /** Go to the folded (`true`) or the unfolded state, with the animation of app spec 002407. */
  private fold(folded: boolean): void {
    if (folded === this.foldTarget) return;
    this.foldTarget = folded;
    if (this.anims.length) {
      this.anims.forEach((anim) => anim.reverse());
      return;
    }
    const button = this.host.querySelector<HTMLElement>('button');
    const label = button?.querySelector<HTMLElement>('.fab__label');
    const g = this.geometry;
    const animate = !!button && !!label && !!g && g.width > FAB_FOLDED_PX && g.duration > 0;
    if (!animate || typeof button.animate !== 'function' || reducedMotion()) {
      this.host.classList.toggle('fab--folded', folded);
      return;
    }
    // Unfold: the full size comes back first, the animation starts from the folded size.
    this.host.classList.remove('fab--folded');
    this.host.classList.add('fab--folding');
    const timing: KeyframeAnimationOptions = { duration: g.duration, easing: g.easing, fill: 'both' };
    const anims = [
      button.animate(
        [
          { width: `${g.width}px`, paddingLeft: `${g.padStart}px` },
          { width: `${FAB_FOLDED_PX}px`, paddingLeft: `${g.foldedPadStart}px` },
        ],
        timing,
      ),
      label.animate([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], timing),
    ];
    if (!folded) anims.forEach((anim) => anim.reverse());
    anims[0].addEventListener('finish', () => this.settleFold());
    this.anims = anims;
  }

  /** The fold has ended: the fab takes the size it shows, and the animations go. */
  private settleFold(): void {
    this.host.classList.toggle('fab--folded', this.foldTarget);
    this.stopFold();
  }

  private stopFold(): void {
    this.host.classList.remove('fab--folding');
    this.anims.forEach((anim) => anim.cancel());
    this.anims = [];
  }

  protected onClick(): void {
    if (this.loading() || this.disabled()) return;
    this.back.label = this.label();
    if (this.link) this.link.open();
    else this.activate.emit();
  }
}
