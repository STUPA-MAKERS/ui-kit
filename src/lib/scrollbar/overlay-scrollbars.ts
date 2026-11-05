/**
 * Overlay scroll bars: one look in every browser and on every OS, for a mouse or a trackpad.
 *
 * Each browser draws its own scroll bar. Chrome on Linux draws arrow buttons, Windows draws a
 * wide classic bar, and macOS hides the bar until a scroll. CSS (`scrollbar-width`,
 * `scrollbar-color`) sets only the width class and two colours, so the bars still differ. This
 * module draws the bar itself:
 *
 * * The native bar stays, so scrolling stays native (wheel, keys, momentum, find in page). The
 *   stylesheet makes it transparent while `ui-scrollbars` is on `<html>`, and it keeps its
 *   gutter, so the layout is the same as with the native bar.
 * * One set of document listeners serves every scroll box. A box needs no attribute, so a new
 *   page gets the bar without a change.
 * * The bar of a box shows while the box scrolls and while the pointer is over the box, and it
 *   goes again {@link HIDE_DELAY_MS} after that. Under the pointer the thumb gets wider and the
 *   track shows. The thumb can be dragged, and a press on the track pages.
 * * The bars live in a fixed layer outside the box, so the scroll fade (a mask on the box) does
 *   not cut them. A box in an open `<dialog>` or popover gets the layer inside that element,
 *   because the top layer covers everything else.
 *
 * A box that sets `scrollbar-width: none` hides its bar on purpose and gets none. The attribute
 * `data-scrollbar` changes the bar of one box, as a list of words:
 *
 * * `none` — no bar.
 * * `hover` — the bar shows only while the pointer is over the box, not on a scroll alone.
 * * `start` — the vertical bar sits at the left edge.
 *
 * A box with the attribute gets a bar even if it sets `scrollbar-width: none` (that hides the
 * native gutter, for example on the left-hand bar of a navigation rail).
 *
 * Only a device with a fine pointer that can hover gets the bars. A touch screen keeps its own
 * overlay bar, which the base stylesheet already hides.
 */

/** The class on `<html>` while the overlay bars run. The stylesheet hides the native bars. */
export const OVERLAY_SCROLLBARS_CLASS = 'ui-scrollbars';

/** How long a bar stays after the last scroll or after the pointer left its box. */
export const HIDE_DELAY_MS = 1000;

/** The attribute that changes the bar of one box. */
export const SCROLLBAR_ATTR = 'data-scrollbar';

/** The media query of the devices that get the overlay bars. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** The bar of a box that scrolls less than this many pixels is not worth drawing. */
const MIN_OVERFLOW = 1;

/** The shortest thumb, so a very long list still has a thumb that a pointer can hold. */
const MIN_THUMB = 24;

/** The thickness of the rail, which is also the hit area of the thumb. */
const RAIL = 12;

/** The gap between the rail and the edge of the box at each end of the rail. */
const END_INSET = 2;

/** The overflow values that cut what lies outside the box. */
const CLIPS = new Set(['hidden', 'clip', 'auto', 'scroll']);

type Axis = 'x' | 'y';

interface Options {
  off: boolean;
  hoverOnly: boolean;
  start: boolean;
}

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** Read the words of `data-scrollbar`. `null` means the box has no attribute. */
function readOptions(el: Element): Options | null {
  const raw = el.getAttribute(SCROLLBAR_ATTR);
  if (raw === null) return null;
  const words = raw.split(/\s+/);
  return {
    off: words.includes('none'),
    hoverOnly: words.includes('hover'),
    start: words.includes('start'),
  };
}

/**
 * The rectangle in which a box is visible: its own, cut by every ancestor that clips. The
 * walk ends at a fixed element and at an element in the top layer (an open dialog or popover),
 * because the ancestors of those do not clip them.
 */
