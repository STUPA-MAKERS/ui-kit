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
  for (let el = start; el && el.tagName !== 'BODY' && el.tagName !== 'HTML'; el = el.parentElement) {
    if (!(el instanceof HTMLElement)) continue;
    const view = el.ownerDocument.defaultView;
    if (view?.getComputedStyle(el).getPropertyValue('--press-host').trim() === '1') return el;
  }
  return null;
}

/** The cells that paint a table row: each one paints its part of the ripple of the row. */
function painters(host: HTMLElement): HTMLElement[] {
  return host instanceof HTMLTableRowElement
    ? [host, ...Array.from(host.cells)]
    : [host];
}

/**
 * Write the point of the press and the radius of the ripple to the painters of `host`. The
 * radius is the distance from the point to the farthest corner of the host, so the circle
 * covers the host when it ends. A point of null is the centre (a press with a key).
 */
export function placeRipple(host: HTMLElement, point: { x: number; y: number } | null): void {
  const box = host.getBoundingClientRect();
  const x = point ? point.x : box.left + box.width / 2;
  const y = point ? point.y : box.top + box.height / 2;
  const r = Math.hypot(Math.max(x - box.left, box.right - x), Math.max(y - box.top, box.bottom - y));
  for (const el of painters(host)) {
    const own = el.getBoundingClientRect();
    el.style.setProperty('--ripple-x', `${x - own.left}px`);
    el.style.setProperty('--ripple-y', `${y - own.top}px`);
    el.style.setProperty('--ripple-r', `${Math.ceil(r)}px`);
  }
}

/**
 * The parts of the ripple of a press that CSS cannot do (app spec 001314, `_press.scss`):
 * the point of a pointer press, the press with Enter or Space, and the fade after the
 * release. Returns the function that removes the listeners.
 */
export function installPressRipple(doc: Document): () => void {
  const fading = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  let pointerHost: HTMLElement | null = null;
  let keyHost: HTMLElement | null = null;

  const fadeOut = (host: HTMLElement): void => {
    clearTimeout(fading.get(host));
    host.removeAttribute('data-press-out');
    // A new attribute starts the fade again, also when the last fade still runs.
    void host.offsetWidth;
    host.setAttribute('data-press-out', '');
    fading.set(
      host,
      setTimeout(() => {
        fading.delete(host);
        host.removeAttribute('data-press-out');
      }, PRESS_FADE_MS),
    );
  };

  const stopFade = (host: HTMLElement): void => {
    clearTimeout(fading.get(host));
    fading.delete(host);
    host.removeAttribute('data-press-out');
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const host = pressHost(event.target as Element | null);
    if (!host) return;
    stopFade(host);
    placeRipple(host, { x: event.clientX, y: event.clientY });
    pointerHost = host;
  };

  const onPointerUp = (): void => {
    if (pointerHost) fadeOut(pointerHost);
    pointerHost = null;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || !PRESS_KEYS.has(event.key) || keyHost) return;
    const target = event.target as Element | null;
    if (!target || target.closest(TEXT_FIELD)) return;
    const host = pressHost(target);
    if (!host) return;
    stopFade(host);
    placeRipple(host, null);
    host.setAttribute('data-press-key', '');
    keyHost = host;
  };

  // A key that goes up, or a focus that leaves while the key is down, ends the press.
  const onKeyUp = (event: Event): void => {
    if (!keyHost || (event instanceof KeyboardEvent && !PRESS_KEYS.has(event.key))) return;
    const host = keyHost;
    keyHost = null;
    host.removeAttribute('data-press-key');
    fadeOut(host);
  };

  const options = { capture: true, passive: true } as const;
  doc.addEventListener('pointerdown', onPointerDown, options);
  doc.addEventListener('pointerup', onPointerUp, options);
  doc.addEventListener('pointercancel', onPointerUp, options);
  doc.addEventListener('keydown', onKeyDown, options);
  doc.addEventListener('keyup', onKeyUp, options);
  doc.addEventListener('focusout', onKeyUp, options);
  return () => {
    doc.removeEventListener('pointerdown', onPointerDown, options);
    doc.removeEventListener('pointerup', onPointerUp, options);
    doc.removeEventListener('pointercancel', onPointerUp, options);
    doc.removeEventListener('keydown', onKeyDown, options);
    doc.removeEventListener('keyup', onKeyUp, options);
    doc.removeEventListener('focusout', onKeyUp, options);
    for (const timer of fading.values()) clearTimeout(timer);
    fading.clear();
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
