import { Injector, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Platform } from '@angular/cdk/platform';
import { installPressRipple, placeRipple, pressHost, PRESS_FADE_MS, PRESS_INK_ATTR } from './press-ripple';

/** jsdom applies no stylesheet, so a spec marks a host with the inline property. */
function host(el: HTMLElement): HTMLElement {
  el.style.setProperty('--press-host', '1');
  return el;
}

function box(el: Element, left: number, top: number, width: number, height: number): void {
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  });
}

function pointer(type: string, target: Element, x = 0, y = 0): void {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
  target.dispatchEvent(event);
}

describe('press ripple', () => {
  let uninstall: () => void;

  beforeEach(() => {
    jest.useFakeTimers();
    uninstall = installPressRipple(document);
  });
  afterEach(() => {
    uninstall();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('finds the nearest host from the pressed element up, and none above the body', () => {
    document.body.innerHTML = '<div id="row"><button id="b"><span id="s">x</span></button></div><p id="p">t</p>';
    const row = host(document.getElementById('row')!);
    expect(pressHost(document.getElementById('s'))).toBe(row);
    const button = host(document.getElementById('b')!);
    expect(pressHost(document.getElementById('s'))).toBe(button);
    expect(pressHost(document.getElementById('p'))).toBeNull();
    expect(pressHost(null)).toBeNull();
  });

  it('places the ripple at the point of the press with the radius to the farthest corner', () => {
    document.body.innerHTML = '<button id="b">x</button>';
    const button = host(document.getElementById('b')!);
    box(button, 100, 50, 80, 40);
    placeRipple(button, { x: 110, y: 60 });
    expect(button.style.getPropertyValue('--ripple-x')).toBe('10px');
    expect(button.style.getPropertyValue('--ripple-y')).toBe('10px');
    // The farthest corner is the lower right one: hypot(70, 30) = 76.2.
    expect(button.style.getPropertyValue('--ripple-r')).toBe('77px');
    placeRipple(button, null);
    expect(button.style.getPropertyValue('--ripple-x')).toBe('40px');
    expect(button.style.getPropertyValue('--ripple-y')).toBe('20px');
  });

  it('gives each cell of a table row its own point of one circle of the row', () => {
    document.body.innerHTML = '<table><tbody><tr id="r"><td id="a">a</td><td id="c">c</td></tr></tbody></table>';
    const row = host(document.getElementById('r')!);
    box(row, 0, 0, 200, 40);
    box(document.getElementById('a')!, 0, 0, 100, 40);
    box(document.getElementById('c')!, 100, 0, 100, 40);
    placeRipple(row, { x: 150, y: 20 });
    expect(document.getElementById('a')!.style.getPropertyValue('--ripple-x')).toBe('150px');
    expect(document.getElementById('c')!.style.getPropertyValue('--ripple-x')).toBe('50px');
    expect(document.getElementById('c')!.style.getPropertyValue('--ripple-r')).toBe(
      document.getElementById('a')!.style.getPropertyValue('--ripple-r'),
    );
  });

  it('fades the CSS tint out after a pointer release without Angular', () => {
    document.body.innerHTML = '<button id="b"><span id="s">x</span></button>';
    const button = host(document.getElementById('b')!);
    pointer('pointerdown', document.getElementById('s')!, 5, 5);
    expect(document.querySelector('.press-ink')).toBeNull();
    expect(button.hasAttribute('data-press-out')).toBe(false);
    pointer('pointerup', document.getElementById('s')!);
    expect(button.hasAttribute('data-press-out')).toBe(true);
    jest.advanceTimersByTime(PRESS_FADE_MS);
    expect(button.hasAttribute('data-press-out')).toBe(false);
  });

  it('ends the CSS ripple when the pointer drags past the slop', () => {
    document.body.innerHTML = '<button id="b"></button>';
    const button = host(document.getElementById('b')!);
    pointer('pointerdown', button, 10, 10);
    pointer('pointermove', button, 14, 14);
    expect(button.hasAttribute('data-press-out')).toBe(false);
    pointer('pointermove', button, 10, 30);
    expect(button.hasAttribute('data-press-out')).toBe(true);
  });

  it('presses with Enter or Space from the centre until the key goes up, but not in a field', () => {
    document.body.innerHTML = '<button id="b">x</button><div id="f"><input id="i" /></div>';
    const button = host(document.getElementById('b')!);
    host(document.getElementById('f')!);
    box(button, 0, 0, 40, 20);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(true);
    expect(button.style.getPropertyValue('--ripple-x')).toBe('20px');
    button.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(true);
    button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(false);
    expect(button.hasAttribute('data-press-out')).toBe(true);

    const input = document.getElementById('i')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(document.getElementById('f')!.hasAttribute('data-press-key')).toBe(false);
  });

  it('ends a key press when the focus leaves, and ignores a held key and a key without a host', () => {
    document.body.innerHTML = '<button id="b">x</button><p id="p" tabindex="0">t</p>';
    const button = host(document.getElementById('b')!);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, repeat: true }));
    expect(button.hasAttribute('data-press-key')).toBe(false);
    document.getElementById('p')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(true);
    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(false);
  });

  it('removes its listeners', () => {
    uninstall();
    document.body.innerHTML = '<button id="b">x</button>';
    const button = host(document.getElementById('b')!);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(false);
    uninstall = () => undefined;
  });
});

