import { render } from '@testing-library/angular';
import { MarkdownEditorComponent, type MarkdownImageUploader } from './markdown-editor.component';
import { isMediaImageSrc, stripForeignImages } from './media.extension';

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const SRC = `/api/media/images/${ID}`;

interface EditorLike {
  storage: { markdown: { getMarkdown: () => string } };
  commands: { setContent(c: string): void; focus(pos?: number | 'end'): void; setTextSelection(p: number): void };
  state: { doc: { content: { size: number }; descendants(fn: (n: { type: { name: string } }, pos: number) => void): void } };
  view: {
    someProp: (name: string, fn: (h: (...a: unknown[]) => boolean) => boolean) => boolean | undefined;
    posAtCoords: (c: unknown) => { pos: number } | null;
  };
}

async function setup(md: string, extra: Record<string, unknown> = {}) {
  const view = await render(
    `<app-markdown-editor [value]="md" [imageUpload]="upload" [disabled]="disabled" />`,
    {
      imports: [MarkdownEditorComponent],
      componentProperties: { md, upload: null, disabled: false, ...extra },
    },
  );
  const cmp = view.fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
  const editor = (cmp as unknown as { editor: EditorLike }).editor;
  const pm = view.container.querySelector('.ProseMirror') as HTMLElement;
  return { view, cmp, editor, pm, md: () => editor.storage.markdown.getMarkdown() };
}

function file(name: string, type: string): File {
  return new File(['x'], name, { type });
}

/** Find the position of the first node of a type. */
function posOf(editor: EditorLike, name: string): number {
  let found = -1;
  editor.state.doc.descendants((n, pos) => {
    if (found < 0 && n.type.name === name) found = pos;
  });
  return found;
}

describe('MarkdownEditorComponent tables', () => {
  it('reads a GFM table and writes it back with the column alignment', async () => {
    const src = '| Name | Betrag | Status |\n| :--- | ---: | :---: |\n| Kaffee | 12,50 € | offen |\n| Tee | 3 € | bezahlt |';
    const { pm, md } = await setup(src);
    expect(pm.querySelectorAll('table')).toHaveLength(1);
    expect(pm.querySelectorAll('th')).toHaveLength(3);
    expect(pm.querySelectorAll('td')).toHaveLength(6);
    expect((pm.querySelectorAll('td')[1] as HTMLElement).style.textAlign).toBe('right');
    expect(md()).toBe(src);
  });

  it('keeps inline marks, escapes a pipe and keeps empty cells', async () => {
    const src = '| A | B |\n| --- | --- |\n| **fett** und *kursiv* | `a\\|b` |\n|  | x \\| y |';
    const { pm, md } = await setup(src);
    expect(pm.querySelector('td strong')?.textContent).toBe('fett');
    expect(pm.querySelector('td code')?.textContent).toBe('a|b');
    expect(md()).toBe(src);
  });

  it('keeps the text before and after a table, and a link in a cell', async () => {
    const src = 'Vorher.\n\n| A |\n| --- |\n| [Link](https://example.org) |\n\nNachher.';
    const { md } = await setup(src);
    expect(md()).toBe(src);
  });

  it('keeps a table in a quote', async () => {
    const quoted = '> | a | b |\n> | --- | --- |\n> | 1 | 2 |';
    expect((await setup(quoted)).md()).toBe(quoted);
  });

  it('keeps a table between lists', async () => {
    const listed = '- Punkt\n\n| a |\n| --- |\n| b |\n\n1. eins';
    expect((await setup(listed)).md()).toBe(listed);
  });

  it('separates a table from the paragraph before it', async () => {
    const { md } = await setup('Absatz\n| a |\n| --- |\n| b |');
    expect(md()).toBe('Absatz\n\n| a |\n| --- |\n| b |');
  });

  it('pads a short row of the Markdown to the width of the table', async () => {
    const { md } = await setup('| A | B |\n| --- | --- |\n| 1 |');
    expect(md()).toBe('| A | B |\n| --- | --- |\n| 1 |  |');
  });

  it('writes a table with merged cells and a line break without losing text', async () => {
    const { editor, md } = await setup('');
    const p = (...content: unknown[]): unknown => ({ type: 'paragraph', content });
    const text = (t: string): unknown => ({ type: 'text', text: t });
    (editor.commands.setContent as (c: unknown) => void)({
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            { type: 'tableRow', content: [{ type: 'tableHeader', attrs: { colspan: 2 }, content: [p(text('Kopf'))] }] },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [p(text('a'), { type: 'hardBreak' }, text('b'))] },
                { type: 'tableCell', content: [p(text('c'))] },
              ],
            },
          ],
        },
      ],
    });
    expect(md()).toBe('| Kopf |  |\n| --- | --- |\n| a b | c |');
  });

  it('inserts a table and edits it with the table commands', async () => {
    const { cmp, editor, md } = await setup('');
    expect(cmp.tableCommand('addRowAfter')).toBe(false);
    expect(cmp.insertTable(2, 2)).toBe(true);
    expect(cmp.inTable()).toBe(true);
    expect(md()).toBe('|  |  |\n| --- | --- |\n|  |  |');
    expect(cmp.tableCommand('addColumnAfter')).toBe(true);
    expect(cmp.tableCommand('addRowAfter')).toBe(true);
    expect(md().split('\n')).toHaveLength(4);
    expect(md().split('\n')[0]).toBe('|  |  |  |');
    expect(cmp.tableCommand('deleteRow')).toBe(true);
    expect(cmp.tableCommand('deleteColumn')).toBe(true);
    expect(md()).toBe('|  |  |\n| --- | --- |\n|  |  |');
    expect(cmp.tableCommand('deleteTable')).toBe(true);
    expect(cmp.inTable()).toBe(false);
    expect(md()).toBe('');
    expect(posOf(editor, 'table')).toBe(-1);
  });

  it('inserts nothing while read-only', async () => {
    const { cmp } = await setup('', { disabled: true });
    expect(cmp.insertTable()).toBe(false);
    expect(cmp.tableCommand('deleteTable')).toBe(false);
    expect(cmp.insertImage(SRC, 'a')).toBe(false);
  });
});

