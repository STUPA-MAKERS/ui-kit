import {
  HIDE_DELAY_MS,
  OVERLAY_SCROLLBARS_CLASS,
  OverlayScrollbars,
  startOverlayScrollbars,
} from './overlay-scrollbars';

const FINE = '(hover: hover) and (pointer: fine)';

/** A `matchMedia` whose one query can change later, so the `change` listener can be driven. */
function fakeMedia(matches: boolean): { set: (on: boolean) => void; restore: () => void } {
  const original = window.matchMedia;
  const listeners: ((e: MediaQueryListEvent) => void)[] = [];
  const list = {
    matches,
    media: FINE,
    addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) =>
      listeners.splice(listeners.indexOf(fn), 1),
  };
  window.matchMedia = (() => list) as unknown as typeof window.matchMedia;
  return {
    set: (on) => {
      list.matches = on;
      listeners.forEach((fn) => fn({ matches: on } as MediaQueryListEvent));
    },
    restore: () => (window.matchMedia = original),
  };
}

/** A scroll box with a fixed geometry, because jsdom does no layout. */
function box(
  opts: { height?: number; full?: number; width?: number; fullWidth?: number } = {},
): HTMLElement {
  const el = document.createElement('div');
  el.style.overflowY = 'auto';
  el.style.overflowX = 'auto';
  const height = opts.height ?? 200;
  const width = opts.width ?? 300;
  let top = 0;
  let left = 0;
  Object.defineProperties(el, {
    clientHeight: { value: height },
    scrollHeight: { value: opts.full ?? 1000 },
    clientWidth: { value: width },
    scrollWidth: { value: opts.fullWidth ?? width },
    scrollTop: { get: () => top, set: (v: number) => (top = v) },
    scrollLeft: { get: () => left, set: (v: number) => (left = v) },
  });
  el.getBoundingClientRect = () =>
    ({
      top: 10,
      left: 20,
      right: 20 + width + 8,
      bottom: 10 + height,
      width: width + 8,
      height,
    }) as DOMRect;
  el.scrollBy = ((o: ScrollToOptions) => {
    top += o.top ?? 0;
    left += o.left ?? 0;
  }) as typeof el.scrollBy;
  document.body.appendChild(el);
  return el;
}

function rails(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.ui-sb'));
}

function shown(): HTMLElement[] {
  return rails().filter((r) => r.classList.contains('is-shown'));
}

/** Run the next animation frame, where the controller places the bars. */
function frame(): void {
  jest.advanceTimersByTime(20);
}