function visibleRect(el: Element, own: Rect, view: Window): Rect {
  const r = { ...own };
  if (escapes(el, view)) return r;
  for (let p = el.parentElement; p && p !== el.ownerDocument.documentElement; p = p.parentElement) {
    const s = view.getComputedStyle(p);
    if (CLIPS.has(s.overflowX) || CLIPS.has(s.overflowY)) {
      const pr = p.getBoundingClientRect();
      r.top = Math.max(r.top, pr.top);
      r.left = Math.max(r.left, pr.left);
      r.right = Math.min(r.right, pr.right);
      r.bottom = Math.min(r.bottom, pr.bottom);
    }
    if (escapes(p, view)) break;
  }
  return r;
}

/** Whether no ancestor clips the element: it is fixed or in the top layer. */
function escapes(el: Element, view: Window): boolean {
  return view.getComputedStyle(el).position === 'fixed' || topLayer(el) === el;
}

/** The nearest open dialog or popover that holds the element (itself included), or `null`. */
function topLayer(el: Element): Element | null {
  try {
    return el.closest('dialog[open], :popover-open');
  } catch {
    // A browser without the popover API (and jsdom) rejects the selector.
    return el.closest('dialog[open]');
  }
}

/** One bar: the rail and the thumb of one axis of one box. */
class Bar {
  readonly rail: HTMLElement;
  private readonly thumb: HTMLElement;
  /** The pointer is over the box. */
  hover = false;
  /** The pointer is over the rail. */
  hot = false;
  dragging = false;
  private scrolling = false;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  /** The scroll position that one pixel of thumb travel moves, from the last update. */
  private ratio = 1;
  private thumbStart = 0;
  private thumbLength = 0;

  constructor(
    readonly el: Element,
    readonly axis: Axis,
    private readonly host: OverlayScrollbars,
    readonly options: Options,
  ) {
    const doc = host.doc;
    this.rail = doc.createElement('div');
    this.rail.className = `ui-sb ui-sb--${axis}`;
    if (options.start && axis === 'y') this.rail.classList.add('ui-sb--start');
    this.rail.setAttribute('aria-hidden', 'true');
    this.thumb = doc.createElement('div');
    this.thumb.className = 'ui-sb__thumb';
    this.rail.appendChild(this.thumb);
    this.rail.addEventListener('pointerdown', this.onPointerDown);
    this.rail.addEventListener('wheel', this.onWheel, { passive: false });
    this.rail.addEventListener('pointerenter', () => this.setHot(true));
    this.rail.addEventListener('pointerleave', () => this.setHot(false));
  }