describe('MarkdownEditorComponent images', () => {
  it('shows an image with the canonical path and writes it back', async () => {
    const src = `Text ![Logo der Sitzung](${SRC}) danach.\n\n![](${SRC})`;
    const { pm, md } = await setup(src);
    const imgs = pm.querySelectorAll('img.mde__img');
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute('src')).toBe(SRC);
    expect(imgs[0].getAttribute('alt')).toBe('Logo der Sitzung');
    expect(md()).toBe(src);
  });

  it('keeps an image in a table cell', async () => {
    const src = `| Bild |\n| --- |\n| ![a](${SRC}) |`;
    const { pm, md } = await setup(src);
    expect(pm.querySelector('td img.mde__img')?.getAttribute('src')).toBe(SRC);
    expect(md()).toBe(src);
  });

  it('never loads another source and writes the reference back unchanged', async () => {
    const src =
      '![Pixel](https://tracker.example/p.gif) und ![Rel](bild.png "Titel") und ' +
      `![Groß](/api/media/images/${ID.toUpperCase()})`;
    const { pm, md } = await setup(src);
    expect(pm.querySelectorAll('img.mde__img')).toHaveLength(0);
    const alts = Array.from(pm.querySelectorAll('.mde__imgAlt')).map((e) => e.textContent);
    expect(alts).toEqual(['Pixel', 'Rel', 'Groß']);
    expect(md()).toBe(src);
  });

  it('keeps a data or javascript destination as text', async () => {
    const src = '![x](javascript:alert(1))';
    const { pm } = await setup(src);
    expect(pm.querySelectorAll('img.mde__img, .mde__imgAlt')).toHaveLength(0);
    expect(pm.textContent).toContain('![x](javascript:alert(1))');
  });

  it('inserts only an image with the canonical path', async () => {
    const { cmp, pm, md } = await setup('');
    expect(cmp.insertImage('https://example.org/a.png', 'a')).toBe(false);
    expect(cmp.insertImage(SRC, 'Foto')).toBe(true);
    expect(pm.querySelector('img.mde__img')?.getAttribute('src')).toBe(SRC);
    expect(md()).toBe(`![Foto](${SRC})`);
  });

  it('drops an image with another source from pasted HTML and keeps its alt text', () => {
    expect(stripForeignImages('<p>a</p>')).toBe('<p>a</p>');
    expect(stripForeignImages(`<p><img src="https://x/y.png" alt="Fremd"><img src="${SRC}" alt="ok"></p>`)).toBe(
      `<p>Fremd<img src="${SRC}" alt="ok"></p>`,
    );
    expect(isMediaImageSrc(SRC)).toBe(true);
    expect(isMediaImageSrc(`${SRC}?x=1`)).toBe(false);
    expect(isMediaImageSrc(null)).toBe(false);
  });
});

