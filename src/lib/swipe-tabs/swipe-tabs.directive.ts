import { DestroyRef, Directive, ElementRef, NgZone, afterNextRender, inject, input, output } from '@angular/core';
import {
  GESTURE_SLOP,
  VelocityTracker,
  modalOpen,
  motionMs,
  motionReduced,
  touchGesturesOn,
} from '../gesture/gesture';
import { SWIPE_BACK_EDGE } from '../swipe-back/swipe-back.directive';
import type { TabItem } from '../tabs/tabs.component';
import { haptic } from '../util/haptic';

/** A release past this part of the panel width changes the tab. */
export const SWIPE_TABS_DISTANCE = 0.25;
/** A release faster than this changes the tab too, in px/ms. */
export const SWIPE_TABS_VELOCITY = 0.5;
/** Past the first or the last tab the panel follows the finger only this much. */
export const SWIPE_TABS_RESIST = 0.2;
/** The new panel comes in from this part of the width. */
const ENTER_OFFSET = 0.3;

/** What the finger must not take over: a field, and anything that says so itself. */
const KEEP = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-no-swipe]';

/**
 * Swipe sideways on a phone to go to the next or the previous tab, as in a native app.
 *
 * The host holds the tab panels (`role="tabpanel"`); the page binds the tabs of its bar
 * and the active tab: `[appSwipeTabs]="tabs()" [(appSwipeTabsActive)]="tab"`. A swipe
 * that starts below the top of the visible panel, in the host or on the page (`main`)
 * below it, so not on the head or the tab bar but also below a short panel, moves the
 * panel with the finger. A release past
 * {@link SWIPE_TABS_DISTANCE} of the width, or faster than {@link SWIPE_TABS_VELOCITY},
 * slides it out, emits the next enabled tab and slides the new panel in from the other
 * side. A shorter release springs back. Past the first or the last tab the panel moves
 * only {@link SWIPE_TABS_RESIST} of the way and always springs back.
 *
 * The swipe does not start within {@link SWIPE_BACK_EDGE} px of the left screen edge,
 * because that is the swipe back. It does not start on a field, on an element marked
 * `data-no-swipe`, or on an element that scrolls sideways itself (a wide table, a chip
 * row), because the finger acts on that element. After {@link GESTURE_SLOP} px the finger
 * picks the axis, and a vertical move stays a scroll.
 *
 * The panel moves with `left` (and `position: relative` while it moves), not with a
 * transform, for the same reason as the swipe back: a transform makes the panel the
 * containing block of its fixed children. The directive works only on a phone with a
 * touch-first pointer (`touchGesturesOn`), while `appSwipeTabsOff` is false and no modal
 * layer is open. With reduced motion the tab changes without a slide.
 */