  /** A scroll of the box: show the bar until {@link HIDE_DELAY_MS} after the last one. */
  scrolled(): void {
    if (this.options.hoverOnly && !this.hover) return;
    this.scrolling = true;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      this.scrolling = false;
      this.render();
    }, HIDE_DELAY_MS);
    this.render();
  }

  setHover(on: boolean): void {
    if (this.hover === on) return;
    this.hover = on;
    if (on) {
      this.render();
      return;
    }
    clearTimeout(this.hideTimer);
    this.scrolling = !this.options.hoverOnly;
    this.hideTimer = setTimeout(() => {
      this.scrolling = false;
      this.render();
    }, HIDE_DELAY_MS);
    this.render();
  }

  private setHot(on: boolean): void {
    this.hot = on;
    this.rail.classList.toggle('is-hot', on || this.dragging);
  }

  get shown(): boolean {
    return this.hover || this.scrolling || this.dragging;
  }

  /** Whether the box still scrolls on this axis. */
  get alive(): boolean {
    return this.el.isConnected && this.host.overflow(this.el, this.axis) > MIN_OVERFLOW;
  }

  /** Place the rail and the thumb from the geometry of the box, and show or hide them. */
  render(): void {
    const shown = this.shown && this.alive;
    this.rail.classList.toggle('is-shown', shown);
    if (!shown) return;
    const { el, axis } = this;
    const view = this.host.view;
    const root = el === this.host.doc.scrollingElement;
    const s = view.getComputedStyle(el);
    const outer: Rect = root
      ? { top: 0, left: 0, right: view.innerWidth, bottom: view.innerHeight }
      : el.getBoundingClientRect();
    // The padding box: the border comes off, the scroll bar gutter stays.
    const box: Rect = root
      ? outer
      : {
          top: outer.top + parseFloat(s.borderTopWidth || '0'),
          left: outer.left + parseFloat(s.borderLeftWidth || '0'),
          right: outer.right - parseFloat(s.borderRightWidth || '0'),
          bottom: outer.bottom - parseFloat(s.borderBottomWidth || '0'),
        };
    const clip = root ? box : visibleRect(el, box, view);
    if (clip.bottom - clip.top < RAIL * 2 || clip.right - clip.left < RAIL * 2) {
      this.rail.classList.remove('is-shown');
      return;
    }
    // The layer can sit in a transformed dialog, which moves the origin of `position: fixed`.
    const origin = this.rail.parentElement?.getBoundingClientRect() ?? { top: 0, left: 0 };
    const client = axis === 'y' ? el.clientHeight : el.clientWidth;
    const full = axis === 'y' ? el.scrollHeight : el.scrollWidth;
    const pos = axis === 'y' ? el.scrollTop : Math.abs(el.scrollLeft);
    const length = client - END_INSET * 2;
    const thumb = Math.min(length, Math.max(MIN_THUMB, (length * client) / full));
    const travel = length - thumb;
    const max = full - client;
    this.ratio = travel > 0 ? max / travel : 0;
    this.thumbLength = thumb;
    this.thumbStart = max > 0 ? (Math.min(pos, max) / max) * travel : 0;
    const r = this.rail.style;
    if (axis === 'y') {
      const left = this.options.start
        ? box.left
        : box.left + el.clientWidth + gutter(box, el, 'y') - RAIL;
      r.top = `${box.top + END_INSET - origin.top}px`;
      r.left = `${left - origin.left}px`;
      r.width = `${RAIL}px`;
      r.height = `${length}px`;
    } else {
      const top = box.top + el.clientHeight + gutter(box, el, 'x') - RAIL;
      r.top = `${top - origin.top}px`;
      r.left = `${box.left + END_INSET - origin.left}px`;
      r.width = `${length}px`;
      r.height = `${RAIL}px`;
    }
    // Cut the rail where an ancestor clips the box, for example a pane under a sticky head.
    const railTop = axis === 'y' ? box.top + END_INSET : parseFloat(r.top) + origin.top;
    const railLeft = axis === 'y' ? parseFloat(r.left) + origin.left : box.left + END_INSET;
    const railBottom = railTop + (axis === 'y' ? length : RAIL);
    const railRight = railLeft + (axis === 'y' ? RAIL : length);
    const cut = [
      Math.max(0, clip.top - railTop),
      Math.max(0, railRight - clip.right),
      Math.max(0, railBottom - clip.bottom),
      Math.max(0, clip.left - railLeft),
    ];
    r.clipPath = cut.some((c) => c > 0.5) ? `inset(${cut.map((c) => `${c}px`).join(' ')})` : '';
    const t = this.thumb.style;
    if (axis === 'y') {
      t.height = `${thumb}px`;
      t.width = '';
      t.transform = `translateY(${this.thumbStart}px)`;
    } else {
      t.width = `${thumb}px`;
      t.height = '';
      t.transform = `translateX(${this.thumbStart}px)`;
    }
  }

  destroy(): void {
    clearTimeout(this.hideTimer);
    this.rail.remove();
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const along = this.axis === 'y' ? e.clientY : e.clientX;
    const railStart =
      this.axis === 'y'
        ? this.rail.getBoundingClientRect().top
        : this.rail.getBoundingClientRect().left;
    const at = along - railStart;
    if (at < this.thumbStart || at > this.thumbStart + this.thumbLength) {
      // A press on the track pages towards the pointer, as the native track does.
      const page = (this.axis === 'y' ? this.el.clientHeight : this.el.clientWidth) * 0.9;
      const delta = at < this.thumbStart ? -page : page;
      this.el.scrollBy(this.axis === 'y' ? { top: delta } : { left: delta });
      return;
    }
    const startPointer = along;
    const startScroll = this.axis === 'y' ? this.el.scrollTop : this.el.scrollLeft;
    this.dragging = true;
    this.rail.classList.add('is-hot', 'is-dragging');
    this.rail.setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent): void => {
      const d = ((this.axis === 'y' ? ev.clientY : ev.clientX) - startPointer) * this.ratio;
      if (this.axis === 'y') this.el.scrollTop = startScroll + d;
      else this.el.scrollLeft = startScroll + d;
    };
    const up = (ev: PointerEvent): void => {
      this.dragging = false;
      this.rail.classList.remove('is-dragging');
      this.rail.classList.toggle('is-hot', this.hot);
      this.rail.releasePointerCapture?.(ev.pointerId);
      this.rail.removeEventListener('pointermove', move);
      this.rail.removeEventListener('pointerup', up);
      this.rail.removeEventListener('pointercancel', up);
      this.scrolled();
    };
    this.rail.addEventListener('pointermove', move);
    this.rail.addEventListener('pointerup', up);
    this.rail.addEventListener('pointercancel', up);
  };

  /** The rail is outside the box, so a wheel over it scrolls the box by hand. */
  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.el.clientHeight : 1;
    this.el.scrollBy({ left: e.deltaX * unit, top: e.deltaY * unit });
  };
}

