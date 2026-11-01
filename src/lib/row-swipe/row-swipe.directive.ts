import {
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { IconName } from '../icon/icons';
import {
  GESTURE_SLOP,
  modalOpen,
  motionMs,
  motionReduced,
  opaqueBackground,
  touchGesturesOn,
} from '../gesture/gesture';
import { haptic } from '../util/haptic';

/** A release past this part of the row width carries out the action. */
export const ROW_SWIPE_DISTANCE = 0.4;
/** A row that slid out and is still in the page after this time comes back. */
const RESTORE_MS = 1200;

/** The action of one swipe direction of a row: an item of the row menu. */
export interface RowSwipeAction {
  /** The id of the row menu item, so the page carries it out as from the menu. */
  id: string;
  /** The label of the menu item; it shows on the plate. */
  label: string;
  icon: IconName;
  /**
   * The row leaves the list (archive, delete, mark as paid): it slides out and the list
   * closes the gap. Without it the row springs back (share, edit open a dialog).
   */
  leaves?: boolean;
}

/** The direction of a swipe: the finger moves to the right or to the left. */
export type RowSwipeSide = 'right' | 'left';

/**
 * Swipe a list row to the side to carry out an item of its row menu (full swipe, iOS
 * Mail style). The row menu stays the way without a gesture.
 *
 * The host holds the plates of the two directions and the foreground (`rowSwipeFg`), the
 * row that moves. After {@link GESTURE_SLOP} px the finger picks the axis: a mostly
 * horizontal move takes the swipe, a vertical one stays a scroll of the page. A direction
 * without an action does not move. Past {@link ROW_SWIPE_DISTANCE} of the row width the
 * plate is armed (`armed()`, one `haptic('tick')` per crossing). A release while armed
 * emits `rowSwiped`: a `leaves` action slides the row out and closes its height first, an
 * other one springs back. A release before the threshold springs back.
 *
 * With reduced motion the row fades out instead of the slide and the collapse. The swipe
 * works only on a phone with a touch-first pointer and while no modal layer is open. The
 * click that a browser may send after the release does not reach the row.
 */
@Directive({
  selector: '[appRowSwipe]',
  standalone: true,
  exportAs: 'appRowSwipe',
  host: {
    '[class.row-swipe--drag]': 'dir() !== null',
  },
})
export class RowSwipeDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  /** The action of a swipe to the right; its plate shows at the left. */
  readonly right = input<RowSwipeAction | null>(null, { alias: 'rowSwipeRight' });
  /** The action of a swipe to the left; its plate shows at the right. */
  readonly left = input<RowSwipeAction | null>(null, { alias: 'rowSwipeLeft' });
  /** The element that moves with the finger. */
  readonly fg = input<HTMLElement | null>(null, { alias: 'rowSwipeFg' });

  readonly swiped = output<RowSwipeAction>({ alias: 'rowSwiped' });

  /** The direction of the swipe of now, or null. */
  readonly dir = signal<RowSwipeSide | null>(null);
  /** The plate is armed: a release now carries out the action. */
  readonly armed = signal(false);
  /** The action of the swipe of now. */
  readonly action = computed(() => {
    const dir = this.dir();
    return dir === 'right' ? this.right() : dir === 'left' ? this.left() : null;
  });

  private track: { x: number; y: number; lock: 'x' | 'y' | null; dx: number } | null = null;
  private busy = false;
  private swallowClick = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    const start = (e: TouchEvent): void => this.onStart(e);
    const move = (e: TouchEvent): void => this.onMove(e);
    const end = (): void => this.onEnd();
    const cancel = (): void => this.onCancel();
    const click = (e: Event): void => {
      if (!this.swallowClick) return;
      this.swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };
    this.zone.runOutsideAngular(() => {
      this.el.addEventListener('touchstart', start, { passive: true });
      this.el.addEventListener('touchmove', move, { passive: false });
      this.el.addEventListener('touchend', end, { passive: true });
      this.el.addEventListener('touchcancel', cancel, { passive: true });
      this.el.addEventListener('click', click, true);
    });
    inject(DestroyRef).onDestroy(() => {
      this.el.removeEventListener('touchstart', start);
      this.el.removeEventListener('touchmove', move);
      this.el.removeEventListener('touchend', end);
      this.el.removeEventListener('touchcancel', cancel);
      this.el.removeEventListener('click', click, true);
      this.timers.forEach(clearTimeout);
    });
  }

  private onStart(e: TouchEvent): void {
    if (this.busy || e.touches.length !== 1) return;
    if (!this.right() && !this.left()) return;
    if (!touchGesturesOn() || modalOpen(document, this.el)) return;
    const t = e.touches[0];
    this.track = { x: t.clientX, y: t.clientY, lock: null, dx: 0 };
  }

  private onMove(e: TouchEvent): void {
    const track = this.track;
    if (!track) return;
    const t = e.touches[0];
    if (!t || e.touches.length !== 1) {
      this.onCancel();
      return;
    }
    const dx = t.clientX - track.x;
    const dy = t.clientY - track.y;
    if (track.lock === null) {
      if (Math.abs(dx) <= GESTURE_SLOP && Math.abs(dy) <= GESTURE_SLOP) {
        if (Math.abs(dx) > Math.abs(dy) && e.cancelable) e.preventDefault();
        return;
      }
      track.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (track.lock === 'y') {
        this.track = null;
        return;
      }
      const fg = this.fg();
      if (fg) fg.style.backgroundColor = opaqueBackground(fg);
    }
    if (e.cancelable) e.preventDefault();
    const side: RowSwipeSide = dx >= 0 ? 'right' : 'left';
    // A direction without an action stays still.
    track.dx = (side === 'right' ? this.right() : this.left()) ? dx : 0;
    const dir = track.dx === 0 ? null : side;
    const armed = Math.abs(track.dx) >= this.el.clientWidth * ROW_SWIPE_DISTANCE;
    // Change detection runs only when the plate changes, not on every move.
    if (dir !== this.dir() || armed !== this.armed()) {
      if (armed && !this.armed()) haptic('tick');
      this.zone.run(() => {
        this.dir.set(dir);
        this.armed.set(armed);
      });
    }
    this.move(track.dx, false);
  }

  private onEnd(): void {
    const track = this.track;
    this.track = null;
    if (!track || track.lock !== 'x') return;
    this.swallowClick = true;
    this.later(() => (this.swallowClick = false), 400);
    const action = this.armed() ? this.action() : null;
    if (!action) {
      this.settle();
      return;
    }
    if (!action.leaves) {
      this.settle();
      this.zone.run(() => this.swiped.emit(action));
      return;
    }
    this.leave(action, track.dx > 0 ? 1 : -1);
  }

  /** A cancel or a second finger: back without the action. */
  private onCancel(): void {
    const track = this.track;
    this.track = null;
    if (track?.lock === 'x') this.settle();
  }

  private move(dx: number, animate: boolean, opacity?: number): void {
    const fg = this.fg();
    if (!fg) return;
    fg.style.transition = animate
      ? `transform ${this.ms()}ms var(--ease-enter), opacity ${this.ms()}ms var(--ease-standard)`
      : 'none';
    fg.style.transform = dx === 0 ? '' : `translateX(${dx}px)`;
    if (opacity !== undefined) fg.style.opacity = String(opacity);
  }

  private ms(): number {
    return motionReduced() ? 0 : motionMs(this.el, '--motion-slow', 280);
  }

  /** Spring back, then clear the inline styles. */
  private settle(): void {
    this.busy = true;
    this.move(0, true);
    this.later(() => this.reset(), this.ms());
  }

  /** Slide out (fade with reduced motion), close the height, then tell the page. */
  private leave(action: RowSwipeAction, sign: 1 | -1): void {
    this.busy = true;
    const reduced = motionReduced();
    const fg = this.fg();
    if (reduced) {
      if (fg) {
        fg.style.transition = `opacity ${motionMs(this.el, '--motion-base', 200)}ms linear`;
        fg.style.opacity = '0';
      }
    } else {
      this.move(sign * this.el.clientWidth, true);
    }
    const out = reduced ? motionMs(this.el, '--motion-base', 200) : this.ms();
    this.later(() => {
      const collapse = reduced ? 0 : motionMs(this.el, '--motion-base', 200);
      const host = this.el;
      host.style.height = `${host.offsetHeight}px`;
      host.style.overflow = 'hidden';
      // Read the height once, so the browser runs the transition from it.
      void host.offsetHeight;
      host.style.transition = collapse ? `height ${collapse}ms var(--ease-standard)` : 'none';
      host.style.height = '0px';
      this.later(() => {
        this.zone.run(() => this.swiped.emit(action));
        // The page normally takes the row out now. A row that stays comes back.
        this.later(() => {
          if (this.el.isConnected) this.reset();
        }, RESTORE_MS);
      }, collapse);
    }, out);
  }

  private reset(): void {
    this.busy = false;
    const fg = this.fg();
    if (fg) {
      for (const p of ['transition', 'transform', 'opacity', 'background-color']) fg.style.removeProperty(p);
    }
    for (const p of ['height', 'overflow', 'transition']) this.el.style.removeProperty(p);
    this.zone.run(() => {
      this.dir.set(null);
      this.armed.set(false);
    });
  }

  private later(run: () => void, ms: number): void {
    if (ms <= 0) {
      run();
      return;
    }
    const id = setTimeout(() => {
      this.timers = this.timers.filter((t) => t !== id);
      run();
    }, ms);
    this.timers.push(id);
  }
}
