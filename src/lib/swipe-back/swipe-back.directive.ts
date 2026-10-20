import { DestroyRef, Directive, ElementRef, NgZone, effect, inject, input, output, untracked } from '@angular/core';
import {
  GESTURE_SLOP,
  VelocityTracker,
  markGestureNavigation,
  modalOpen,
  motionMs,
  motionReduced,
  touchGesturesOn,
} from '../gesture/gesture';
import { haptic } from '../util/haptic';

/** A swipe back starts only this close to the left edge of the screen, in px. */
export const SWIPE_BACK_EDGE = 24;
/** A release past this part of the screen width goes back. */
export const SWIPE_BACK_DISTANCE = 0.35;
/** A release faster than this goes back too, in px/ms. */
export const SWIPE_BACK_VELOCITY = 0.6;
/** The layer under the page starts this part of the width to the left. */
export const SWIPE_BACK_PARALLAX = 0.25;
/** After the slide out, the page must close within this time, else it comes back. */
const CLOSE_WAIT_MS = 1000;

type Phase = 'idle' | 'drag' | 'settle' | 'gone';

/**
 * Swipe back from the left edge of a phone, as on iOS: the host (a detail page) follows
 * the finger to the right, and `appSwipeBackUnder` (the list) comes out under it.
 *
 * The swipe starts only within {@link SWIPE_BACK_EDGE} px of the left screen edge, so it
 * does not compete with a table, a tab row or a text selection that moves sideways, and
 * nothing marks the edge. After {@link GESTURE_SLOP} px the finger picks the axis: only a
 * move that is mostly to the right takes the swipe, every other move stays a scroll of
 * the page. A release past {@link SWIPE_BACK_DISTANCE} of the width, or faster than
 * {@link SWIPE_BACK_VELOCITY}, slides the host out and emits `appSwipeBack`; the page
 * then does what its back button does. A shorter release springs back. The threshold
 * gives one `haptic('tick')` each time the finger passes it outwards.
 *
 * The host moves with `left`, not with a transform: a transform makes the host the
 * containing block of its fixed children (a floating button, the ballot bar), and they
 * would jump while the host moves. The under layer starts at -{@link SWIPE_BACK_PARALLAX}
 * of the width and gets the custom property `--swipe-back-scrim` (1 at the start, 0 at the
 * end) and `--swipe-back-duration` (the time of a settle, 0ms while the finger moves),
 * so its scrim can follow. With reduced motion the under layer does not move and the
 * release settles at once.
 *
 * The directive works only on a phone with a touch-first pointer (`touchGesturesOn`),
 * while `appSwipeBackOff` is false and while no modal layer is open. `appSwipeBackStart`
 * fires when the swipe takes the move (the page shows the under layer), and
 * `appSwipeBackEnd` when the host is back in place, or after a back when `appSwipeBackOff`
 * turns true (the page closed the detail). A back that the page does not carry out
 * within a second springs back.
 */
