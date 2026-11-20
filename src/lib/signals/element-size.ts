import { Injector, NgZone, type Signal, afterNextRender, effect, inject, signal } from '@angular/core';

/** The size of an element, in CSS pixels. */
export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

/**
 * Which box to measure: `content` is the box inside the padding (the `contentRect` of the
 * observer), `border` includes padding and border (`offsetWidth`, `offsetHeight`).
 */
export type ElementSizeBox = 'content' | 'border';

function measure(el: Element, box: ElementSizeBox): ElementSize {
  if (box === 'border' && el instanceof HTMLElement) {
    return { width: el.offsetWidth, height: el.offsetHeight };
  }
  const rect = el.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/**
 * Watch the size of an element with a `ResizeObserver` and hand each new size to
 * `write`. Call it in an injection context.
 *
 * `target` is read in an effect, so a `viewChild` that appears later works. The first
 * size is written in the read phase after the render, then on every change, inside the Angular zone: an observer
 * fires outside it, and a page that binds the size in a style would keep the old value
 * until the next event. The observer stops when the target changes and with the
 * caller. Without `ResizeObserver` (an old browser, a test) nothing is written.
 *
 * The first size waits for the read phase, because the effect runs in the middle of the
 * render: a read there made the browser lay out the page between two writes of the render
 * (app spec 002161).
 */
export function observeElementSize(
  target: () => Element | null | undefined,
  write: (size: ElementSize) => void,
  box: ElementSizeBox = 'content',
): void {
  const zone = inject(NgZone);
  const injector = inject(Injector);
  effect((onCleanup) => {
    const el = target();
    if (!el || typeof ResizeObserver === 'undefined') return;
    const first = afterNextRender({ read: () => write(measure(el, box)) }, { injector });
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      const size =
        entry && box === 'content'
          ? { width: entry.contentRect.width, height: entry.contentRect.height }
          : measure(el, box);
      zone.run(() => write(size));
    });
    observer.observe(el);
    onCleanup(() => {
      first.destroy();
      observer.disconnect();
    });
  });
}

/**
 * The size of an element as a signal, `{ width: 0, height: 0 }` until it is measured.
 * See {@link observeElementSize} for the timing; call it in an injection context.
 */
export function elementSize(
  target: () => Element | null | undefined,
  box: ElementSizeBox = 'content',
): Signal<ElementSize> {
  const size = signal<ElementSize>({ width: 0, height: 0 });
  observeElementSize(target, (s) => size.set(s), box);
  return size.asReadonly();
}