/** The width (`y`) or height (`x`) of the native gutter that the box keeps for its bar. */
function gutter(box: Rect, el: Element, axis: Axis): number {
  return axis === 'y'
    ? Math.max(0, box.right - box.left - el.clientWidth)
    : Math.max(0, box.bottom - box.top - el.clientHeight);
}

/**
 * The controller behind {@link startOverlayScrollbars}. It is exported for the tests; an app
 * calls the function.
 */
export class OverlayScrollbars {
  readonly view: Window;
  private readonly bars = new Map<Element, Partial<Record<Axis, Bar>>>();
  private readonly layers = new Map<Element, HTMLElement>();
  private readonly media: MediaQueryList;
  private hovered = new Set<Bar>();
  private frame = 0;
  private pointerTarget: EventTarget | null = null;
  /** The pointer target of the last walk up to the scroll boxes. */
  private walked: EventTarget | null | undefined;
  private running = false;

  constructor(readonly doc: Document) {
    this.view = doc.defaultView ?? window;
    this.media = this.view.matchMedia(FINE_POINTER);
  }

  /** Follow the pointer type: run with a fine pointer, stop on a touch screen. */
  start(): void {
    this.media.addEventListener('change', this.onMedia);
    if (this.media.matches) this.run();
  }

  stop(): void {
    this.media.removeEventListener('change', this.onMedia);
    this.halt();
  }

  /** How many pixels a box hides on an axis, or 0 if it does not scroll there or opts out. */
  overflow(el: Element, axis: Axis): number {
    const s = this.view.getComputedStyle(el);
    const options = readOptions(el);
    if (options?.off) return 0;
    if (!options && s.scrollbarWidth === 'none') return 0;
    const o = axis === 'y' ? s.overflowY : s.overflowX;
    const root = el === this.doc.scrollingElement;
    if (root ? o === 'hidden' || o === 'clip' : o !== 'auto' && o !== 'scroll') return 0;
    return axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
  }

  /** The bars of a box, for the tests. */
  barsOf(el: Element): Partial<Record<Axis, Bar>> | undefined {
    return this.bars.get(el);
  }

  private readonly onMedia = (e: MediaQueryListEvent): void => {
    if (e.matches) this.run();
    else this.halt();
  };

  private run(): void {
    if (this.running) return;
    this.running = true;
    this.doc.documentElement.classList.add(OVERLAY_SCROLLBARS_CLASS);
    this.doc.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
    this.doc.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.doc.documentElement.addEventListener('pointerleave', this.onLeave);
    this.view.addEventListener('resize', this.schedule, { passive: true });
  }