@Directive({
  selector: '[appSwipeBack]',
  standalone: true,
})
export class SwipeBackDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);

  readonly off = input(false, { alias: 'appSwipeBackOff' });
  readonly under = input<HTMLElement | null>(null, { alias: 'appSwipeBackUnder' });

  readonly back = output<void>({ alias: 'appSwipeBack' });
  readonly started = output<void>({ alias: 'appSwipeBackStart' });
  readonly ended = output<void>({ alias: 'appSwipeBackEnd' });

  private phase: Phase = 'idle';
  private track: {
    x: number;
    y: number;
    lock: 'x' | 'y' | null;
    dx: number;
    armed: boolean;
    width: number;
    reduced: boolean;
    velocity: VelocityTracker;
  } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The settings of the swipe of now, kept for the settle after the release. */
  private width = 0;
  private reduced = false;

  constructor() {
    const start = (e: TouchEvent): void => this.onStart(e);
    const move = (e: TouchEvent): void => this.onMove(e);
    const end = (): void => this.onEnd();
    const cancel = (): void => this.onCancel();
    this.zone.runOutsideAngular(() => {
      this.el.addEventListener('touchstart', start, { passive: true });
      this.el.addEventListener('touchmove', move, { passive: false });
      this.el.addEventListener('touchend', end, { passive: true });
      this.el.addEventListener('touchcancel', cancel, { passive: true });
    });

    // The page closed the detail after a back: the host is hidden now, so it can go
    // back to its place without a motion.
    effect(() => {
      const off = this.off();
      untracked(() => {
        if (off && this.phase === 'gone') this.finish();
        else if (off && this.phase === 'drag') this.onCancel();
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.el.removeEventListener('touchstart', start);
      this.el.removeEventListener('touchmove', move);
      this.el.removeEventListener('touchend', end);
      this.el.removeEventListener('touchcancel', cancel);
      this.clearTimer();
    });
  }

  private onStart(e: TouchEvent): void {
    if (this.off() || this.phase !== 'idle' || e.touches.length !== 1) return;
    const t = e.touches[0];
    if (t.clientX > SWIPE_BACK_EDGE || !touchGesturesOn() || modalOpen()) return;
    const velocity = new VelocityTracker();
    velocity.add(t.clientX, e.timeStamp);
    this.track = {
      x: t.clientX,
      y: t.clientY,
      lock: null,
      dx: 0,
      armed: false,
      width: window.innerWidth || this.el.clientWidth,
      reduced: motionReduced(),
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
      if (Math.abs(dx) <= GESTURE_SLOP && Math.abs(dy) <= GESTURE_SLOP) {
        // Undecided: a move to the right must not start a native pan before the lock.
        if (dx > 0 && dx >= Math.abs(dy) && e.cancelable) e.preventDefault();
        return;
      }
      track.lock = dx > 0 && Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (track.lock === 'y') {
        // A scroll: the page keeps the move.
        this.track = null;
        return;
      }
      this.width = track.width;
      this.reduced = track.reduced;
      this.phase = 'drag';
      this.zone.run(() => this.started.emit());
    }
    if (e.cancelable) e.preventDefault();
    track.dx = Math.max(0, dx);
    track.velocity.add(t.clientX, e.timeStamp);
    this.place(track.dx, false);
    const armed = track.dx >= track.width * SWIPE_BACK_DISTANCE;
    if (armed !== track.armed) {
      track.armed = armed;
      if (armed) haptic('tick');
    }
  }

  private onEnd(): void {
    const track = this.track;
    this.track = null;
    if (!track || track.lock !== 'x') return;
    const fast = track.velocity.velocity() > SWIPE_BACK_VELOCITY;
    if (track.dx >= track.width * SWIPE_BACK_DISTANCE || fast) this.slideOut();
    else this.springBack();
  }

  private onCancel(): void {
    const track = this.track;
    this.track = null;
    if (track?.lock === 'x' || this.phase === 'drag') this.springBack();
  }

  /** Put the host `dx` px to the right, and the under layer and its scrim to match. */
  private place(dx: number, settle: boolean): void {
    const width = this.width;
    const p = width > 0 ? Math.min(1, Math.max(0, dx / width)) : 0;
    const duration = settle && !this.reduced ? `${this.settleMs()}ms` : '0ms';
    const transition = duration === '0ms' ? 'none' : `left ${duration} var(--ease-enter)`;
    this.el.style.transition = transition;
    this.el.style.left = `${dx}px`;
    const under = this.under();
    if (under) {
      const shift = this.reduced ? 0 : (p - 1) * SWIPE_BACK_PARALLAX * width;
      under.style.transition = transition;
      under.style.left = `${shift}px`;
      under.style.setProperty('--swipe-back-scrim', String(1 - p));
      under.style.setProperty('--swipe-back-duration', duration);
    }
  }

  private settleMs(): number {
    return motionMs(this.el, '--motion-slow', 280);
  }

  /** The host leaves to the right; then the page goes back. */
  private slideOut(): void {
    this.phase = 'settle';
    this.place(this.width, true);
    this.after(this.reduced ? 0 : this.settleMs(), () => {
      this.phase = 'gone';
      markGestureNavigation();
      this.zone.run(() => this.back.emit());
      // A page that stays (a guard kept the detail) gets its detail back.
      if (this.phase === 'gone') this.after(CLOSE_WAIT_MS, () => this.springBack());
    });
  }

  private springBack(): void {
    this.phase = 'settle';
    this.place(0, true);
    this.after(this.reduced ? 0 : this.settleMs(), () => this.finish());
  }

  /** Back in place: clear every inline style and tell the page. */
  private finish(): void {
    this.clearTimer();
    this.phase = 'idle';
    this.el.style.removeProperty('transition');
    this.el.style.removeProperty('left');
    const under = this.under();
    if (under) {
      for (const p of ['transition', 'left', '--swipe-back-scrim', '--swipe-back-duration']) {
        under.style.removeProperty(p);
      }
    }
    this.zone.run(() => this.ended.emit());
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
