import { render } from '@testing-library/angular';
import { MarkdownEditorComponent } from './markdown-editor.component';
import { appendToTable, measureTableControls } from './table-controls';

const TABLE = '| A | B |\n| --- | --- |\n| a1 | b1 |\n| a2 | b2 |';

interface EditorLike {
  storage: { markdown: { getMarkdown: () => string } };
  commands: { setTextSelection(p: number): void; focus(): void };
  state: { doc: { descendants(fn: (n: { type: { name: string }; textContent: string }, pos: number) => void): void } };
  view: { dom: HTMLElement };
}

async function setup(md: string, disabled = false) {
  const view = await render(`<app-markdown-editor [value]="md" [disabled]="disabled" />`, {
    imports: [MarkdownEditorComponent],
    componentProperties: { md, disabled },
  });
  const host = view.container.querySelector('app-markdown-editor') as HTMLElement;
  const cmp = view.fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
  const editor = (cmp as unknown as { editor: EditorLike }).editor;
  const pm = view.container.querySelector('.ProseMirror') as HTMLElement;
  return { view, host, cmp, editor, pm, md: () => editor.storage.markdown.getMarkdown() };
}

/** Put the cursor into the text of the first cell that holds `text`. */
function cursorIn(editor: EditorLike, text: string): void {
  let at = -1;
  editor.state.doc.descendants((n, pos) => {
    if (at < 0 && (n.type.name === 'tableCell' || n.type.name === 'tableHeader') && n.textContent === text) {
      at = pos + 2;
    }
  });
  editor.commands.setTextSelection(at);
}

/** Show the controls: the cursor in a cell, the focus in the editor. */
async function showControls(s: Awaited<ReturnType<typeof setup>>, text = 'b1') {
  cursorIn(s.editor, text);
  s.pm.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  s.view.fixture.detectChanges();
  await s.view.fixture.whenStable();
}

/** Open the menu of a control and choose the item with `label`. */
async function choose(s: Awaited<ReturnType<typeof setup>>, control: string, label: string) {
  const trigger = s.host.querySelector(`${control} button`) as HTMLButtonElement;
  trigger.click();
  s.view.fixture.detectChanges();
  const item = Array.from(s.host.querySelectorAll<HTMLButtonElement>('[data-menu-item]')).find(
    (b) => b.textContent?.trim() === label,
  );
  expect(item).toBeDefined();
  item!.click();
  s.view.fixture.detectChanges();
}

