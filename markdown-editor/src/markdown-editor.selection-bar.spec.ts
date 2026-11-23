import { render } from '@testing-library/angular';
import { Editor as TiptapEditor, type Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { MarkdownEditorComponent } from './markdown-editor.component';
import { measureSelectionBar } from './selection-bar';

interface EditorLike {
  storage: { markdown: { getMarkdown: () => string } };
  commands: { setTextSelection(at: number | { from: number; to: number }): void };
  state: { selection: { from: number; to: number } };
  view: {
    dom: HTMLElement;
    someProp: (name: string, fn: (h: (...a: unknown[]) => boolean) => boolean) => boolean | undefined;
  };
}

/** §002780-§002783: a text selection shows the format bar. */
describe('MarkdownEditorSelectionBar', () => {
  // jsdom has no layout and no Range.getClientRects, which tiptap reads for the focus and
  // the coordinates of a position.
  beforeAll(() => {
    const range = Range.prototype as unknown as Record<string, unknown>;
    range['getClientRects'] ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] });
    range['getBoundingClientRect'] ??= () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
  });

  async function setup(opts: { bar?: boolean; disabled?: boolean } = {}) {
    const view = await render(
      `<app-markdown-editor value="Ein Wort hier" [selectionBar]="bar" [disabled]="disabled" />`,
      {
        imports: [MarkdownEditorComponent],
        componentProperties: { bar: opts.bar ?? true, disabled: opts.disabled ?? false },
      },
    );
    const host = view.fixture.debugElement.children[0];
    const cmp = host.componentInstance as MarkdownEditorComponent;
    const editor = (cmp as unknown as { editor: EditorLike }).editor;
    const frame = host.nativeElement as HTMLElement;
    // The focus is in the editor.
    editor.view.dom.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    /** Select the text from `from` to `to` (positions of the document). */
    const select = (from: number, to: number): void => {
      editor.commands.setTextSelection({ from, to });
      view.fixture.detectChanges();
    };
    const bar = (): HTMLElement | null => frame.querySelector('.mde__selbar');
    const buttons = (): HTMLButtonElement[] => Array.from(frame.querySelectorAll('.mde__selbar button'));
    const key = (target: EventTarget, init: KeyboardEventInit): void => {
      target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
      view.fixture.detectChanges();
    };
    return { view, cmp, editor, frame, select, bar, buttons, key };
  }

  it('shows the bar for a text selection and hides it for an empty one', async () => {
    const { select, bar, buttons } = await setup();
    expect(bar()).toBeNull();
    select(1, 4);
    expect(bar()).not.toBeNull();
    expect(bar()?.getAttribute('role')).toBe('toolbar');
    expect(bar()?.getAttribute('aria-label')).toBeTruthy();
    expect(buttons().map((b) => b.getAttribute('aria-label'))).toEqual(['Fett', 'Kursiv', 'Schwärzen']);
    select(2, 2);
    expect(bar()).toBeNull();
  });

  it('shows no bar without the input and in a read-only text', async () => {
    const off = await setup({ bar: false });
    off.select(1, 4);
    expect(off.bar()).toBeNull();
    const readOnly = await setup({ disabled: true });
    readOnly.select(1, 4);
    expect(readOnly.bar()).toBeNull();
  });

  it('waits while a pointer drags the selection', async () => {
    const { editor, select, bar, view } = await setup();
    editor.view.dom.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    select(1, 4);
    expect(bar()).toBeNull();
    document.dispatchEvent(new Event('pointerup'));
    view.fixture.detectChanges();
    expect(bar()).not.toBeNull();
  });

  it('switches a format on the selection and keeps the selection', async () => {
    const { editor, select, buttons, view } = await setup();
    select(1, 4);
    buttons()[0].click();
    view.fixture.detectChanges();
    expect(editor.storage.markdown.getMarkdown()).toBe('**Ein** Wort hier');
    expect(editor.state.selection).toMatchObject({ from: 1, to: 4 });
    expect(buttons()[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons()[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('keeps the buttons out of the Tab order', async () => {
    const { select, buttons } = await setup();
    select(1, 4);
    expect(buttons().every((b) => b.tabIndex === -1)).toBe(true);
  });

  it('hides the bar on Esc and shows it again for a new selection', async () => {
    const { editor, select, bar, view } = await setup();
    select(1, 4);
    const handled = editor.view.someProp('handleKeyDown', (h) =>
      h(editor.view, new KeyboardEvent('keydown', { key: 'Escape' })),
    );
    expect(handled).toBe(true);
    view.fixture.detectChanges();
    expect(bar()).toBeNull();
    select(5, 9);
    expect(bar()).not.toBeNull();
  });

  it('moves the focus with Alt+F10, the arrow keys and Esc', async () => {
    const { editor, select, buttons, key, bar } = await setup();
    select(1, 4);
    editor.view.someProp('handleKeyDown', (h) =>
      h(editor.view, new KeyboardEvent('keydown', { key: 'F10', altKey: true })),
    );
    expect(document.activeElement).toBe(buttons()[0]);
    key(buttons()[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons()[1]);
    key(buttons()[1], { key: 'ArrowLeft' });
    key(buttons()[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons()[2]);
    key(buttons()[2], { key: 'Escape' });
    expect(bar()).toBeNull();
    expect(editor.state.selection).toMatchObject({ from: 1, to: 4 });
  });
});

/** §002782: the bar goes below the selection, above it at the bottom of the view. */
describe('measureSelectionBar', () => {
  const size = { width: 120, height: 40 };

  function editorAt(top: number, bottom: number, left: number, selected = true): Editor {
    const editor = new TiptapEditor({ extensions: [StarterKit], content: '<p>Ein Wort</p>' });
    editor.commands.setTextSelection(selected ? { from: 1, to: 4 } : 2);
    editor.view.coordsAtPos = () => ({ left, right: left, top, bottom });
    return editor;
  }
  function frame(width: number): HTMLElement {
    const el = document.createElement('div');
    el.getBoundingClientRect = () => ({ left: 10, top: 100, width, height: 400 }) as DOMRect;
    return el;
  }

  it('returns null without a text selection', () => {
    expect(measureSelectionBar(editorAt(200, 220, 50, false), frame(600), size)).toBeNull();
  });

  it('places the bar below the selection at its start', () => {
    expect(measureSelectionBar(editorAt(200, 220, 50), frame(600), size)).toEqual({
      left: 40,
      top: 126,
      above: false,
    });
  });

  it('places the bar above the selection at the bottom of the view', () => {
    const bottom = window.innerHeight - 10;
    expect(measureSelectionBar(editorAt(bottom - 20, bottom, 50), frame(600), size)).toEqual({
      left: 40,
      top: bottom - 20 - 100 - 6,
      above: true,
    });
  });

  it('keeps the bar in the width of the editor', () => {
    expect(measureSelectionBar(editorAt(200, 220, 580), frame(600), size)?.left).toBe(480);
  });
});
