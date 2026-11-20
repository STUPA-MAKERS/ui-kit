import { installPressRipple, placeRipple, pressHost, PRESS_FADE_MS, PRESS_HOLD_MS } from './press-ripple';

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

  it('fades the tint out after a pointer release where no layer can show', () => {
    // A host without a box (jsdom, a hidden element) keeps the CSS ripple.
    document.body.innerHTML = '<button id="b"><span id="s">x</span></button>';
    const button = host(document.getElementById('b')!);
    pointer('pointerdown', document.getElementById('s')!, 5, 5);
    expect(document.querySelector('.press-layer')).toBeNull();
    expect(button.hasAttribute('data-press-out')).toBe(false);
    pointer('pointerup', document.getElementById('s')!);
    expect(button.hasAttribute('data-press-out')).toBe(true);
    jest.advanceTimersByTime(PRESS_FADE_MS);
    expect(button.hasAttribute('data-press-out')).toBe(false);
  });

  it('draws the ripple on a layer of its own over the host, and fades it out (002164)', () => {
    document.body.innerHTML = '<button id="b" style="border-radius: 8px; color: red"><span id="s">x</span></button>';
    const button = host(document.getElementById('b')!);
    button.style.setProperty('--press-tint', 'blue');
    box(button, 10, 20, 40, 30);
    pointer('pointerdown', document.getElementById('s')!, 15, 25);
    const layer = document.querySelector<HTMLElement>('.press-layer')!;
    expect(layer.parentElement).toBe(document.body);
    expect(layer.style.left).toBe('10px');
    expect(layer.style.top).toBe('20px');
    expect(layer.style.width).toBe('40px');
    expect(layer.style.borderRadius).toBe('8px');
    expect(layer.style.getPropertyValue('--press-tint')).toBe('blue');
    // The circle is centred on the point and reaches the farthest corner (35, 25 away).
    const wave = layer.querySelector<HTMLElement>('.press-layer__wave')!;
    const r = Math.ceil(Math.hypot(35, 25));
    expect(wave.style.left).toBe(`${5 - r}px`);
    expect(wave.style.width).toBe(`${2 * r}px`);
    expect(button.hasAttribute('data-press-layer')).toBe(true);
    jest.advanceTimersByTime(60);
    pointer('pointerup', document.getElementById('s')!);
    expect(layer.classList.contains('press-layer--out')).toBe(true);
    // A short tap keeps the ripple until the hold has passed, then fades.
    expect(layer.style.getPropertyValue('--press-hold')).toBe(`${PRESS_HOLD_MS - 60}ms`);
    expect(button.hasAttribute('data-press-out')).toBe(false);
    jest.advanceTimersByTime(PRESS_HOLD_MS - 60 + PRESS_FADE_MS - 1);
    expect(layer.isConnected).toBe(true);
    jest.advanceTimersByTime(1);
    expect(layer.isConnected).toBe(false);
    expect(button.hasAttribute('data-press-layer')).toBe(false);
  });

  it('fades without the hold when the touch becomes a scroll, and after a long press', () => {
    document.body.innerHTML = '<button id="b"></button>';
    const button = host(document.getElementById('b')!);
    box(button, 0, 0, 40, 30);
    pointer('pointerdown', button, 5, 5);
    pointer('pointercancel', button);
    const first = document.querySelector<HTMLElement>('.press-layer')!;
    expect(first.style.getPropertyValue('--press-hold')).toBe('0ms');
    jest.advanceTimersByTime(PRESS_FADE_MS);
    expect(first.isConnected).toBe(false);
    pointer('pointerdown', button, 5, 5);
    jest.advanceTimersByTime(PRESS_HOLD_MS + 100);
    pointer('pointerup', button);
    expect(document.querySelector<HTMLElement>('.press-layer')!.style.getPropertyValue('--press-hold')).toBe('0ms');
  });

  it('drops the layer in the frame in which its host leaves the page', () => {
    document.body.innerHTML = '<main><button id="b"></button></main>';
    const button = host(document.getElementById('b')!);
    box(button, 0, 0, 40, 30);
    pointer('pointerdown', button, 5, 5);
    pointer('pointerup', button);
    const layer = document.querySelector<HTMLElement>('.press-layer')!;
    document.querySelector('main')!.innerHTML = '<p>next page</p>';
    jest.advanceTimersByTime(20);
    expect(layer.isConnected).toBe(false);
    // A held press too.
    document.body.insertAdjacentHTML('beforeend', '<button id="c"></button>');
    const next = host(document.getElementById('c')!);
    box(next, 0, 0, 40, 30);
    pointer('pointerdown', next, 5, 5);
    const held = document.querySelector<HTMLElement>('.press-layer')!;
    next.remove();
    jest.advanceTimersByTime(20);
    expect(held.isConnected).toBe(false);
  });

  it('shows the layer on the marked part from its centre, drops a layer at a new press, and none in a popover', () => {
    document.body.innerHTML =
      '<a id="a" href="#"><span id="p" data-press-surface>i</span></a><div popover><button id="q">q</button></div>';
    const link = host(document.getElementById('a')!);
    box(link, 0, 0, 80, 60);
    box(document.getElementById('p')!, 10, 10, 40, 20);
    pointer('pointerdown', link, 1, 1);
    const first = document.querySelector<HTMLElement>('.press-layer')!;
    expect(first.style.left).toBe('10px');
    const wave = first.querySelector<HTMLElement>('.press-layer__wave')!;
    expect(wave.style.left).toBe(`${20 - Math.ceil(Math.hypot(20, 10))}px`);
    pointer('pointerdown', link, 1, 1);
    expect(first.isConnected).toBe(false);
    expect(document.querySelectorAll('.press-layer')).toHaveLength(1);
    pointer('pointerup', link);
    const q = host(document.getElementById('q')!);
    box(q, 0, 0, 20, 20);
    pointer('pointerdown', q, 1, 1);
    expect(q.hasAttribute('data-press-layer')).toBe(false);
    pointer('pointerup', q);
    uninstall();
    expect(document.querySelectorAll('.press-layer')).toHaveLength(0);
    uninstall = installPressRipple(document);
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
    expect(document.querySelector('.press-layer')).not.toBeNull();
    button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    expect(button.hasAttribute('data-press-key')).toBe(false);
    expect(document.querySelector('.press-layer--out')).not.toBeNull();

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
