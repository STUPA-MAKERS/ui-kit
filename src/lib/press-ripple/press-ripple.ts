import { DOCUMENT, EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

/** How long the tint fades out after a release (`--motion-base`), with a margin. */
export const PRESS_FADE_MS = 240;

/**
 * How long the ripple of a layer shows at least before it fades (app spec 002164). A tap
 * on a phone lasts 50 to 100 ms; without the hold the circle faded before it had grown.
 */
export const PRESS_HOLD_MS = 225;

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

/** The attribute on a host while its ripple is a layer (`showLayer`). */
export const PRESS_LAYER_ATTR = 'data-press-layer';

/** The marked part of a host that shows its ripple, for example the pill of a bar entry. */
const SURFACE = '[data-press-surface]';

/** A ripple on its own layer, with the host that it paints for. */
interface Layer {
  readonly host: HTMLElement;
  readonly el: HTMLElement;
  /** The time of the press (`performance.now()`), for {@link PRESS_HOLD_MS}. */
  readonly at: number;
}

/**
 * Show the ripple of a press on `host` as a layer of its own above the page: a box with
 * the place, the corners and the tint of the host (or of its `[data-press-surface]`
 * part), with a circle in it that grows by `transform` from the point of the press (app
 * spec 002164). Only `transform` and `opacity` move, so the browser runs the ripple on the
 * compositor, and it keeps moving while a tap renders a new page. The host gets
 * `data-press-layer`, which turns its CSS ripple off (`base.scss`).
 *
 * The layer is not a child of the host, so no selector of the host (`:only-child`,
 * `:has(…)`) sees it. Null in the top layer (an open popover or dialog), where a layer of
 * the page would lie under it: there the CSS ripple of the host shows.
 */
export function showLayer(host: HTMLElement, point: PressPoint | null): Layer | null {
  const doc = host.ownerDocument;
  const view = doc.defaultView;
  // A host in a popover shows only while the popover is open, so a popover counts as open.
  if (!view || host.closest('[popover], dialog[open]')) return null;
  const surface = host.querySelector<HTMLElement>(SURFACE) ?? host;
  const box = surface.getBoundingClientRect();
  if (!box.width || !box.height) return null;
  const style = view.getComputedStyle(surface);
  // A host can ask for another shape of its ripple (`--press-radius`), for example a tab
  // whose box is square because of the line under it: its ripple is a pill.
  const radius = style.getPropertyValue('--press-radius').trim() || style.borderRadius;
  // A marked part ripples from its centre, as the CSS ripple of the bar entries did.
  const from = surface === host ? point : null;
  const x = (from ? from.x : box.left + box.width / 2) - box.left;
  const y = (from ? from.y : box.top + box.height / 2) - box.top;
  const r = Math.ceil(Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)));
  const el = doc.createElement('div');
  el.className = 'press-layer';
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute(
    'style',
    `left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;` +
      `border-radius:${radius};color:${style.color}`,
  );
  const tint = view.getComputedStyle(host).getPropertyValue('--press-tint').trim();
  if (tint) el.style.setProperty('--press-tint', tint);
  const wave = doc.createElement('div');
  wave.className = 'press-layer__wave';
  wave.setAttribute('style', `left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px`);
  el.appendChild(wave);
  doc.body.appendChild(el);
  host.setAttribute(PRESS_LAYER_ATTR, '');
  return { host, el, at: view.performance.now() };
}

/** The class that stops a layer at its full circle (see {@link settlePressLayers}). */
const SETTLED = 'press-layer--settled';

/**
 * Stop every ripple layer of `doc` at its full circle and full tint. Call it when a view
 * transition starts: the browser shows a still picture of the page until the new page has
 * rendered, so a ripple in the middle of its growth would stand still there (app spec
 * 002164). A full tint reads as the pressed row that the new page replaces. The layer
 * goes when its host leaves the page.
 */
export function settlePressLayers(doc: Document): void {
  doc.querySelectorAll('.press-layer').forEach((el) => el.classList.add(SETTLED));
}

/**
 * Fade a layer out (`press-layer--out`) and remove it after the fade. A release keeps the
 * ripple until {@link PRESS_HOLD_MS} after the press (the fade waits by
 * `--press-hold`); a cancel (the touch became a scroll) fades at once.
 */
function hideLayer(layer: Layer, hold: boolean): ReturnType<typeof setTimeout> {
  const now = layer.el.ownerDocument.defaultView?.performance.now() ?? layer.at;
  const wait = hold ? Math.max(0, Math.round(PRESS_HOLD_MS - (now - layer.at))) : 0;
  layer.el.style.setProperty('--press-hold', `${wait}ms`);
  layer.el.classList.add('press-layer--out');
  return setTimeout(() => dropLayer(layer), wait + PRESS_FADE_MS);
}