describe('MarkdownEditorComponent image upload', () => {
  function clipboard(files: File[]): ClipboardEvent {
    const event = new Event('paste') as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: { files, getData: () => '' } });
    return event;
  }

  function dropEvent(files: File[]): DragEvent {
    const event = new Event('drop') as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { files } });
    Object.defineProperty(event, 'clientX', { value: 0 });
    Object.defineProperty(event, 'clientY', { value: 0 });
    return event;
  }

  it('uploads pasted image files one after the other and inserts each', async () => {
    const order: string[] = [];
    const upload: MarkdownImageUploader = async (f) => {
      order.push(f.name);
      return { src: SRC, alt: f.name.replace(/\..*$/, '') };
    };
    const { cmp, editor, md } = await setup('', { upload });
    const handled = editor.view.someProp('handlePaste', (h) =>
      h(editor.view, clipboard([file('a.png', 'image/png'), file('b.svg', 'image/svg+xml'), file('c.webp', 'image/webp')])),
    );
    expect(handled).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(order).toEqual(['a.png', 'c.webp']);
    expect(md()).toBe(`![a](${SRC})![c](${SRC})`);
    expect(cmp.uploading()).toBe(0);
  });

  it('leaves a paste without image files to the editor', async () => {
    const { editor } = await setup('', { upload: async () => ({ src: SRC, alt: '' }) });
    expect(
      editor.view.someProp('handlePaste', (h) => h(editor.view, clipboard([file('a.pdf', 'application/pdf')]))),
    ).toBeFalsy();
  });

  it('leaves a paste of image files to the editor without an uploader', async () => {
    const { editor } = await setup('');
    expect(
      editor.view.someProp('handlePaste', (h) => h(editor.view, clipboard([file('a.png', 'image/png')]))),
    ).toBeFalsy();
  });

  it('uploads dropped image files at the drop position and ignores a move', async () => {
    const upload = jest.fn<ReturnType<MarkdownImageUploader>, [File]>(async () => ({ src: SRC, alt: 'x' }));
    const { editor, md } = await setup('Hallo', { upload });
    editor.view.posAtCoords = () => ({ pos: 1 });
    const handled = editor.view.someProp('handleDrop', (h) =>
      h(editor.view, dropEvent([file('x.gif', 'image/gif'), file('y.jpg', 'image/jpeg')]), null, false),
    );
    expect(handled).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(md()).toBe(`![x](${SRC})![x](${SRC})Hallo`);
    expect(
      editor.view.someProp('handleDrop', (h) => h(editor.view, dropEvent([file('x.gif', 'image/gif')]), null, true)),
    ).toBeFalsy();
    expect(
      editor.view.someProp('handleDrop', (h) => h(editor.view, dropEvent([file('x.txt', 'text/plain')]), null, false)),
    ).toBeFalsy();
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('inserts nothing for a failed upload or a foreign source', async () => {
    let n = 0;
    const upload: MarkdownImageUploader = async () => {
      n++;
      if (n === 1) throw new Error('413');
      return { src: 'https://example.org/x.png', alt: 'x' };
    };
    const { cmp, md } = await setup('', { upload });
    await expect(cmp.uploadImages([file('a.png', 'image/png'), file('b.png', 'image/png')])).resolves.toBe(0);
    expect(md()).toBe('');
    expect(cmp.uploading()).toBe(0);
  });

  it('does nothing without an uploader', async () => {
    const { cmp } = await setup('');
    await expect(cmp.uploadImages([file('a.png', 'image/png')])).resolves.toBe(0);
    const click = jest.spyOn(HTMLInputElement.prototype, 'click');
    cmp.pickImage();
    expect(click).not.toHaveBeenCalled();
    click.mockRestore();
  });

  it('opens a file dialog for images and uploads the chosen files', async () => {
    const upload: MarkdownImageUploader = async () => ({ src: SRC, alt: 'p' });
    const { cmp, md } = await setup('', { upload });
    const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    cmp.pickImage();
    expect(click).toHaveBeenCalledTimes(1);
    const input = click.mock.contexts[0] as HTMLInputElement;
    expect(input.accept).toBe('image/png,image/jpeg,image/gif,image/webp');
    Object.defineProperty(input, 'files', { value: [file('p.png', 'image/png')] });
    input.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));
    expect(md()).toBe(`![p](${SRC})`);
    click.mockRestore();
  });
});

