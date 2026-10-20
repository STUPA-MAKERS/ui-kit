import { MEDIA } from '../breakpoints/breakpoints';
import { matchesMedia } from '../signals/media-query';

/**
 * The shared rules of the touch gestures of the kit (swipe back, row swipe) and of an app
 * (pull to refresh).
 *
 * The gestures listen to touch events, not to pointer events. A touch that moves on an
 * element with `touch-action: auto` starts a native pan, and the browser then sends
 * `pointercancel`; only a `touchmove` listener that is not passive can call
 * `preventDefault()` and keep the move. A gesture calls it only for the move it takes
 * over, never for a vertical scroll.
 */

/** A finger that moves this many pixels picks the axis of the gesture. */
export const GESTURE_SLOP = 8;

/**
 * The gestures run only on a phone with a touch-first pointer. A narrow window on a
 * desktop, or a touch laptop with a mouse, keeps the buttons and menus alone.
 */
export function touchGesturesOn(): boolean {
  return matchesMedia(MEDIA.phone) && matchesMedia(MEDIA.coarse);
}

/** The person asks the system for less motion. */
export function motionReduced(): boolean {
  return matchesMedia(MEDIA.reducedMotion);
}

/**
 * A dialog, a side sheet or another modal layer is open. A gesture of the page under it
 * must not start, because the finger acts on the layer on top.
 */
export function modalOpen(doc: Document = document): boolean {
  return doc.querySelector('[aria-modal="true"], dialog[open]') !== null;
}

/**
 * The duration of a motion token (`--motion-slow`) on an element, in ms. A token that the
 * page does not define gives `fallback`.
 */
export function motionMs(el: Element, token: string, fallback: number): number {
  const raw = getComputedStyle(el).getPropertyValue(token).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : value;
}

/** The first background colour that is not transparent, from `el` up to the root. */
export function opaqueBackground(el: Element | null): string {
  for (let node = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(bg)) return bg;
  }
  return 'var(--color-bg)';
}

/** A gesture marked the navigation that starts now. */
let gestureNavAt = -Infinity;
/** A marked navigation counts this long. */
const GESTURE_NAV_MS = 1000;

/**
 * A gesture already moved the page out (the swipe back), so the navigation that it starts
 * must not run the route transition of the app a second time. The gesture calls this
 * just before it emits; the router hook of the app asks with
 * {@link takeGestureNavigation}.
 */
export function markGestureNavigation(now = Date.now()): void {
  gestureNavAt = now;
}

/** True once for a navigation that a gesture started in the last second. */
export function takeGestureNavigation(now = Date.now()): boolean {
  const marked = now - gestureNavAt <= GESTURE_NAV_MS;
  gestureNavAt = -Infinity;
  return marked;
}

/** One sample of a moving finger. */
interface Sample {
  x: number;
  t: number;
}

/**
 * The speed of a finger along one axis over the last 100 ms, in px/ms. A gesture keeps
 * the recent samples, so the speed at the release counts, not the mean of the whole move.
 */
export class VelocityTracker {
  private samples: Sample[] = [];

  add(x: number, t: number): void {
    this.samples.push({ x, t });
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift();
  }

  velocity(): number {
    const first = this.samples[0];
    const last = this.samples.at(-1);
    if (!first || !last || last.t <= first.t) return 0;
    return (last.x - first.x) / (last.t - first.t);
  }
}
