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

  it('leaves a control with tabindex -1 out of the cycle', () => {
    const root = setup('<button id="a">A</button><button id="b">B</button><button id="c" tabindex="-1">C</button>');
    expect(focusableIn(root).map((el) => el.id)).toEqual(['a', 'b']);
    document.getElementById('b')!.focus();
    expect(tab(root).defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('a');
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
  it('hides the root overflow, not the body, and gives the old value back once', () => {
    document.documentElement.style.overflow = 'auto';
    const release = lockBodyScroll();
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('');
    release();
    expect(document.documentElement.style.overflow).toBe('auto');
    document.documentElement.style.overflow = 'scroll';
    release();
    expect(document.documentElement.style.overflow).toBe('scroll');
    document.documentElement.style.overflow = '';
  });

  it('gives the root back only when the last lock is released, in any order', () => {
    const root = document.documentElement;
    root.style.overflow = '';
    const sheet = lockBodyScroll();
    const dialog = lockBodyScroll();
    expect(root.style.overflow).toBe('hidden');
    // The sheet closes first, while the dialog it opened is still open.
    sheet();
    expect(root.style.overflow).toBe('hidden');
    sheet();
    expect(root.style.overflow).toBe('hidden');
    dialog();
    expect(root.style.overflow).toBe('');
    // A new lock after all are released starts over from the current value.
    root.style.overflow = 'auto';
    const again = lockBodyScroll();
    expect(root.style.overflow).toBe('hidden');
    again();
    expect(root.style.overflow).toBe('auto');
    root.style.overflow = '';
  });
});
