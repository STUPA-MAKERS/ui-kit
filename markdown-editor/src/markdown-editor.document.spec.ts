import { render } from '@testing-library/angular';
import {
  MarkdownEditorComponent,
  type MarkdownDocumentInfo,
  type MarkdownDocumentUploader,
} from './markdown-editor.component';
import { type MarkdownDocumentRef, documentLabel, isMediaDocumentSrc } from './document.extension';

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';
const SRC = `/api/media/documents/${ID}`;

interface EditorLike {
  storage: { markdown: { getMarkdown: () => string } };
  commands: { insertContent(c: string): void };
  view: { someProp: (name: string, fn: (h: (...a: unknown[]) => boolean) => boolean) => boolean | undefined };
}

async function setup(md: string, extra: Record<string, unknown> = {}) {
  const opened: MarkdownDocumentRef[] = [];
  const view = await render(
    `<app-markdown-editor [value]="md" [documentUpload]="upload" [documentInfo]="info"
       (documentOpen)="opened.push($event)" />`,
    {
      imports: [MarkdownEditorComponent],
      componentProperties: { md, upload: null, info: null, opened, ...extra },
    },
  );
  const cmp = view.fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
  const editor = (cmp as unknown as { editor: EditorLike }).editor;
  const pm = view.container.querySelector('.ProseMirror') as HTMLElement;
  return { cmp, editor, pm, opened, md: () => editor.storage.markdown.getMarkdown() };
}

function clipboard(files: File[]): ClipboardEvent {
  const event = new Event('paste') as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', { value: { files, getData: () => '' } });
  return event;
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('MarkdownEditorComponent embedded PDF', () => {
  it('shows the reference as a badge with the page count and writes it back', async () => {
    const info: MarkdownDocumentInfo = async (src) => (src === SRC ? 4 : null);
    const src = `Siehe [Haushaltsplan.pdf](${SRC}) hier.`;
    const { pm, md } = await setup(src, { info });
    await tick();
    const badge = pm.querySelector('.mde-doc') as HTMLElement;
    expect(badge.getAttribute('role')).toBe('button');
    expect(badge.getAttribute('aria-label')).toBe('PDF öffnen: Haushaltsplan.pdf');
    expect(badge.querySelector('.mde-doc__name')?.textContent).toBe('Haushaltsplan.pdf');
    expect(badge.querySelector('.mde-doc__pages')?.textContent).toBe('4 Seiten');
    expect(badge.querySelector('svg')).not.toBeNull();
    expect(md()).toBe(src);
  });

  it('keeps another link a link', async () => {
    const src = `[x](https://example.org) [y](${SRC}/x)`;
    const { pm, md } = await setup(src);
    expect(pm.querySelector('.mde-doc')).toBeNull();
    expect(pm.querySelectorAll('a')).toHaveLength(2);
    expect(md()).toBe(src);
  });

  it('opens the PDF on a click and on Enter', async () => {
    const { pm, opened } = await setup(`[Angebot.pdf](${SRC})`);
    const badge = pm.querySelector('.mde-doc') as HTMLElement;
    badge.click();
    badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    badge.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(opened).toEqual([
      { src: SRC, name: 'Angebot.pdf' },
      { src: SRC, name: 'Angebot.pdf' },
    ]);
  });

  it('uploads a pasted PDF and inserts its badge', async () => {
    const upload: MarkdownDocumentUploader = async (f) => ({ src: SRC, name: f.name });
    const { cmp, editor, md } = await setup('', { upload });
    const handled = editor.view.someProp('handlePaste', (h) =>
      h(editor.view, clipboard([new File(['x'], 'Angebot [neu].pdf', { type: 'application/pdf' })])),
    );
    expect(handled).toBe(true);
    await tick();
    await tick();
    expect(md()).toBe(`[Angebot \\[neu\\].pdf](${SRC}) `);
    expect(cmp.uploading()).toBe(0);
  });

  it('leaves a pasted PDF to the editor without an uploader, and refuses another path', async () => {
    const { cmp, editor } = await setup('');
    const handled = editor.view.someProp('handlePaste', (h) =>
      h(editor.view, clipboard([new File(['x'], 'a.pdf', { type: 'application/pdf' })])),
    );
    expect(handled).toBeFalsy();
    expect(cmp.insertDocument('/api/media/images/' + ID, 'a.pdf')).toBe(false);
    expect(cmp.insertDocument(SRC, 'a.pdf')).toBe(true);
  });

  it('inserts nothing when the upload fails', async () => {
    const upload: MarkdownDocumentUploader = () => Promise.reject(new Error('415'));
    const { cmp, md } = await setup('', { upload });
    await expect(cmp.uploadDocuments([new File(['x'], 'a.pdf', { type: 'application/pdf' })])).resolves.toBe(0);
    expect(md()).toBe('');
    expect(cmp.uploading()).toBe(0);
  });

  it('checks the path and escapes a raw label', () => {
    expect(isMediaDocumentSrc(SRC)).toBe(true);
    expect(isMediaDocumentSrc(`${SRC}?x`)).toBe(false);
    expect(documentLabel('a [b] \\ c')).toBe('a \\[b\\] \\\\ c');
  });
});
