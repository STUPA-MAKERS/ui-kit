import {
  type AnimationCallbackEvent,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { focusableIn, lockBodyScroll, trapTab } from '../focus/focus-trap';
import { IconComponent } from '../icon/icon.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { haptic } from '../util/haptic';
import { NgTemplateOutlet } from '@angular/common';
import { MEDIA } from '../breakpoints/breakpoints';
import { mediaQuery } from '../signals/media-query';
import { RowMenuComponent, type RowMenuSection } from '../row-menu/row-menu.component';
import type { Action } from '../screen/screen.types';

/**
 * Where the sheet comes from: `end` (the attendance sheet), `start` (the agenda drawer)
 * or `bottom` (the phone sheet: the "Mehr" sheet of the phone bar, and the pickers and
 * secondary panes of a page on a phone).
 */
export type SheetSide = 'end' | 'start' | 'bottom';

/** The side of `app-side-sheet` (002252): `auto` is `end` on a wide screen, `bottom` on a phone. */
export type SheetPlacement = SheetSide | 'auto';

/** The content of a sheet: `<ng-template sheetBody>` (002252). */
// eslint-disable-next-line @angular-eslint/directive-selector -- fixed slot name (002217)
@Directive({ selector: 'ng-template[sheetBody]', standalone: true })
export class SheetBodyDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

let nextId = 0;

/** A drag down by more than this many pixels closes a bottom sheet. */
const SWIPE_CLOSE_PX = 96;
/** A quick flick down (px per ms) closes it after a shorter way too. */
const SWIPE_CLOSE_SPEED = 0.5;
/** The way down that a flick needs at least, so a tap does not close the sheet. */
const SWIPE_MIN_PX = 24;
/** Controls in the header keep their own pointer events and start no drag. */
const NO_DRAG = 'button, a, input, select, textarea';

/**
 * A modal sheet over a scrim: the attendance sheet (end), the agenda drawer (start) and
 * the "Mehr" sheet of the phone bar (bottom).
 *
 * It is a modal dialog: the focus moves into the sheet when it opens and comes back to
 * where it was when it closes, Tab stays inside, Escape and a click on the scrim close
 * it, and the page behind does not scroll. A dialog inside the sheet keeps its own
 * Escape and Tab: the sheet ignores keys that start in it.
 *
 * `open` is two-way: `[(open)]="attendanceOpen"`. `closed` fires when the sheet closes
 * itself (Escape, the scrim, the close button).
 *
 * Slot: `<ng-template sheetBody>`, the content. `actions` puts buttons into the header
 * before the close button (icon buttons, `priority: 'menu'` in the three-dot menu), and
 * `action` reports a press with its key (002252).
 *
 * The bottom sheet is the phone sheet: a handle above a fixed header, rounded top
 * corners, at most 85% of the viewport high. A swipe down on the handle or the header
 * closes it too. The body scrolls inside and fades at an end only where more content is
 * hidden.
 *
 * `shown`: true from the opening until the sheet has gone after its closing. Content
 * that must exist only while the sheet shows (a chat marks its thread as seen) renders
 * under `@if (sheet.shown())`, so it stays in the sheet while the sheet slides out.
 *
 * `contentScrolls`: the content scrolls a list of its own and keeps its header in place
 * (the cost-centre picker). The body then only passes the height down and does not
 * scroll. The content must be a flex item that can shrink (`flex: 1 1 auto;
 * min-height: 0`).
 */
@Component({
  selector: 'app-side-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ButtonComponent, IconComponent, RowMenuComponent, UiKitTranslatePipe],
  templateUrl: './side-sheet.component.html',
  styleUrl: './side-sheet.component.scss',
})
export class SideSheetComponent {
  readonly open = model(false);
  /** The title of the sheet, also its accessible name. */
  readonly heading = input.required<string>();
  readonly placement = input<SheetPlacement>('end', { alias: 'side' });
  /**
   * The actions of the header, before the close button: an action with `priority: 'menu'`
   * goes into a ⋮ menu (sections by `group`), the others are buttons (an icon button when the
   * action has an icon, its label as the name); `kind: 'danger'`
   * gives the button the danger colour).
   */
  readonly actions = input<readonly Action[]>([]);
  /** A header action was pressed. */
  readonly action = output<{ readonly key: string }>();
  /** The content scrolls by itself; the body does not. */
  readonly contentScrolls = input(false);

  readonly closed = output<void>();

  private readonly phone = mediaQuery(MEDIA.phone);
  /** The side the sheet comes from now. */
  readonly side = computed<SheetSide>(() => {
    const p = this.placement();
    if (p !== 'auto') return p;
    return this.phone() ? 'bottom' : 'end';
  });
  protected readonly bodySlot = contentChild(SheetBodyDirective);
  protected readonly headActions = computed(() =>
    this.actions().filter((a) => a.priority !== 'menu'),
  );
  protected readonly menu = computed<readonly RowMenuSection[]>(() => {
    const items = this.actions().filter((a) => a.priority === 'menu');
    const groups = [...new Set(items.map((a) => a.group ?? ''))];
    return groups.map((g) => ({
      label: g || null,
      items: items
        .filter((a) => (a.group ?? '') === g)
        .map((a) => ({
          id: a.key,
          label: a.label,
          icon: a.icon,
          danger: a.kind === 'danger',
          disabledReason: a.disabled ? (a.disabledReason ?? a.label) : null,
        })),
    }));
  });

  /** Open, or still on its way out after the closing. */
  readonly shown = signal(false);

  protected readonly id = `side-sheet-${nextId++}`;
  private readonly pane = viewChild<ElementRef<HTMLElement>>('pane');
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  /** More content above or below the visible part of the body. */
  protected readonly fadeTop = signal(false);
  protected readonly fadeBottom = signal(false);
  /** How far a swipe pulls the bottom sheet down now, in px. */
  protected readonly dragY = signal(0);
  /** A swipe runs: the sheet follows the finger without a transition. */
  protected readonly dragging = signal(false);

  private drag: { pointerId: number; startY: number; startTime: number; past: boolean } | null =
    null;
  private bodyObserver: ResizeObserver | null = null;
  /** The body that has the scroll listener (a DOM listener, so a scroll runs no change detection). */
  private scrollBody: HTMLElement | null = null;
  private readonly onBodyScroll = (): void => this.measure();

  private returnFocus: HTMLElement | null = null;
  /** The pane of the current opening, to see after a closing whether it is still there. */
  private paneEl: HTMLElement | null = null;
  private releaseScroll: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.open()) this.activate();
      else this.deactivate();
    });
    inject(DestroyRef).onDestroy(() => this.deactivate());
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
  }

  /**
   * The leave animation of the pane: it slides back to its edge, and only then does the
   * pane go and `shown` turn false. Without a running animation (reduced motion) it goes
   * at once. Where Angular runs no leave animation at all (animations off, as in the
   * specs), `deactivate` sees the pane gone and turns `shown` false.
   */
  protected leave(event: AnimationCallbackEvent): void {
    const el = event.target as HTMLElement;
    el.classList.add('ss--leaving');
    const done = (): void => {
      if (!this.open()) this.shown.set(false);
      event.animationComplete();
    };
    const running = el.getAnimations?.() ?? [];
    if (running.length === 0) {
      done();
      return;
    }
    void Promise.all(running.map((a) => a.finished)).then(done, done);
  }

  /** Read the scroll position of the body and set the fades. */
  protected measure(): void {
    const el = this.body()?.nativeElement;
    if (!el) return;
    // A sub-pixel layout leaves a fraction of a pixel over on a body that fits.
    const slack = 1;
    this.fadeTop.set(el.scrollTop > slack);
    this.fadeBottom.set(el.scrollTop < el.scrollHeight - el.clientHeight - slack);
  }

  /** Start a swipe on the handle or the header of a bottom sheet. */
  protected dragStart(event: PointerEvent): void {
    if (this.side() !== 'bottom' || !event.isPrimary || event.button !== 0) return;
    if ((event.target as Element | null)?.closest(NO_DRAG)) return;
    this.drag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: event.timeStamp,
      past: false,
    };
    this.dragging.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  protected dragMove(event: PointerEvent): void {
    if (event.pointerId !== this.drag?.pointerId) return;
    // The sheet follows the finger down, never up past its place.
    const distance = Math.max(0, event.clientY - this.drag.startY);
    this.dragY.set(distance);
    // A tick when the sheet passes the way that closes it, so the finger feels the point
    // where a release closes. A drag back above it and down again ticks again.
    const past = distance > SWIPE_CLOSE_PX;
    if (past && !this.drag.past) haptic('tick');
    this.drag = { ...this.drag, past };
  }

  /** End a swipe: a long or quick way down closes the sheet, else it snaps back. */
  protected dragEnd(event: PointerEvent): void {
    const drag = this.drag;
    if (event.pointerId !== drag?.pointerId) return;
    const distance = Math.max(0, event.clientY - drag.startY);
    const speed = distance / Math.max(1, event.timeStamp - drag.startTime);
    this.drag = null;
    this.dragging.set(false);
    this.dragY.set(0);
    if (event.type === 'pointercancel') return;
    if (distance > SWIPE_CLOSE_PX || (distance > SWIPE_MIN_PX && speed > SWIPE_CLOSE_SPEED)) {
      this.close();
    }
  }

  protected onKey(event: KeyboardEvent): void {
    // A dialog inside the sheet (the delete question of the chat, "Neues To-Do") handles
    // its own Escape and Tab, and so does a field that already took the Escape.
    if ((event.target as Element).closest('[role="dialog"]') !== event.currentTarget) return;
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    trapTab(event, event.currentTarget as HTMLElement);
  }

  /** Runs once per opening: the effect reads only `open`. */
  private activate(): void {
    this.shown.set(true);
    this.returnFocus = document.activeElement as HTMLElement | null;
    // One lock per opening: a lock that is still held is released first, never dropped.
    this.releaseScroll?.();
    this.releaseScroll = lockBodyScroll();
    // The pane renders in this change detection; focus it right after. Closing clears
    // the timer, so the pane is there when it runs.
    this.timer = setTimeout(() => {
      this.timer = null;
      const pane = this.pane()!.nativeElement;
      this.paneEl = pane;
      (focusableIn(pane)[0] ?? pane).focus();
      this.watchBody();
    });
  }

  /**
   * Measure the fades now and whenever the body or its content changes size. The body
   * keeps its height while the content grows inside it, so the children are watched too.
   */
  private watchBody(): void {
    const el = this.body()?.nativeElement;
    if (!el) return;
    el.addEventListener('scroll', this.onBodyScroll, { passive: true });
    this.scrollBody = el;
    this.bodyObserver = new ResizeObserver(() => this.measure());
    this.bodyObserver.observe(el);
    for (const child of Array.from(el.children)) this.bodyObserver.observe(child);
    this.measure();
  }

  private deactivate(): void {
    clearTimeout(this.timer ?? undefined);
    this.timer = null;
    const pane = this.paneEl;
    this.paneEl = null;
    if (this.shown()) {
      // The template removes or animates the pane in this change detection; look after it.
      setTimeout(() => {
        if (!this.open() && !pane?.isConnected) this.shown.set(false);
      });
    }
    this.bodyObserver?.disconnect();
    this.bodyObserver = null;
    this.scrollBody?.removeEventListener('scroll', this.onBodyScroll);
    this.scrollBody = null;
    this.drag = null;
    this.dragging.set(false);
    this.dragY.set(0);
    // Closed from the start: nothing to undo.
    if (!this.releaseScroll) return;
    this.releaseScroll();
    this.releaseScroll = null;
    const target = this.returnFocus;
    this.returnFocus = null;
    if (target?.isConnected) target.focus();
  }
}