describe('overlay scroll bars', () => {
  let media: ReturnType<typeof fakeMedia>;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    media = fakeMedia(true);
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    media.restore();
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  it('runs with a fine pointer and stops on a touch screen', () => {
    stop = startOverlayScrollbars(document);
    expect(document.documentElement.classList).toContain(OVERLAY_SCROLLBARS_CLASS);
    media.set(false);
    expect(document.documentElement.classList).not.toContain(OVERLAY_SCROLLBARS_CLASS);
    media.set(true);
    expect(document.documentElement.classList).toContain(OVERLAY_SCROLLBARS_CLASS);
    stop();
    expect(document.documentElement.classList).not.toContain(OVERLAY_SCROLLBARS_CLASS);
  });

  it('does nothing on a touch screen', () => {
    media.set(false);
    stop = startOverlayScrollbars(document);
    box().dispatchEvent(new Event('scroll'));
    frame();
    expect(rails()).toHaveLength(0);
    expect(document.documentElement.classList).not.toContain(OVERLAY_SCROLLBARS_CLASS);
  });

  it('shows the bar of a box on a scroll and hides it after the delay', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    el.scrollTop = 400;
    el.dispatchEvent(new Event('scroll'));
    frame();
    expect(shown()).toHaveLength(1);
    const rail = shown()[0];
    expect(rail.classList).toContain('ui-sb--y');
    expect(rail.getAttribute('aria-hidden')).toBe('true');
    // The rail sits at the right end of the padding box, the gutter included.
    expect(rail.style.left).toBe(`${20 + 300 + 8 - 12}px`);
    expect(rail.style.height).toBe('196px');
    const thumb = rail.firstElementChild as HTMLElement;
    // 196 * 200 / 1000 = 39.2 px, at 400 of 800 px: half of the 156.8 px of travel.
    expect(parseFloat(thumb.style.height)).toBeCloseTo(39.2);
    expect(thumb.style.transform).toBe('translateY(78.4px)');
    jest.advanceTimersByTime(HIDE_DELAY_MS + 10);
    expect(shown()).toHaveLength(0);
  });

  it('draws no bar for a box that fits or does not scroll', () => {
    stop = startOverlayScrollbars(document);
    box({ full: 200 }).dispatchEvent(new Event('scroll'));
    const hidden = box();
    hidden.style.overflowY = 'hidden';
    hidden.dispatchEvent(new Event('scroll'));
    frame();
    expect(rails()).toHaveLength(0);
  });

  it('respects data-scrollbar="none"', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    el.setAttribute('data-scrollbar', 'none');
    el.dispatchEvent(new Event('scroll'));
    frame();
    expect(rails()).toHaveLength(0);
  });

  it('skips a box that hides its bar, unless the attribute asks for one', () => {
    const bars = new OverlayScrollbars(document);
    const el = box();
    const real = window.getComputedStyle;
    const spy = jest.spyOn(window, 'getComputedStyle').mockImplementation((e: Element) => {
      const s = real(e);
      return e === el
        ? ({
            ...s,
            overflowY: 'auto',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          } as CSSStyleDeclaration)
        : s;
    });
    expect(bars.overflow(el, 'y')).toBe(0);
    el.setAttribute('data-scrollbar', 'start');
    expect(bars.overflow(el, 'y')).toBe(800);
    spy.mockRestore();
  });

  it('shows a hover-only bar under the pointer, not on a scroll alone, and puts a start bar left', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    el.setAttribute('data-scrollbar', 'hover start');
    const child = document.createElement('span');
    el.appendChild(child);
    el.dispatchEvent(new Event('scroll'));
    frame();
    expect(shown()).toHaveLength(0);
    child.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
    frame();
    expect(shown()).toHaveLength(1);
    expect(shown()[0].classList).toContain('ui-sb--start');
    expect(shown()[0].style.left).toBe('20px');
    document.body.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
    frame();
    // Gone at once, without the delay of a scroll.
    jest.advanceTimersByTime(HIDE_DELAY_MS + 10);
    expect(shown()).toHaveLength(0);
  });

  it('keeps the bar while the pointer is over the box, and for the delay after it left', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    el.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
    frame();
    jest.advanceTimersByTime(HIDE_DELAY_MS * 3);
    expect(shown()).toHaveLength(1);
    // Over its own rail the pointer is outside the box, but the bar stays.
    shown()[0].dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
    frame();
    expect(shown()).toHaveLength(1);
    document.documentElement.dispatchEvent(new MouseEvent('pointerleave'));
    frame();
    expect(shown()).toHaveLength(1);
    jest.advanceTimersByTime(HIDE_DELAY_MS + 10);
    expect(shown()).toHaveLength(0);
  });

  it('ignores touch pointers', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    const move = new MouseEvent('pointermove', { bubbles: true });
    Object.defineProperty(move, 'pointerType', { value: 'touch' });
    el.dispatchEvent(move);
    frame();
    expect(rails()).toHaveLength(0);
  });

  it('draws a horizontal bar at the bottom', () => {
    stop = startOverlayScrollbars(document);
    const el = box({ full: 200, fullWidth: 900 });
    el.scrollLeft = 300;
    el.dispatchEvent(new Event('scroll'));
    frame();
    const rail = shown()[0];
    expect(rail.classList).toContain('ui-sb--x');
    expect(rail.style.width).toBe('296px');
    expect((rail.firstElementChild as HTMLElement).style.transform).toMatch(/^translateX\(/);
  });

  it('scrolls the box from the rail: wheel, track press and drag', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    el.dispatchEvent(new Event('scroll'));
    frame();
    const rail = shown()[0];
    rail.getBoundingClientRect = () => ({ top: 12, left: 316, right: 328, bottom: 208 }) as DOMRect;
    rail.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true }));
    expect(el.scrollTop).toBe(48);
    el.scrollTop = 0;
    el.dispatchEvent(new Event('scroll'));
    frame();
    // Below the thumb: one page down.
    rail.dispatchEvent(
      new MouseEvent('pointerdown', { button: 0, clientY: 12 + 150, bubbles: true }),
    );
    expect(el.scrollTop).toBe(180);
    el.scrollTop = 0;
    el.dispatchEvent(new Event('scroll'));
    frame();
    // On the thumb: drag 10 px, which is 800 / 156.8 px of scroll per pixel.
    rail.dispatchEvent(new MouseEvent('pointerdown', { button: 0, clientY: 20, bubbles: true }));
    expect(rail.classList).toContain('is-dragging');
    rail.dispatchEvent(new MouseEvent('pointermove', { clientY: 30 }));
    expect(el.scrollTop).toBeCloseTo((10 * 800) / 156.8);
    rail.dispatchEvent(new MouseEvent('pointerup', { clientY: 30 }));
    expect(rail.classList).not.toContain('is-dragging');
    rail.dispatchEvent(new MouseEvent('pointerenter'));
    expect(rail.classList).toContain('is-hot');
    rail.dispatchEvent(new MouseEvent('pointerleave'));
    expect(rail.classList).not.toContain('is-hot');
  });

  it('drops the bar of a box that left the page', () => {
    stop = startOverlayScrollbars(document);
    const el = box();
    el.dispatchEvent(new Event('scroll'));
    frame();
    expect(rails()).toHaveLength(1);
    el.remove();
    window.dispatchEvent(new Event('resize'));
    frame();
    expect(rails()).toHaveLength(0);
  });

  it('puts the bars of a box in an open dialog into that dialog', () => {
    stop = startOverlayScrollbars(document);
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);
    const el = box();
    dialog.appendChild(el);
    el.dispatchEvent(new Event('scroll'));
    frame();
    expect(dialog.querySelector('.ui-sb-layer .ui-sb')).not.toBeNull();
  });

  it('cuts the rail where an ancestor clips, but not past a dialog', () => {
    stop = startOverlayScrollbars(document);
    const pane = document.createElement('div');
    pane.style.overflowX = 'hidden';
    pane.style.overflowY = 'hidden';
    pane.getBoundingClientRect = () => ({ top: 0, left: 0, right: 200, bottom: 1000 }) as DOMRect;
    document.body.appendChild(pane);
    const el = box();
    pane.appendChild(el);
    el.dispatchEvent(new Event('scroll'));
    frame();
    expect(shown()[0].style.clipPath).toBe('inset(0px 128px 0px 0px)');

    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    pane.appendChild(dialog);
    const inner = box();
    dialog.appendChild(inner);
    inner.dispatchEvent(new Event('scroll'));
    frame();
    const rail = dialog.querySelector<HTMLElement>('.ui-sb');
    expect(rail?.style.clipPath).toBe('');
  });
});