describe('MarkdownEditorComponent table controls', () => {
  it('shows no controls outside a table or without the focus', async () => {
    const s = await setup(`Text\n\n${TABLE}`);
    s.pm.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    s.view.fixture.detectChanges();
    expect(s.host.querySelector('.mde__grip')).toBeNull();
    cursorIn(s.editor, 'b1');
    s.pm.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    s.view.fixture.detectChanges();
    expect(s.host.querySelector('.mde__grip')).toBeNull();
  });

  it('shows the grips, the bars and the table menu at the cursor', async () => {
    const s = await setup(TABLE);
    await showControls(s);
    expect(s.host.querySelector('.mde__grip--col')).not.toBeNull();
    expect(s.host.querySelector('.mde__grip--row')).not.toBeNull();
    expect(s.host.querySelector('.mde__tableMenu')).not.toBeNull();
    expect(s.host.querySelector('.mde__add--row')?.getAttribute('aria-label')).toBe('Zeile hinzufügen');
    expect(s.host.querySelector('.mde__add--col')?.getAttribute('aria-label')).toBe('Spalte hinzufügen');
  });

  it('keeps the controls while the focus moves to a control, hides them when it leaves', async () => {
    const s = await setup(TABLE);
    await showControls(s);
    const bar = s.host.querySelector('.mde__add--row') as HTMLElement;
    s.pm.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: bar }));
    s.view.fixture.detectChanges();
    expect(s.host.querySelector('.mde__grip')).not.toBeNull();
    s.pm.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    s.view.fixture.detectChanges();
    expect(s.host.querySelector('.mde__grip')).toBeNull();
  });

  it('shows no controls in a read-only editor', async () => {
    const s = await setup(TABLE, true);
    await showControls(s);
    expect(s.host.querySelector('.mde__grip')).toBeNull();
  });

  it('inserts a column left and right of the cursor and deletes it', async () => {
    const s = await setup(TABLE);
    await showControls(s);
    await choose(s, '.mde__grip--col', 'Spalte links einfügen');
    expect(s.md()).toBe('| A |  | B |\n| --- | --- | --- |\n| a1 |  | b1 |\n| a2 |  | b2 |');
    await choose(s, '.mde__grip--col', 'Spalte rechts einfügen');
    expect(s.md().split('\n')[2]).toBe('| a1 |  | b1 |  |');
    await choose(s, '.mde__grip--col', 'Spalte löschen');
    expect(s.md().split('\n')[2]).toBe('| a1 |  |  |');
  });

  it('inserts a row above and below the cursor and deletes it', async () => {
    const s = await setup(TABLE);
    await showControls(s);
    await choose(s, '.mde__grip--row', 'Zeile oberhalb einfügen');
    expect(s.md()).toBe('| A | B |\n| --- | --- |\n|  |  |\n| a1 | b1 |\n| a2 | b2 |');
    await choose(s, '.mde__grip--row', 'Zeile unterhalb einfügen');
    expect(s.md().split('\n')).toHaveLength(6);
    await choose(s, '.mde__grip--row', 'Zeile löschen');
    expect(s.md().split('\n')).toHaveLength(5);
  });

  it('deletes the table from the table menu', async () => {
    const s = await setup(`Text\n\n${TABLE}`);
    await showControls(s);
    await choose(s, '.mde__tableMenu', 'Tabelle löschen');
    expect(s.md()).not.toContain('|');
    expect(s.host.querySelector('.mde__grip')).toBeNull();
  });

  it('adds a row below the table and a column at its end, with the cursor in the new cell', async () => {
    const s = await setup(TABLE);
    await showControls(s, 'a1');
    (s.host.querySelector('.mde__add--row') as HTMLButtonElement).click();
    expect(s.md().split('\n')[4]).toBe('|  |  |');
    expect(s.cmp.inTable()).toBe(true);
    (s.host.querySelector('.mde__add--col') as HTMLButtonElement).click();
    // The cursor is in the new last row, so the new column starts there.
    expect(s.md().split('\n')[0]).toBe('| A | B |  |');
    expect(s.md().split('\n')).toHaveLength(5);
  });

  it('keeps the bar from the page when it is pressed, so the editor keeps the focus', async () => {
    const s = await setup(TABLE);
    await showControls(s);
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    s.host.querySelector('.mde__add--row')!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('measures again when the table scrolls sideways', async () => {
    const s = await setup(TABLE);
    await showControls(s);
    const place = jest.spyOn(s.cmp as unknown as { placeTableControls(): void }, 'placeTableControls');
    s.pm.querySelector('.tableWrapper')!.dispatchEvent(new Event('scroll'));
    expect(place).toHaveBeenCalled();
  });

  it('measures again when the text changes its size', async () => {
    const observed: Element[] = [];
    let notify: () => void = () => undefined;
    const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      constructor(cb: () => void) {
        notify = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      disconnect() {
        observed.length = 0;
      }
    };
    try {
      const s = await setup(TABLE);
      expect(observed).toEqual([s.editor.view.dom]);
      const place = jest.spyOn(s.cmp as unknown as { placeTableControls(): void }, 'placeTableControls');
      notify();
      expect(place).toHaveBeenCalled();
      s.view.fixture.destroy();
      expect(observed).toEqual([]);
    } finally {
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
    }
  });

  it('runs the commands before the cursor through tableCommand', async () => {
    const s = await setup(TABLE);
    cursorIn(s.editor, 'b1');
    expect(s.cmp.tableCommand('addColumnBefore')).toBe(true);
    expect(s.cmp.tableCommand('addRowBefore')).toBe(true);
    expect(s.md().split('\n')).toEqual([
      '| A |  | B |',
      '| --- | --- | --- |',
      '|  |  |  |',
      '| a1 |  | b1 |',
      '| a2 |  | b2 |',
    ]);
  });
});

describe('table controls outside a table', () => {
  it('measures nothing and appends nothing', async () => {
    const s = await setup('Text');
    const editor = (s.cmp as unknown as { editor: Parameters<typeof appendToTable>[0] }).editor;
    expect(measureTableControls(editor, s.host)).toBeNull();
    expect(appendToTable(editor, 'row')).toBe(false);
  });
});