@Directive({
  selector: '[appSwipeTabs]',
  standalone: true,
})
export class SwipeTabsDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  readonly tabs = input<readonly TabItem[]>([], { alias: 'appSwipeTabs' });
  readonly active = input<string | null>(null, { alias: 'appSwipeTabsActive' });
  readonly off = input(false, { alias: 'appSwipeTabsOff' });

  readonly activeChange = output<string>({ alias: 'appSwipeTabsActiveChange' });

  private track: {
    x: number;
    y: number;
    lock: 'x' | 'y' | null;
    dx: number;
    armed: boolean;
    width: number;
    panel: HTMLElement;
    prev: string | null;
    next: string | null;
    velocity: VelocityTracker;
  } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private moving: HTMLElement | null = null;
  /** The element that takes the touches: the page around the host. */
  private surface: HTMLElement = this.el;

  constructor() {
    const start = (e: TouchEvent): void => this.onStart(e);
    const move = (e: TouchEvent): void => this.onMove(e);
    const end = (): void => this.onEnd();
    const cancel = (): void => this.onCancel();
    // The surface is the page (`main`), so a swipe below a short panel takes too.
    afterNextRender(() => {
      this.surface = this.el.closest('main') ?? this.el;
      const surface = this.surface;
      this.zone.runOutsideAngular(() => {
        surface.addEventListener('touchstart', start, { passive: true });
        surface.addEventListener('touchmove', move, { passive: false });
        surface.addEventListener('touchend', end, { passive: true });
        surface.addEventListener('touchcancel', cancel, { passive: true });
      });
    });
    inject(DestroyRef).onDestroy(() => {
      const surface = this.surface;
      surface.removeEventListener('touchstart', start);
      surface.removeEventListener('touchmove', move);
      surface.removeEventListener('touchend', end);
      surface.removeEventListener('touchcancel', cancel);
      this.clearTimer();
    });
  }

  /** The enabled tab before and after the active one, or null at an end. */
  private neighbours(): { prev: string | null; next: string | null } {
    const tabs = this.tabs().filter((t) => !t.disabled);
    const at = tabs.findIndex((t) => t.id === this.active());
    if (at < 0) return { prev: null, next: null };
    return { prev: tabs[at - 1]?.id ?? null, next: tabs[at + 1]?.id ?? null };
  }

  /** The panel that shows now: the first panel in the host that is not hidden. */
  private visiblePanel(): HTMLElement | null {
    for (const p of Array.from(this.el.querySelectorAll<HTMLElement>('[role="tabpanel"]'))) {
      if (!p.closest('[hidden]')) return p;
    }
    return null;
  }

  /** The finger starts on something that takes a sideways move itself. */
  private keeps(target: EventTarget | null, stop: HTMLElement): boolean {
    let node = target instanceof Element ? target : null;
    if (node?.closest(KEEP)) return true;
    while (node && node !== stop) {
      if (node instanceof HTMLElement && node.scrollWidth > node.clientWidth + 1) {
        const overflow = getComputedStyle(node).overflowX;
        if (overflow === 'auto' || overflow === 'scroll') return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  private onStart(e: TouchEvent): void {
    if (this.off() || this.track || this.moving || e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX <= SWIPE_BACK_EDGE || !touchGesturesOn() || modalOpen(document, this.el)) return;
    const panel = this.visiblePanel();
    // A short panel leaves room below it: the swipe takes the whole host below the top of
    // the panel, not the head and the tab bar above it.
    if (!panel || !(e.target instanceof Node) || t.clientY < panel.getBoundingClientRect().top) return;
    // Inside the host only the panel area counts; outside it, the page below the host.
    if (!this.el.contains(e.target) && t.clientY < this.el.getBoundingClientRect().bottom) return;
    if (this.keeps(e.target, this.el.contains(e.target) ? this.el : this.surface)) return;
    const { prev, next } = this.neighbours();
    if (!prev && !next) return;
    const velocity = new VelocityTracker();
    velocity.add(t.clientX, e.timeStamp);
    this.track = {
      x: t.clientX,
      y: t.clientY,
      lock: null,
      dx: 0,
      armed: false,
      width: panel.clientWidth || window.innerWidth,
      panel,
      prev,
      next,
      velocity,
    };
  }

  private onMove(e: TouchEvent): void {
    const track = this.track;
    if (!track) return;
    if (e.touches.length !== 1) {
      this.onCancel();
      return;
    }
    const t = e.touches[0];
    const dx = t.clientX - track.x;
    const dy = t.clientY - track.y;
    if (track.lock === null) {
      if (Math.abs(dx) <= GESTURE_SLOP && Math.abs(dy) <= GESTURE_SLOP) return;
      track.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (track.lock === 'y') {
        this.track = null;
        return;
      }
      this.moving = track.panel;
    }
    if (e.cancelable) e.preventDefault();
    const target = dx < 0 ? track.next : track.prev;
    track.dx = target ? dx : dx * SWIPE_TABS_RESIST;
    track.velocity.add(t.clientX, e.timeStamp);
    this.place(track.panel, track.dx, 1, false);
    const armed = !!target && Math.abs(dx) >= track.width * SWIPE_TABS_DISTANCE;
    if (armed !== track.armed) {
      track.armed = armed;
      if (armed) haptic('tick');
    }
  }

  private onEnd(): void {
    const track = this.track;
    this.track = null;
    if (!track || track.lock !== 'x') return;
    const v = track.velocity.velocity();
    const target = track.dx < 0 ? track.next : track.prev;
    const far = Math.abs(track.dx) >= track.width * SWIPE_TABS_DISTANCE;
    const fast = Math.abs(v) > SWIPE_TABS_VELOCITY && Math.sign(v) === Math.sign(track.dx);
    if (target && (far || fast)) this.change(track.panel, target, track.dx < 0 ? -1 : 1, track.width);
    else this.springBack(track.panel);
  }

  private onCancel(): void {
    const track = this.track;
    this.track = null;
    if (track?.lock === 'x') this.springBack(track.panel);
  }

  /** Put the panel `dx` px to the side with the opacity `alpha`. */
  private place(panel: HTMLElement, dx: number, alpha: number, settle: boolean): void {
    const ms = settle ? this.settleMs() : 0;
    panel.style.position = 'relative';
    panel.style.transition = ms ? `left ${ms}ms var(--ease-standard), opacity ${ms}ms var(--ease-standard)` : 'none';
    panel.style.left = `${dx}px`;
    panel.style.opacity = String(alpha);
  }

  private settleMs(): number {
    return motionReduced() ? 0 : motionMs(this.el, '--motion-fast', 160);
  }

  /** Slide the panel out to `dir` (-1 left, 1 right), switch the tab, slide the new one in. */
  private change(panel: HTMLElement, tab: string, dir: -1 | 1, width: number): void {
    const ms = this.settleMs();
    this.place(panel, dir * width, 0, true);
    this.after(ms, () => {
      this.clear(panel);
      this.zone.run(() => this.activeChange.emit(tab));
      if (!ms) {
        this.moving = null;
        return;
      }
      // The page renders the new tab in this turn; its panel enters from the other side.
      requestAnimationFrame(() => {
        const next = this.visiblePanel() ?? panel;
        this.place(next, -dir * width * ENTER_OFFSET, 0, false);
        requestAnimationFrame(() => {
          this.place(next, 0, 1, true);
          this.after(ms, () => {
            this.clear(next);
            this.moving = null;
          });
        });
      });
    });
  }

  private springBack(panel: HTMLElement): void {
    const ms = this.settleMs();
    this.place(panel, 0, 1, true);
    this.after(ms, () => {
      this.clear(panel);
      this.moving = null;
    });
  }

  private clear(panel: HTMLElement): void {
    for (const p of ['position', 'transition', 'left', 'opacity']) panel.style.removeProperty(p);
  }

  private after(ms: number, run: () => void): void {
    this.clearTimer();
    if (ms <= 0) {
      run();
      return;
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      run();
    }, ms);
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
