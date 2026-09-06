import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { MarkdownEditorComponent } from './markdown-editor.component';

@Component({
  standalone: true,
  imports: [MarkdownEditorComponent],
  template: `<app-markdown-editor
    [value]="value()"
    [docKey]="docKey()"
    [disabled]="disabled()"
    [placeholder]="placeholder()"
    (valueChange)="onChange($event)"
  />`,
})
class Host {
  readonly value = signal('');
  readonly docKey = signal('');
  readonly disabled = signal(false);
  readonly placeholder = signal('');
  readonly changes: string[] = [];
  onChange(v: string): void {
    this.changes.push(v);
  }
}

function editorEl(container: HTMLElement): HTMLElement {
  // Tiptap mounts a contenteditable ProseMirror node inside the host div.
  return container.querySelector('.ProseMirror') as HTMLElement;
}

describe('MarkdownEditorComponent', () => {
  it('builds a Tiptap editor mounted in the host element with initial value', async () => {
    const { container } = await render(Host, {
      componentProperties: {} as Partial<Host>,
    });
    const pm = editorEl(container);
    expect(pm).toBeTruthy();
    expect(pm.getAttribute('contenteditable')).toBe('true');
  });

  it('renders the provided initial markdown content', async () => {
    const { container } = await render(`<app-markdown-editor [value]="'# Titel'" />`, {
      imports: [MarkdownEditorComponent],
    });
    const pm = editorEl(container);
    expect(pm.textContent).toContain('Titel');
  });

  it('disables editing when [disabled] is true (initial)', async () => {
    const { container } = await render(`<app-markdown-editor [disabled]="true" />`, {
      imports: [MarkdownEditorComponent],
    });
    const pm = editorEl(container);
    expect(pm.getAttribute('contenteditable')).toBe('false');
  });

  it('toggles editability reactively via setEditable', async () => {
    const view = await render(Host);
    const pm = editorEl(view.container);
    expect(pm.getAttribute('contenteditable')).toBe('true');

    view.fixture.componentInstance.disabled.set(true);
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(pm.getAttribute('contenteditable')).toBe('false');

    view.fixture.componentInstance.disabled.set(false);
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(pm.getAttribute('contenteditable')).toBe('true');
  });

  it('marks the first line of an empty document with the placeholder', async () => {
    const { container } = await render(`<app-markdown-editor [placeholder]="'Schreib was…'" />`, {
      imports: [MarkdownEditorComponent],
    });
    const first = editorEl(container).querySelector('p.is-editor-empty');
    expect(first?.getAttribute('data-placeholder')).toBe('Schreib was…');
  });

  it('marks the empty last line of a document with content with the hint', async () => {
    const { container } = await render(
      `<app-markdown-editor [value]="'# Titel'" [placeholder]="'Leer'" [hint]="'Weiter …'" />`,
      { imports: [MarkdownEditorComponent] },
    );
    const pm = editorEl(container);
    expect(pm.querySelector('p.is-editor-empty')).toBeNull();
    const last = pm.querySelector('p.is-empty:last-child');
    expect(last?.getAttribute('data-placeholder')).toBe('Weiter …');
  });

  it('shows no hint while the editor is read-only', async () => {
    const { container } = await render(
      `<app-markdown-editor [value]="'# Titel'" [hint]="'Weiter …'" [disabled]="true" />`,
      { imports: [MarkdownEditorComponent] },
    );
    expect(editorEl(container).querySelector('p.is-empty')).toBeNull();
  });

  it('emits serialized markdown on user edits (onUpdate)', async () => {
    const view = await render(Host);
    const host = view.fixture.componentInstance;
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as MarkdownEditorComponent;
    // Drive the editor imperatively → triggers onUpdate → valueChange.
    const editor = (cmp as unknown as { editor: { commands: { setContent: (c: string) => void; insertContent: (c: string) => void } } })
      .editor;
    editor.commands.insertContent('Neuer Text');
    view.fixture.detectChanges();
    expect(host.changes.length).toBeGreaterThan(0);
    expect(host.changes.at(-1)).toContain('Neuer Text');
  });

  it('reloads content (without emitting) when docKey changes', async () => {
    const view = await render(Host);
    const host = view.fixture.componentInstance;
    host.value.set('Geladener Inhalt');
    host.docKey.set('doc-2');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    const pm = editorEl(view.container);
    expect(pm.textContent).toContain('Geladener Inhalt');
    // The synchronous `emitting` guard suppresses a valueChange that would
    // otherwise echo the freshly loaded document text back to the consumer.
    expect(host.changes).not.toContain('Geladener Inhalt');
  });

  it('does not reload content when docKey is unchanged but value changes', async () => {
    const view = await render(Host);
    const host = view.fixture.componentInstance;
    // No docKey change → editor keeps current (empty) content.
    host.value.set('Ignoriert weil docKey gleich');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    const pm = editorEl(view.container);
    expect(pm.textContent).not.toContain('Ignoriert');
  });

  it('destroys the editor on component teardown', async () => {
    const view = await render(Host);
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as MarkdownEditorComponent;
    const editor = (cmp as unknown as { editor: { isDestroyed: boolean } }).editor;
    view.fixture.destroy();
    expect(editor.isDestroyed).toBe(true);
    expect((cmp as unknown as { editor: unknown }).editor).toBeNull();
  });

  it('toMarkdown returns empty string when the markdown storage is absent', async () => {
    const view = await render(Host);
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as MarkdownEditorComponent;
    const fakeEditor = { storage: {} } as unknown as Parameters<
      (typeof cmp)['toMarkdown' & keyof typeof cmp]
    >[0];
    const md = (
      cmp as unknown as { toMarkdown: (e: unknown) => string }
    ).toMarkdown(fakeEditor);
    expect(md).toBe('');
  });

  describe('vote callout card', () => {
    const md = '# TOP\n\nText davor.\n\n> [!abstimmung] **Wird der Antrag angenommen?**\n> yes: 3, no: 1, abstain: 0\n\nText danach.';

    function markdownOf(view: { fixture: { debugElement: { children: { componentInstance: unknown }[] } } }): string {
      const cmp = view.fixture.debugElement.children[0].componentInstance as {
        editor: { storage: { markdown: { getMarkdown: () => string } } };
      };
      return cmp.editor.storage.markdown.getMarkdown();
    }

    it('renders the callout as a card with question and tally', async () => {
      const { container } = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md },
      });
      const card = container.querySelector('.mde__vote') as HTMLElement;
      expect(card).toBeTruthy();
      expect(card.dataset['result']).toBe('passed');
      expect(card.querySelector('.mde__voteKind')?.textContent).toBe('Abstimmung');
      expect(card.querySelector('.mde__voteQ')?.textContent).toBe('Wird der Antrag angenommen?');
      expect(card.querySelector('.mde__voteTally')?.textContent).toBe('Ja 3 · Nein 1 · Enthaltung 0');
      expect(container.querySelector('blockquote')).toBeNull();
    });

    it('writes the callout back line for line', async () => {
      const view = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md },
      });
      expect(markdownOf(view)).toBe(md);
    });

    it('marks a rejected vote, keeps other lines as body and leaves other callouts alone', async () => {
      const { container } = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: {
          md: '> [!vote] Frage\n> Hinweis zur Abstimmung\n> ja 1, nein 2\n\n> [!beschluss] Beschlossen\n\n> Zitat',
        },
      });
      const card = container.querySelector('.mde__vote') as HTMLElement;
      expect(card.dataset['result']).toBe('rejected');
      expect(card.querySelector('.mde__voteKind')?.textContent).toBe('Vote');
      expect(card.querySelector('.mde__voteBody')?.textContent).toBe('Hinweis zur Abstimmung');
      expect(container.querySelectorAll('blockquote')).toHaveLength(2);
    });

    it('treats a marker without a tally as open and a tie as a tie', async () => {
      const { container } = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md: '> [!abstimmung] Offen\n\n> [!abstimmung] Patt\n> ja: 2, nein: 2' },
      });
      const cards = container.querySelectorAll('.mde__vote');
      expect((cards[0] as HTMLElement).dataset['result']).toBe('none');
      expect(cards[0].querySelector('.mde__voteTally')).toBeNull();
      expect((cards[1] as HTMLElement).dataset['result']).toBe('tie');
    });
  });

  describe('math', () => {
    function markdownOf(view: { fixture: { debugElement: { children: { componentInstance: unknown }[] } } }): string {
      const cmp = view.fixture.debugElement.children[0].componentInstance as {
        editor: { storage: { markdown: { getMarkdown: () => string } } };
      };
      return cmp.editor.storage.markdown.getMarkdown();
    }

    it('renders inline and block formulas with KaTeX and writes the dollars back', async () => {
      const md = 'Die Fläche ist $a^2 + b^2$ groß.\n\n$$\nE = mc^2\n$$\n\nDanach.';
      const view = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md },
      });
      const pm = editorEl(view.container);
      const inline = pm.querySelector('span.tiptap-mathematics-render') as HTMLElement;
      expect(inline?.getAttribute('data-latex')).toBe('a^2 + b^2');
      expect(inline.querySelector('.katex')).toBeTruthy();
      const block = pm.querySelector('div.tiptap-mathematics-render') as HTMLElement;
      expect(block?.getAttribute('data-latex')).toBe('E = mc^2');
      expect(markdownOf(view)).toBe(md);
    });

    it('reads a one-line block and leaves prices alone', async () => {
      const md = '$$ x = 1 $$\n\nKostet $5 und $6 pro Stück.';
      const view = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md },
      });
      const pm = editorEl(view.container);
      expect(pm.querySelector('div.tiptap-mathematics-render')?.getAttribute('data-latex')).toBe('x = 1');
      expect(pm.querySelectorAll('span.tiptap-mathematics-render')).toHaveLength(0);
      expect(pm.textContent).toContain('Kostet $5 und $6 pro Stück.');
      expect(markdownOf(view)).toBe('$$\nx = 1\n$$\n\nKostet $5 und $6 pro Stück.');
    });

    it('keeps an unclosed formula and a spaced dollar as text', async () => {
      const md = 'Offen $a + b und $ x$ bleiben Text.';
      const { container } = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md },
      });
      expect(editorEl(container).querySelectorAll('.tiptap-mathematics-render')).toHaveLength(0);
    });
  });

  it('toMarkdown reads getMarkdown from the storage when present', async () => {
    const view = await render(Host);
    const cmp = view.fixture.debugElement.children[0]
      .componentInstance as MarkdownEditorComponent;
    const fakeEditor = {
      storage: { markdown: { getMarkdown: () => '**bold**' } },
    };
    const md = (
      cmp as unknown as { toMarkdown: (e: unknown) => string }
    ).toMarkdown(fakeEditor);
    expect(md).toBe('**bold**');
  });
});