function dropLayer(layer: Layer): void {
  layer.el.remove();
  layer.host.removeAttribute(PRESS_LAYER_ATTR);
}

/** A host whose tint fades out, and the timer that ends the fade. */
interface Fade {
  readonly host: HTMLElement;
  readonly timer: ReturnType<typeof setTimeout>;
  readonly layer?: Layer;
}

/**
 * The listeners of `installPressRipple`: the point of a pointer press, the press with Enter
 * or Space, and the fade after the release.
 */
class PressRipple {
  private fades: readonly Fade[] = [];
  private pointerHost: HTMLElement | null = null;
  private keyHost: HTMLElement | null = null;
  /** The layer of the press that lasts (pointer or key), see {@link showLayer}. */
  private layer: Layer | null = null;
  /** A frame check of the layers runs (see {@link watch}). */
  private watching = false;

  readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const host = pressHost(event.target as Element | null);
    if (!host) return;
    this.stopFade(host);
    this.endLayer();
    placeRipple(host, { x: event.clientX, y: event.clientY });
    this.layer = showLayer(host, { x: event.clientX, y: event.clientY });
    if (this.layer) this.watch(host.ownerDocument);
    this.pointerHost = host;
  };

  readonly onPointerUp = (): void => {
    if (this.pointerHost) this.fadeOut(this.pointerHost, true);
    this.pointerHost = null;
  };

  /** A touch that turns into a scroll: the ripple goes without the hold. */
  readonly onPointerCancel = (): void => {
    if (this.pointerHost) this.fadeOut(this.pointerHost, false);
    this.pointerHost = null;
  };

  readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || !PRESS_KEYS.has(event.key) || this.keyHost) return;
    const target = event.target as Element | null;
    if (!target || target.closest(TEXT_FIELD)) return;
    const host = pressHost(target);
    if (!host) return;
    this.stopFade(host);
    this.endLayer();
    placeRipple(host, null);
    this.layer = showLayer(host, null);
    host.setAttribute('data-press-key', '');
    this.keyHost = host;
  };

  /** A key that goes up, or a focus that leaves while the key is down, ends the press. */
  readonly onKeyUp = (event: Event): void => {
    const host = this.keyHost;
    if (!host || (event instanceof KeyboardEvent && !PRESS_KEYS.has(event.key))) return;
    this.keyHost = null;
    host.removeAttribute('data-press-key');
    this.fadeOut(host, true);
  };

  /** Stop every pending fade. */
  dispose(): void {
    this.fades.forEach((fade) => {
      clearTimeout(fade.timer);
      if (fade.layer) dropLayer(fade.layer);
    });
    this.fades = [];
    if (this.layer) dropLayer(this.layer);
    this.layer = null;
  }

  private fadeOut(host: HTMLElement, hold: boolean): void {
    this.stopFade(host);
    const layer = this.layer?.host === host ? this.layer : null;
    this.layer = null;
    if (layer) {
      // The layer fades by itself; the host needs no attribute, and no read of its layout.
      this.fades = [...this.fades, { host, timer: hideLayer(layer, hold), layer }];
      this.watch(host.ownerDocument);
      return;
    }
    // A new attribute starts the fade again, also when the last fade still runs.
    void host.offsetWidth;
    host.setAttribute('data-press-out', '');
    const timer = setTimeout(() => this.stopFade(host), PRESS_FADE_MS);
    this.fades = [...this.fades, { host, timer }];
  }

  /**
   * While a layer shows, drop it in the frame in which its host leaves the page (a tap
   * that opened another page), so the layer does not stay over the new page. The check
   * reads no layout. It runs only while a layer exists.
   */
  private watch(doc: Document): void {
    const view = doc.defaultView;
    if (!view || this.watching) return;
    this.watching = true;
    const check = (): void => {
      const gone = this.fades.filter((fade) => fade.layer && !fade.host.isConnected);
      gone.forEach((fade) => {
        clearTimeout(fade.timer);
        if (fade.layer) dropLayer(fade.layer);
      });
      this.fades = this.fades.filter((fade) => !gone.includes(fade));
      if (this.layer && !this.layer.host.isConnected) this.endLayer();
      const alive = !!this.layer || this.fades.some((fade) => fade.layer);
      if (alive) view.requestAnimationFrame(check);
      else this.watching = false;
    };
    view.requestAnimationFrame(check);
  }

  /** A layer that no release ended (a second press came first) goes at once. */
  private endLayer(): void {
    if (this.layer) dropLayer(this.layer);
    this.layer = null;
  }

  private stopFade(host: HTMLElement): void {
    this.fades
      .filter((fade) => fade.host === host)
      .forEach((fade) => {
        clearTimeout(fade.timer);
        if (fade.layer) dropLayer(fade.layer);
      });
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
    ['pointercancel', ripple.onPointerCancel],
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