  private halt(): void {
    if (!this.running) return;
    this.running = false;
    this.doc.documentElement.classList.remove(OVERLAY_SCROLLBARS_CLASS);
    this.doc.removeEventListener('scroll', this.onScroll, { capture: true });
    this.doc.removeEventListener('pointermove', this.onPointerMove);
    this.doc.documentElement.removeEventListener('pointerleave', this.onLeave);
    this.view.removeEventListener('resize', this.schedule);
    this.view.cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const axes of this.bars.values()) for (const bar of Object.values(axes)) bar?.destroy();
    this.bars.clear();
    for (const layer of this.layers.values()) layer.remove();
    this.layers.clear();
    this.hovered.clear();
    this.walked = undefined;
  }

  /** The bar of a box on one axis, made on first use. `null` if the box does not scroll there. */
  private bar(el: Element, axis: Axis): Bar | null {
    let axes = this.bars.get(el);
    const existing = axes?.[axis];
    if (existing) return existing;
    if (this.overflow(el, axis) <= MIN_OVERFLOW) return null;
    const bar = new Bar(
      el,
      axis,
      this,
      readOptions(el) ?? { off: false, hoverOnly: false, start: false },
    );
    this.layer(el).appendChild(bar.rail);
    if (!axes) {
      axes = {};
      this.bars.set(el, axes);
    }
    axes[axis] = bar;
    return bar;
  }

  /** The layer for a box: the one of its open dialog or popover, or the one of the page. */
  private layer(el: Element): HTMLElement {
    const owner = topLayer(el) ?? this.doc.body;
    let layer = this.layers.get(owner);
    if (!layer || !layer.isConnected) {
      layer = this.doc.createElement('div');
      layer.className = 'ui-sb-layer';
      owner.appendChild(layer);
      this.layers.set(owner, layer);
    }
    return layer;
  }

  private readonly onScroll = (e: Event): void => {
    const target = e.target;
    const el =
      target === this.doc ? this.doc.scrollingElement : target instanceof Element ? target : null;
    if (!el || el.classList.contains('ui-sb')) return;
    for (const axis of ['y', 'x'] as const) this.bar(el, axis)?.scrolled();
    this.schedule();
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    this.pointerTarget = e.target;
    this.schedule();
  };

  private readonly onLeave = (): void => {
    this.pointerTarget = null;
    this.schedule();
  };

  private readonly schedule = (): void => {
    if (this.frame) return;
    this.frame = this.view.requestAnimationFrame(() => {
      this.frame = 0;
      this.tick();
    });
  };

  /** Work out the boxes under the pointer, then place every bar that shows. */
  private tick(): void {
    const target = this.pointerTarget;
    // Over a rail the pointer is outside the box, but the bar must stay.
    const onRail = target instanceof Element && target.closest('.ui-sb') !== null;
    // The walk reads the style of every ancestor, so it runs only when the target changes.
    if (!onRail && target !== this.walked) {
      this.walked = target;
      const next = new Set<Bar>();
      if (target instanceof Element) {
        const found: Partial<Record<Axis, boolean>> = {};
        for (let el: Element | null = target; el && !(found.x && found.y); el = el.parentElement) {
          for (const axis of ['y', 'x'] as const) {
            if (found[axis]) continue;
            const bar = this.bar(el, axis);
            if (bar) {
              found[axis] = true;
              next.add(bar);
            }
          }
        }
      }
      for (const bar of this.hovered) if (!next.has(bar)) bar.setHover(false);
      for (const bar of next) bar.setHover(true);
      this.hovered = next;
    }
    for (const [el, axes] of this.bars) {
      for (const axis of ['y', 'x'] as const) {
        const bar = axes[axis];
        if (!bar) continue;
        if (!el.isConnected) {
          bar.destroy();
          this.hovered.delete(bar);
          delete axes[axis];
          continue;
        }
        bar.render();
      }
      if (!axes.x && !axes.y) this.bars.delete(el);
    }
  }
}

/**
 * Draw the scroll bars of every scroll box in the document. Call it once at app start; it
 * returns the function that stops it. See the module docs for what it does.
 */
export function startOverlayScrollbars(doc: Document): () => void {
  const bars = new OverlayScrollbars(doc);
  bars.start();
  return () => bars.stop();
}
