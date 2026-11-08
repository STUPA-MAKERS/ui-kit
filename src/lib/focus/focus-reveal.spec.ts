import { FOCUS_REVEAL_GAP, revealFocus, watchFocusReveal } from './focus-reveal';

/** A box at `top` with `height`, the width of the window. */
function box(top: number, height: number): DOMRect {
  return { top, bottom: top + height, left: 0, right: 400, width: 400, height, x: 0, y: top } as DOMRect;
}

function place(el: HTMLElement, rect: DOMRect): void {
  el.getBoundingClientRect = () => rect;
}

/**
 * A page of 600px: a sticky head 0–60, a fixed bar 520–600 and a button in a scroll area.
 * `hits` maps a y to the element `elementFromPoint` reports there.
 */
function page(buttonTop: number, opts: { scrollArea?: boolean } = {}) {
  document.body.innerHTML = `
    <header class="head" style="position: sticky">Kopf</header>
    <div class="area"><button type="button">Senden</button></div>
    <nav class="bar" style="position: fixed"><a href="/x">Start</a></nav>`;
  const head = document.querySelector<HTMLElement>('.head')!;
  const bar = document.querySelector<HTMLElement>('.bar')!;
  const area = document.querySelector<HTMLElement>('.area')!;
  const button = document.querySelector('button')!;
  place(head, box(0, 60));
  place(bar, box(520, 80));
  place(button, box(buttonTop, 40));
  if (opts.scrollArea) {
    area.style.overflowY = 'auto';
    Object.defineProperty(area, 'scrollHeight', { value: 2000 });
    Object.defineProperty(area, 'clientHeight', { value: 500 });
  }
  const areaScroll = jest.fn();
  area.scrollBy = areaScroll as unknown as typeof area.scrollBy;
  document.elementFromPoint = ((_x: number, y: number) => {
    if (y < 60) return head;
    if (y >= 520) return bar.querySelector('a');
    return button;
  }) as typeof document.elementFromPoint;
  return { head, bar, area, button, areaScroll };
}

describe('watchFocusReveal', () => {
  let windowScroll: jest.SpyInstance;
  const original = document.elementFromPoint;

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
    windowScroll = jest.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    jest.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element) {
      return true;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.elementFromPoint = original;
    document.body.innerHTML = '';
  });

  it('scrolls a control out from under a bar at the bottom', () => {
    const { button } = page(500);
    button.focus();
    revealFocus(document, button);
    expect(windowScroll).toHaveBeenCalledWith({ top: 540 - 520 + FOCUS_REVEAL_GAP });
  });

  it('scrolls a control out from under a sticky head at the top', () => {
    const { button } = page(40);
    button.focus();
    revealFocus(document, button);
    expect(windowScroll).toHaveBeenCalledWith({ top: -(60 - 40 + FOCUS_REVEAL_GAP) });
  });

  it('scrolls the nearest scroll area of the control', () => {
    const { button, areaScroll } = page(500, { scrollArea: true });
    button.focus();
    revealFocus(document, button);
    expect(areaScroll).toHaveBeenCalledWith({ top: 28 });
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('leaves a control that no bar covers', () => {
    const { button } = page(200);
    button.focus();
    revealFocus(document, button);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('leaves a control inside the bar', () => {
    const { bar } = page(200);
    const link = bar.querySelector('a')!;
    place(link, box(540, 40));
    link.focus();
    revealFocus(document, link);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('leaves a control that has no box, is off the screen or has no keyboard focus', () => {
    const { button } = page(500);
    revealFocus(document, button);
    button.focus();
    place(button, box(700, 40));
    revealFocus(document, button);
    place(button, box(0, 0));
    revealFocus(document, button);
    place(button, box(500, 40));
    jest.mocked(Element.prototype.matches).mockReturnValue(false);
    revealFocus(document, button);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('treats a browser without :focus-visible as a keyboard focus', () => {
    const { button } = page(500);
    button.focus();
    jest.mocked(Element.prototype.matches).mockImplementation(() => {
      throw new SyntaxError('unknown pseudo-class');
    });
    revealFocus(document, button);
    expect(windowScroll).toHaveBeenCalled();
  });

  it('ignores a covering element that is not pinned', () => {
    const { button } = page(500);
    const plain = document.createElement('div');
    document.body.append(plain);
    place(plain, box(520, 80));
    document.elementFromPoint = (() => plain) as typeof document.elementFromPoint;
    button.focus();
    revealFocus(document, button);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('reveals after each focus until it stops', async () => {
    const { button } = page(500);
    const stop = watchFocusReveal(document);
    button.focus();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(windowScroll).toHaveBeenCalledTimes(1);
    stop();
    button.blur();
    button.focus();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(windowScroll).toHaveBeenCalledTimes(1);
  });
});
