import { render, screen } from '@testing-library/angular';
import { MarkdownEditorComponent } from './markdown-editor.component';
import { type SlashCommand, filterSlashCommands } from './slash-menu';

const COMMANDS: readonly SlashCommand[] = [
  { id: 'table', icon: 'table', label: 'Tabelle' },
  { id: 'image', icon: 'image', label: 'Bild' },
  { id: 'paperless', icon: 'archive', label: 'Aus Paperless' },
];

interface Pm {
  readonly state: {
    readonly selection: { from: number };
    readonly tr: { insertText(t: string): unknown; delete(from: number, to: number): unknown };
  };
  dispatch(tr: unknown): void;
  someProp(name: string, fn: (h: (...a: unknown[]) => boolean) => boolean): boolean | undefined;
}

/** §002769, §002770: the slash menu of the Markdown editor. */
describe('MarkdownEditorSlashMenu', () => {
  // jsdom has no layout and no Range.getClientRects, which tiptap and coordsAtPos read.
  beforeAll(() => {
    const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    const range = Range.prototype as unknown as Record<string, unknown>;
    range['getClientRects'] = () => ({ length: 1, item: () => rect, 0: rect, [Symbol.iterator]: [rect][Symbol.iterator] });
    range['getBoundingClientRect'] = () => rect;
  });

  async function withCommands(md: string, commands: readonly SlashCommand[] = COMMANDS) {
    const ran: string[] = [];
    const view = await render(
      `<app-markdown-editor [value]="md" [slashCommands]="commands" (slashCommand)="ran.push($event)" />`,
      { imports: [MarkdownEditorComponent], componentProperties: { md, commands, ran } },
    );
    const cmp = view.fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
    const editor = (
      cmp as unknown as {
        editor: {
          view: Pm & { dom: HTMLElement };
          storage: { markdown: { getMarkdown: () => string } };
          commands: { setTextSelection(at: number): void; focus(): void };
          state: { doc: { firstChild: { content: { size: number } } } };
        };
      }
    ).editor;
    // The menu shows while the focus is in the editor.
    editor.view.dom.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    // The end of the first block: the document ends with an empty line of its own.
    editor.commands.setTextSelection(editor.state.doc.firstChild.content.size + 1);
    const type = (text: string): void => {
      for (const char of text) editor.view.dispatch(editor.view.state.tr.insertText(char));
      view.fixture.detectChanges();
    };
    const key = (name: string): boolean => {
      const event = new KeyboardEvent('keydown', { key: name });
      const taken = editor.view.someProp('handleKeyDown', (h) => h(editor.view, event)) === true;
      view.fixture.detectChanges();
      return taken;
    };
    const backspace = (): void => {
      const at = editor.view.state.selection.from;
      editor.view.dispatch(editor.view.state.tr.delete(at - 1, at));
      view.fixture.detectChanges();
    };
    const options = (): string[] => screen.queryAllByRole('option').map((el) => el.textContent?.trim() ?? '');
    const marked = (): string | undefined =>
      screen.queryAllByRole('option', { selected: true })[0]?.textContent?.trim();
    return { ran, type, key, backspace, options, marked, dom: editor.view.dom, md: () => editor.storage.markdown.getMarkdown() };
  }

  it('opens the menu at a slash at the start of a word and keeps the slash', async () => {
    const { type, options, marked, md, dom } = await withCommands('Siehe');
    type(' /');
    expect(options()).toEqual(['Tabelle', 'Bild', 'Aus Paperless']);
    expect(marked()).toBe('Tabelle');
    expect(md()).toBe('Siehe /');
    expect(screen.getByRole('listbox').id).toBe(dom.getAttribute('aria-controls'));
    expect(dom.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id);
  });

  it('opens the menu at the start of an empty line', async () => {
    const { type, options } = await withCommands('');
    type('/');
    expect(options()).toHaveLength(3);
  });

  it('keeps a slash inside a word as plain text', async () => {
    const { type, options, md } = await withCommands('und');
    type('/oder');
    expect(options()).toEqual([]);
    expect(md()).toBe('und/oder');
  });

  it('keeps a slash in a code block as plain text', async () => {
    const { type, options } = await withCommands('```\ncode\n```');
    type(' /');
    expect(options()).toEqual([]);
  });

  it('opens no menu without commands', async () => {
    const { type, options, md } = await withCommands('Siehe', []);
    type(' /');
    expect(options()).toEqual([]);
    expect(md()).toBe('Siehe /');
  });

  it('filters by the start of a word of the name, in any case', async () => {
    const { type, options, backspace } = await withCommands('');
    type('/pap');
    expect(options()).toEqual(['Aus Paperless']);
    backspace();
    backspace();
    backspace();
    type('B');
    expect(options()).toEqual(['Bild']);
    expect(filterSlashCommands(COMMANDS, 'ild')).toEqual([]);
  });

  it('moves the mark with the arrow keys and runs the command with Enter', async () => {
    const { type, key, marked, ran, md, options } = await withCommands('Siehe');
    type(' /');
    expect(key('ArrowDown')).toBe(true);
    expect(marked()).toBe('Bild');
    key('ArrowUp');
    key('ArrowUp');
    expect(marked()).toBe('Aus Paperless');
    expect(key('Enter')).toBe(true);
    expect(ran).toEqual(['paperless']);
    expect(md()).toBe('Siehe ');
    expect(options()).toEqual([]);
  });

  it('runs the filtered command with Tab and removes the typed text', async () => {
    const { type, key, ran, md } = await withCommands('');
    type('/ta');
    expect(key('Tab')).toBe(true);
    expect(ran).toEqual(['table']);
    expect(md()).toBe('');
  });

  it('runs a command on a press', async () => {
    const { type, ran, md } = await withCommands('');
    type('/');
    screen.getByRole('option', { name: 'Bild' }).click();
    expect(ran).toEqual(['image']);
    expect(md()).toBe('');
  });

  it('closes on Escape and keeps the typed text', async () => {
    const { type, key, options, md } = await withCommands('');
    type('/');
    expect(key('Escape')).toBe(true);
    expect(options()).toEqual([]);
    type('ta');
    expect(options()).toEqual([]);
    expect(md()).toBe('/ta');
    expect(key('Escape')).toBe(false);
  });

  it.each(['/ ', '/xyz'])('closes on the text %j and keeps it', async (text) => {
    const { type, options, md, ran } = await withCommands('');
    type(text);
    expect(options()).toEqual([]);
    expect(md()).toBe(text);
    expect(ran).toEqual([]);
  });
});