describe('MarkdownEditorComponent links', () => {
  it('keeps web, mail and platform links through load and save', async () => {
    const src =
      'A [Seite](https://example.org/a?b=1&c=2) und [Mail](mailto:x@y.de) und [intern](/antraege/123) und [anker](#top)';
    const { pm, md } = await setup(src);
    expect(Array.from(pm.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual([
      'https://example.org/a?b=1&c=2',
      'mailto:x@y.de',
      '/antraege/123',
      '#top',
    ]);
    expect(md()).toBe(src);
  });

  it('keeps a link with marks and a title, an autolink and a link in a table cell', async () => {
    const src = '[**fett** Link](https://e.org "Titel") <https://auto.de>\n\n| L |\n| --- |\n| [x](/antraege/1) |';
    const { md } = await setup(src);
    expect(md()).toBe(src);
  });

  it('makes no link of a javascript or data target', async () => {
    const { pm, md } = await setup('[böse](javascript:alert(1)) [data](data:text/html,x)');
    expect(pm.querySelectorAll('a')).toHaveLength(0);
    expect(pm.textContent).toBe('[böse](javascript:alert(1)) [data](data:text/html,x)');
    // The brackets are escaped, so the saved text never becomes a link either.
    expect(md()).toBe('\\[böse\\](javascript:alert(1)) \\[data\\](data:text/html,x)');
  });

  it('sets and removes a link on the selection and refuses an unsafe target', async () => {
    const { cmp, editor, pm, md } = await setup('Antrag lesen');
    (editor.commands as unknown as { setTextSelection(r: { from: number; to: number }): void }).setTextSelection({ from: 1, to: 7 });
    expect(cmp.setLink('javascript:alert(1)')).toBe(false);
    expect(cmp.setLink('//evil.example')).toBe(false);
    expect(cmp.setLink(' /antraege/123 ')).toBe(true);
    expect(md()).toBe('[Antrag](/antraege/123) lesen');
    expect(cmp.setLink('https://example.org')).toBe(true);
    expect(md()).toBe('[Antrag](https://example.org) lesen');
    expect(cmp.unsetLink()).toBe(true);
    expect(md()).toBe('Antrag lesen');
    expect(pm.querySelectorAll('a')).toHaveLength(0);
  });

  it('inserts the target as its own label at an empty cursor', async () => {
    const { cmp, editor, md } = await setup('');
    editor.commands.focus('end');
    expect(cmp.setLink('mailto:stupa@example.org')).toBe(true);
    expect(md()).toBe('<mailto:stupa@example.org>');
  });

  it('sets no link while read-only', async () => {
    const { cmp } = await setup('Text', { disabled: true });
    expect(cmp.setLink('https://example.org')).toBe(false);
    expect(cmp.unsetLink()).toBe(false);
  });
});
