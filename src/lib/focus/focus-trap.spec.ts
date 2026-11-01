import { focusableIn, lockBodyScroll, trapTab } from './focus-trap';

function setup(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root" tabindex="-1">${html}</div>`;
  return document.getElementById('root') as HTMLElement;
}

function tab(root: HTMLElement, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
  trapTab(event, root);
  return event;
}

describe('trapTab', () => {
  it('wraps from the last element to the first and back', () => {
    const root = setup('<button id="a">A</button><input id="b" /><button id="c" disabled>C</button>');
    expect(focusableIn(root).map((el) => el.id)).toEqual(['a', 'b']);
    document.getElementById('b')!.focus();
    expect(tab(root).defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
    expect(tab(root, true).defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('b');
  });

  it('lets a Tab inside the cycle pass, and ignores other keys', () => {
    const root = setup('<button id="a">A</button><button id="b">B</button>');
    document.getElementById('a')!.focus();
    expect(tab(root).defaultPrevented).toBe(false);
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    trapTab(enter, root);
    expect(enter.defaultPrevented).toBe(false);
  });

  it('focuses the root when nothing in it takes the focus', () => {
    const root = setup('<p>Text</p>');
    expect(tab(root).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root);
    root.blur();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    trapTab(event, root, { focusRootWhenEmpty: false });
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).not.toBe(root);
  });

  it('wraps a Tab from outside the cycle when asked to', () => {
    const root = setup('<button id="a">A</button><button id="b">B</button>');
    root.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    trapTab(event, root, { outsideWraps: true });
    expect(document.activeElement?.id).toBe('a');
  });
});

describe('lockBodyScroll', () => {
  it('hides the body overflow and gives the old value back once', () => {
    document.body.style.overflow = 'auto';
    const release = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = 'scroll';
    release();
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });
});
