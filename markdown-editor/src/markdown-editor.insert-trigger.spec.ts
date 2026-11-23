import { render } from '@testing-library/angular';
import { MarkdownEditorComponent } from './markdown-editor.component';

interface EditorLike {
  storage: { markdown: { getMarkdown: () => string } };
  view: { someProp: (name: string, fn: (h: (...a: unknown[]) => boolean) => boolean) => boolean | undefined };
}

/** §002761: a typed trigger text asks the consumer for an insert. */
describe('MarkdownEditorInsertTrigger', () => {
  // jsdom has no layout and no Range.getClientRects, which the focus of tiptap reads in a timer.
  beforeAll(() => {
    const range = Range.prototype as unknown as Record<string, unknown>;
    range['getClientRects'] ??= () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] });
    range['getBoundingClientRect'] ??= () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
  });

  async function withTrigger(md: string, trigger: string | null) {
    const requests: number[] = [];
    const view = await render(
      `<app-markdown-editor [value]="md" [insertTrigger]="trigger" (insertRequest)="requests.push(1)" />`,
      { imports: [MarkdownEditorComponent], componentProperties: { md, trigger, requests } },
    );
    const cmp = view.fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
    const editor = (
      cmp as unknown as {
        editor: EditorLike & {
          commands: { setTextSelection(at: number): void };
          state: { doc: { firstChild: { content: { size: number } } } };
        };
      }
    ).editor;
    // The end of the first block: the document ends with an empty line of its own.
    editor.commands.setTextSelection(editor.state.doc.firstChild.content.size + 1);
    interface Pm {
      readonly state: { readonly selection: { from: number; to: number }; readonly tr: { insertText(t: string): unknown } };
      dispatch(tr: unknown): void;
    }
    /** Type one character the way ProseMirror reports it, else insert it. */
    const type = (text: string): void => {
      for (const char of text) {
        const pm = (editor as unknown as { view: Pm }).view;
        const { from, to } = pm.state.selection;
        const handled = editor.view.someProp('handleTextInput', (h) => h(pm, from, to, char));
        if (!handled) pm.dispatch(pm.state.tr.insertText(char));
      }
    };
    return { cmp, requests, type, md: () => editor.storage.markdown.getMarkdown() };
  }

  it('removes the trigger at the start of a word and asks for the insert', async () => {
    const { requests, type, md } = await withTrigger('Siehe', '::');
    type(' ::');
    expect(requests).toEqual([1]);
    expect(md()).toBe('Siehe ');
  });

  it('takes the trigger at the start of an empty line', async () => {
    const { requests, type, md } = await withTrigger('', '::');
    type('::');
    expect(requests).toEqual([1]);
    expect(md()).toBe('');
  });

  it('keeps the trigger inside a word and after one colon only', async () => {
    const { requests, type, md } = await withTrigger('Siehe', '::');
    type('::');
    type(' :x:');
    expect(requests).toEqual([]);
    expect(md()).toBe('Siehe:: :x:');
  });

  it('keeps the text plain without a trigger', async () => {
    const { requests, type, md } = await withTrigger('Siehe', null);
    type(' ::');
    expect(requests).toEqual([]);
    expect(md()).toBe('Siehe ::');
  });

  it('keeps the trigger in a code block', async () => {
    const { requests, type } = await withTrigger('```\ncode\n```', '::');
    type(' ::');
    expect(requests).toEqual([]);
  });
});
