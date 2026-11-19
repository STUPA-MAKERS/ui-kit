import { DOCUMENT, EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

/** How long the tint fades out after a release (`--motion-base`), with a margin. */
export const PRESS_FADE_MS = 240;

/** The keys that press a focused control. */
const PRESS_KEYS = new Set(['Enter', ' ']);

/** A field takes Enter and Space as text, so a key there presses nothing. */
const TEXT_FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/**
 * The element that paints the ripple for a press on `start`: the nearest element, from
 * `start` up, whose styles set `--press-host: 1` (`_press.scss`). Null when nothing above
 * `start` ripples.
 */
export function pressHost(start: Element | null): HTMLElement | null {
  if (!start || start.tagName === 'BODY' || start.tagName === 'HTML') return null;
  const view = start.ownerDocument.defaultView;
  const marked =
    start instanceof HTMLElement && view?.getComputedStyle(start).getPropertyValue('--press-host').trim() === '1';
  return marked ? start : pressHost(start.parentElement);
}

/** The cells that paint a table row: each one paints its part of the ripple of the row. */
function painters(host: HTMLElement): readonly HTMLElement[] {
  return host instanceof HTMLTableRowElement ? [host, ...Array.from(host.cells)] : [host];
}

/** A point on the screen, in client pixels. */
export interface PressPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Write the point of the press and the radius of the ripple to the painters of `host`. The
 * radius is the distance from the point to the farthest corner of the host, so the circle
 * covers the host when it ends. A point of null is the centre (a press with a key).
 */
export function placeRipple(host: HTMLElement, point: PressPoint | null): void {
  const box = host.getBoundingClientRect();
  const x = point ? point.x : box.left + box.width / 2;
  const y = point ? point.y : box.top + box.height / 2;
  const r = Math.hypot(Math.max(x - box.left, box.right - x), Math.max(y - box.top, box.bottom - y));
  painters(host).forEach((el) => {
    const own = el.getBoundingClientRect();
    el.style.setProperty('--ripple-x', `${x - own.left}px`);
    el.style.setProperty('--ripple-y', `${y - own.top}px`);
    el.style.setProperty('--ripple-r', `${Math.ceil(r)}px`);
  });
}

/** A host whose tint fades out, and the timer that ends the fade. */
interface Fade {
  readonly host: HTMLElement;
  readonly timer: ReturnType<typeof setTimeout>;
}

/**
 * The listeners of `installPressRipple`: the point of a pointer press, the press with Enter
 * or Space, and the fade after the release.
 */
class PressRipple {
  private fades: readonly Fade[] = [];
  private pointerHost: HTMLElement | null = null;
  private keyHost: HTMLElement | null = null;

  readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const host = pressHost(event.target as Element | null);
    if (!host) return;
    this.stopFade(host);
    placeRipple(host, { x: event.clientX, y: event.clientY });
    this.pointerHost = host;
  };

  readonly onPointerUp = (): void => {
    if (this.pointerHost) this.fadeOut(this.pointerHost);
    this.pointerHost = null;
  };

  readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || !PRESS_KEYS.has(event.key) || this.keyHost) return;
    const target = event.target as Element | null;
    if (!target || target.closest(TEXT_FIELD)) return;
    const host = pressHost(target);
    if (!host) return;
    this.stopFade(host);
    placeRipple(host, null);
    host.setAttribute('data-press-key', '');
    this.keyHost = host;
  };

  /** A key that goes up, or a focus that leaves while the key is down, ends the press. */
  readonly onKeyUp = (event: Event): void => {
    const host = this.keyHost;
    if (!host || (event instanceof KeyboardEvent && !PRESS_KEYS.has(event.key))) return;
    this.keyHost = null;
    host.removeAttribute('data-press-key');
    this.fadeOut(host);
  };

  /** Stop every pending fade. */
  dispose(): void {
    this.fades.forEach((fade) => clearTimeout(fade.timer));
    this.fades = [];
  }

  private fadeOut(host: HTMLElement): void {
    this.stopFade(host);
    // A new attribute starts the fade again, also when the last fade still runs.
    void host.offsetWidth;
    host.setAttribute('data-press-out', '');
    const timer = setTimeout(() => this.stopFade(host), PRESS_FADE_MS);
    this.fades = [...this.fades, { host, timer }];
  }

  private stopFade(host: HTMLElement): void {
    this.fades.filter((fade) => fade.host === host).forEach((fade) => clearTimeout(fade.timer));
    this.fades = this.fades.filter((fade) => fade.host !== host);
    host.removeAttribute('data-press-out');
  }
}

/**
 * The parts of the ripple of a press that CSS cannot do (app spec 001314, `_press.scss`):
 * the point of a pointer press, the press with Enter or Space, and the fade after the
 * release. Returns the function that removes the listeners.
 */
export function installPressRipple(doc: Document): () => void {
  const ripple = new PressRipple();
  const options = { capture: true, passive: true } as const;
  const listeners = [
    ['pointerdown', ripple.onPointerDown],
    ['pointerup', ripple.onPointerUp],
    ['pointercancel', ripple.onPointerUp],
    ['keydown', ripple.onKeyDown],
    ['keyup', ripple.onKeyUp],
    ['focusout', ripple.onKeyUp],
  ] as const;
  listeners.forEach(([type, listener]) => doc.addEventListener(type, listener as EventListener, options));
  return () => {
    listeners.forEach(([type, listener]) => doc.removeEventListener(type, listener as EventListener, options));
    ripple.dispose();
  };
}

/**
 * Start the ripple of a press for the whole app. Add it once to the providers of the app;
 * without it a press still ripples, from the centre, and ends without the fade.
 */
export function providePressRipple(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const doc = inject(DOCUMENT);
    if (doc.defaultView) installPressRipple(doc);
  });
}
