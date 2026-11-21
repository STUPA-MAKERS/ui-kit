import {
  DOCUMENT,
  EnvironmentProviders,
  Injector,
  NgZone,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { RippleRenderer, RippleState, type RippleConfig, type RippleRef, type RippleTarget } from '@angular/material/core';

/** How long the tint fades out after a release (`--motion-base`), with a margin. */
export const PRESS_FADE_MS = 240;

/**
 * How far a pointer may move before the press counts as a drag (a scroll, a pull to refresh,
 * a swipe), in CSS pixels. The ripple then fades, as on a native list (app spec 002164). A
 * page that handles the drag itself (a pull to refresh) gets no `pointercancel`.
 */
export const PRESS_SLOP_PX = 8;

/** The enter and exit time of the ripple, in ms (Material's own values). */
const ANIMATION = { enterDuration: 225, exitDuration: 150 } as const;

/** The keys that press a focused control. */
const PRESS_KEYS = new Set(['Enter', ' ']);

/** A field takes Enter and Space as text, so a key there presses nothing. */
const TEXT_FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

/** The marked part of a host that shows its ripple, for example the pill of a bar entry. */
const SURFACE = '[data-press-surface]';

/** The attribute on a host whose ripple MatRipple draws; `--press-paint` turns its CSS ripple off. */
export const PRESS_INK_ATTR = 'data-press-ink';

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
 * Write the point of the press and the radius of the ripple to the painters of `host`, for
 * the CSS ripple of a table row (`_press.scss`). The radius is the distance from the point
 * to the farthest corner of the host. A point of null is the centre (a press with a key).
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

/**
 * End a ripple at a release. A ripple that still grows fades when it has grown, so a short
 * tap shows the whole circle; Material does that for a ripple that is not persistent. Every
 * ripple starts persistent, because the renderer does not see the pointer here and would end
 * a held press after its growth.
 */
function release(ref: RippleRef): void {
  if (ref.state === RippleState.FADING_IN) ref.config = { ...ref.config, persistent: false };
  else ref.fadeOut();
}

/** What a {@link RippleRenderer} needs from Angular. */
export interface PressRippleDeps {
  readonly zone: NgZone;
  readonly platform: Platform;
  readonly injector: Injector;
}

/** The ripple of one host: the renderer of Angular Material and the box it draws in. */
interface Ink {
  readonly renderer: RippleRenderer;
  readonly target: RippleTarget;
}

/**
 * The target of a renderer: its config is read at each press, so a change of the theme or
 * of the disabled state counts.
 */
class InkTarget implements RippleTarget {
  rippleConfig: RippleConfig = {};
  constructor(private readonly host: HTMLElement) {}
  get rippleDisabled(): boolean {
    const host = this.host;
    return (host as HTMLButtonElement).disabled === true || host.getAttribute('aria-disabled') === 'true';
  }
}

/**
 * The box that the ripple of `host` draws in, inside its surface (the `[data-press-surface]`
 * part, or the host): an absolute child that fills the surface, with its corners
 * (`--press-radius` when the host sets one, for example the pill of a tab) and clipped, so
 * the ripple moves, scrolls and goes with the surface (app spec 002164).
 */
function inkBox(host: HTMLElement): HTMLElement {
  const surface = host.querySelector<HTMLElement>(SURFACE) ?? host;
  const doc = host.ownerDocument;
  const view = doc.defaultView;
  const position = view?.getComputedStyle(surface).position;
  if (!position || position === 'static') surface.style.setProperty('position', 'relative');
  const box = doc.createElement('span');
  box.classList.add('press-ink');
  box.setAttribute('aria-hidden', 'true');
  const radius = view?.getComputedStyle(host).getPropertyValue('--press-radius').trim();
  if (radius) box.style.setProperty('border-radius', radius);
  surface.appendChild(box);
  return box;
}

/**
 * The listeners of `installPressRipple`: on a pointer press, the ripple of Angular Material
 * (`RippleRenderer`) in a box inside the pressed surface; the press with Enter or Space from
 * the centre; a drag past {@link PRESS_SLOP_PX} that ends the ripple. A table row keeps the
 * CSS ripple of `_press.scss`, because a row cannot hold a box.
 */
class PressRipple {
  private readonly inks = new WeakMap<HTMLElement, Ink>();
  private fades: readonly { readonly host: HTMLElement; readonly timer: ReturnType<typeof setTimeout> }[] = [];
  private pointer: { readonly host: HTMLElement; readonly ref: RippleRef | null; readonly at: PressPoint } | null =
    null;
  private key: { readonly host: HTMLElement; readonly ref: RippleRef | null } | null = null;

  constructor(private readonly deps: PressRippleDeps | null) {}

  readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const host = pressHost(event.target as Element | null);
    if (!host) return;
    this.endPointer();
    this.stopFade(host);
    const at = { x: event.clientX, y: event.clientY };
    const ref = this.launch(host, at);
    if (!ref) placeRipple(host, at);
    this.pointer = { host, ref, at };
  };

  readonly onPointerUp = (): void => this.endPress(false);

  /** The browser takes the touch for a scroll: the ripple fades at once. */
  readonly onPointerCancel = (): void => this.endPress(true);

  /** A pointer that moves past {@link PRESS_SLOP_PX} drags: the ripple ends. */
  readonly onPointerMove = (event: PointerEvent): void => {
    const press = this.pointer;
    if (!press) return;
    if (Math.hypot(event.clientX - press.at.x, event.clientY - press.at.y) <= PRESS_SLOP_PX) return;
    this.endPress(true);
  };

  readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || !PRESS_KEYS.has(event.key) || this.key) return;
    const target = event.target as Element | null;
    if (!target || target.closest(TEXT_FIELD)) return;
    const host = pressHost(target);
    if (!host) return;
    this.stopFade(host);
    const ref = this.launch(host, null);
    if (!ref) {
      placeRipple(host, null);
      host.setAttribute('data-press-key', '');
    }
    this.key = { host, ref };
  };

  /** A key that goes up, or a focus that leaves while the key is down, ends the press. */
  readonly onKeyUp = (event: Event): void => {
    const press = this.key;
    if (!press || (event instanceof KeyboardEvent && !PRESS_KEYS.has(event.key))) return;
    this.key = null;
    if (press.ref) {
      release(press.ref);
      return;
    }
    press.host.removeAttribute('data-press-key');
    this.fadeOut(press.host);
  };

  /** Stop every pending fade and every ripple. */
  dispose(): void {
    this.fades.forEach((fade) => clearTimeout(fade.timer));
    this.fades = [];
    this.endPointer();
  }

  /**
   * Start the ripple of Angular Material on `host`, from `point` or from the centre. Null
   * where it cannot draw: without Angular (a test), or on a table row.
   */
  private launch(host: HTMLElement, point: PressPoint | null): RippleRef | null {
    const ink = this.ink(host);
    if (!ink || ink.target.rippleDisabled) return null;
    const view = host.ownerDocument.defaultView;
    const color = view?.getComputedStyle(host).getPropertyValue('--press-tint').trim();
    ink.target.rippleConfig = { color: color || undefined, animation: ANIMATION };
    const box = host.getBoundingClientRect();
    const x = point ? point.x : box.left + box.width / 2;
    const y = point ? point.y : box.top + box.height / 2;
    return ink.renderer.fadeInRipple(x, y, {
      ...ink.target.rippleConfig,
      centered: !point || !!host.querySelector(SURFACE),
      persistent: true,
    });
  }

  private ink(host: HTMLElement): Ink | null {
    const known = this.inks.get(host);
    if (known) return known;
    const deps = this.deps;
    if (!deps || host instanceof HTMLTableRowElement) return null;
    const target = new InkTarget(host);
    const renderer = new RippleRenderer(target, deps.zone, inkBox(host), deps.platform, deps.injector);
    host.setAttribute(PRESS_INK_ATTR, '');
    host.style.setProperty('--press-paint', 'transparent');
    const ink = { renderer, target };
    this.inks.set(host, ink);
    return ink;
  }

  private endPress(drag: boolean): void {
    const press = this.pointer;
    this.pointer = null;
    if (!press) return;
    if (!press.ref) this.fadeOut(press.host);
    else if (drag) press.ref.fadeOut();
    else release(press.ref);
  }

  private endPointer(): void {
    this.pointer?.ref?.fadeOut();
    this.pointer = null;
  }

  /** The CSS ripple of a table row fades out (`data-press-out`). */
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
 * The ripple of a press for the whole app (app specs 001314, 002164): the ripple of Angular
 * Material in the pressed surface, started by one listener on the document, so no element
 * needs a directive. Returns the function that removes the listeners. Without `deps` (a
 * test without Angular) every host gets the CSS ripple of `_press.scss`.
 */
export function installPressRipple(doc: Document, deps: PressRippleDeps | null = null): () => void {
  const ripple = new PressRipple(deps);
  const options = { capture: true, passive: true } as const;
  const listeners = [
    ['pointerdown', ripple.onPointerDown],
    ['pointerup', ripple.onPointerUp],
    ['pointercancel', ripple.onPointerCancel],
    ['pointermove', ripple.onPointerMove],
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
 * without it a press still ripples by CSS, from the centre.
 */
export function providePressRipple(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const doc = inject(DOCUMENT);
    if (!doc.defaultView) return;
    installPressRipple(doc, { zone: inject(NgZone), platform: inject(Platform), injector: inject(Injector) });
  });
}
