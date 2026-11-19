import { installPressRipple, placeRipple, pressHost, PRESS_FADE_MS } from './press-ripple';

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

  it('fades the tint out after a pointer release', () => {
    document.body.innerHTML = '<button id="b"><span id="s">x</span></button>';
    const button = host(document.getElementById('b')!);
    box(button, 0, 0, 40, 40);
    pointer('pointerdown', document.getElementById('s')!, 5, 5);
    expect(button.style.getPropertyValue('--ripple-x')).toBe('5px');
    expect(button.hasAttribute('data-press-out')).toBe(false);
    pointer('pointerup', document.getElementById('s')!);
    expect(button.hasAttribute('data-press-out')).toBe(true);
    jest.advanceTimersByTime(PRESS_FADE_MS);
    expect(button.hasAttribute('data-press-out')).toBe(false);
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