describe('press ripple with Angular Material (002164)', () => {
  let uninstall: () => void;

  beforeEach(() => {
    jest.useFakeTimers();
    // jsdom lays nothing out; a box of zero size turns the animation of Material off.
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 50));
    uninstall = installPressRipple(document, {
      zone: TestBed.inject(NgZone),
      platform: TestBed.inject(Platform),
      injector: TestBed.inject(Injector),
    });
  });
  afterEach(() => {
    uninstall();
    jest.restoreAllMocks();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  const circles = (el: Element): HTMLElement[] => Array.from(el.querySelectorAll<HTMLElement>('.mat-ripple-element'));
  const ended = (circle: HTMLElement): void => {
    circle.dispatchEvent(new Event('transitionend'));
  };

  it('draws the ripple in a box inside the host, grows it to the end of a short tap, then fades', () => {
    document.body.innerHTML = '<button id="b"><span id="s">x</span></button>';
    const button = host(document.getElementById('b')!);
    button.style.setProperty('--press-tint', 'rgb(0, 0, 255)');
    pointer('pointerdown', document.getElementById('s')!, 15, 25);
    const ink = button.querySelector<HTMLElement>(':scope > .press-ink')!;
    expect(ink.getAttribute('aria-hidden')).toBe('true');
    expect(button.style.position).toBe('relative');
    expect(button.hasAttribute(PRESS_INK_ATTR)).toBe(true);
    expect(button.style.getPropertyValue('--press-paint')).toBe('transparent');
    const [circle] = circles(ink);
    expect(circle!.style.backgroundColor).toBe('rgb(0, 0, 255)');
    pointer('pointerup', document.getElementById('s')!);
    expect(button.hasAttribute('data-press-out')).toBe(false);
    // The tap was short: the circle grows to its end before it fades.
    expect(circle!.style.opacity).toBe('');
    ended(circle!);
    expect(circle!.style.opacity).toBe('0');
    ended(circle!);
    expect(circles(ink)).toHaveLength(0);
    // A second press reuses the box.
    pointer('pointerdown', button, 15, 25);
    expect(button.querySelectorAll('.press-ink')).toHaveLength(1);
    pointer('pointerup', button);
  });

  it('keeps a held press until the release', () => {
    document.body.innerHTML = '<button id="b"></button>';
    const button = host(document.getElementById('b')!);
    pointer('pointerdown', button, 10, 10);
    const [circle] = circles(button);
    ended(circle!);
    jest.advanceTimersByTime(2000);
    expect(circle!.style.opacity).toBe('');
    pointer('pointerup', button);
    expect(circle!.style.opacity).toBe('0');
  });

  it('draws in the marked surface, with the corners of --press-radius', () => {
    document.body.innerHTML = '<a id="a" href="#"><span id="p" data-press-surface>i</span></a>';
    const link = host(document.getElementById('a')!);
    link.style.setProperty('--press-radius', '999px');
    pointer('pointerdown', link, 1, 1);
    const ink = document.querySelector<HTMLElement>('#p > .press-ink')!;
    expect(ink.style.borderRadius).toBe('999px');
    expect(circles(ink)).toHaveLength(1);
    pointer('pointerup', link);
  });

  it('fades at once at a drag past the slop or a cancel, and draws none on a disabled host', () => {
    document.body.innerHTML = '<button id="b"></button><button id="d" aria-disabled="true"></button>';
    const button = host(document.getElementById('b')!);
    pointer('pointerdown', button, 10, 10);
    pointer('pointermove', button, 12, 12);
    expect(circles(button)[0]!.style.opacity).toBe('');
    pointer('pointermove', button, 10, 30);
    expect(circles(button)[0]!.style.opacity).toBe('0');
    pointer('pointerdown', button, 10, 10);
    pointer('pointercancel', button);
    expect(circles(button).every((c) => c.style.opacity === '0')).toBe(true);
    const off = host(document.getElementById('d')!);
    pointer('pointerdown', off, 1, 1);
    expect(circles(off)).toHaveLength(0);
    pointer('pointerup', off);
  });

  it('keeps the CSS ripple on a table row, whose cells cannot hold a box', () => {
    document.body.innerHTML = '<table><tbody><tr id="r"><td>a</td></tr></tbody></table>';
    const row = host(document.getElementById('r')!);
    pointer('pointerdown', row, 50, 20);
    expect(row.querySelector('.press-ink')).toBeNull();
    pointer('pointerup', row);
    expect(row.hasAttribute('data-press-out')).toBe(true);
  });

  it('holds a key press from the centre until the key goes up', () => {
    document.body.innerHTML = '<button id="b">x</button>';
    const button = host(document.getElementById('b')!);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(false);
    const [circle] = circles(button);
    expect(circle!.style.left).toBe(`${50 - Math.hypot(50, 25)}px`);
    ended(circle!);
    button.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    expect(circle!.style.opacity).toBe('0');
  });
});
