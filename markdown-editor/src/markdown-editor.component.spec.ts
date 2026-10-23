import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { MarkdownEditorComponent } from './markdown-editor.component';
import { parseElection, parsePoll, type VoteCalloutResolver } from './vote-callout.extension';

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

  it('emits no change when the document switches or the editability toggles', async () => {
    const view = await render(Host);
    const host = view.fixture.componentInstance;
    host.value.set('Text A');
    host.docKey.set('a');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    // The next document: the text of the old one must not go out as its change.
    host.value.set('Text B');
    host.docKey.set('b');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    host.disabled.set(true);
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    host.value.set('Text C');
    host.docKey.set('c');
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(host.changes).toEqual([]);
    expect(editorEl(view.container).textContent).toContain('Text C');
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

  it('marks the line of the cursor while focused, so the hint follows the cursor', async () => {
    const view = await render(
      `<app-markdown-editor [value]="'# Titel'" [placeholder]="'Leer'" [hint]="'Weiter …'" />`,
      { imports: [MarkdownEditorComponent] },
    );
    const cmp = view.fixture.debugElement.children[0].componentInstance as unknown as {
      editor: {
        commands: {
          setContent(doc: unknown): void;
          focus(pos: number): void;
        };
      };
    };
    const p = (text?: string): unknown => ({
      type: 'paragraph',
      ...(text ? { content: [{ type: 'text', text }] } : {}),
    });
    cmp.editor.commands.setContent({ type: 'doc', content: [p('A'), p(), p('B'), p()] });
    // Inside the empty second paragraph: A takes 0..3, the empty paragraph 3..5.
    cmp.editor.commands.focus(4);
    // The focus command moves the DOM focus in the next animation frame.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const pm = editorEl(view.container);
    const lines = Array.from(pm.querySelectorAll('p'));
    expect(pm.classList.contains('ProseMirror-focused')).toBe(true);
    expect(lines.map((l) => l.classList.contains('has-focus'))).toEqual([false, true, false, false]);
    expect(lines[1].classList.contains('is-empty')).toBe(true);
    expect(lines[1].getAttribute('data-placeholder')).toBe('Weiter …');
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

  describe('format commands for a toolbar', () => {
    function editorOf(view: { fixture: { debugElement: { children: { componentInstance: unknown }[] } } }) {
      return view.fixture.debugElement.children[0].componentInstance as MarkdownEditorComponent;
    }

    it('switches bold, italic, a heading and a bullet list and reports them as active', async () => {
      const view = await render(Host);
      const host = view.fixture.componentInstance;
      const cmp = editorOf(view);
      const editor = (
        cmp as unknown as {
          editor: {
            commands: {
              insertContent: (c: string) => void;
              selectAll: () => void;
              setTextSelection: (pos: number) => void;
            };
          };
        }
      ).editor;
      editor.commands.insertContent('Rückfragen');
      editor.commands.selectAll();

      cmp.toggleFormat('bold');
      expect(cmp.activeFormats().has('bold')).toBe(true);
      expect(host.changes.at(-1)).toContain('**Rückfragen**');
      cmp.toggleFormat('bold');
      expect(cmp.activeFormats().has('bold')).toBe(false);

      cmp.toggleFormat('italic');
      expect(cmp.activeFormats().has('italic')).toBe(true);
      cmp.toggleFormat('italic');

      // A block format reads the block at the cursor; the whole document also holds the
      // empty trailing line.
      editor.commands.setTextSelection(3);
      cmp.toggleFormat('heading');
      expect(cmp.activeFormats().has('heading')).toBe(true);
      expect(host.changes.at(-1)).toContain('## Rückfragen');
      cmp.toggleFormat('heading');
      expect(cmp.activeFormats().has('heading')).toBe(false);

      cmp.toggleFormat('bulletList');
      expect(cmp.activeFormats().has('bulletList')).toBe(true);
      expect(host.changes.at(-1)).toContain('- Rückfragen');
    });

    it('does nothing while the editor is read-only', async () => {
      const view = await render(Host);
      const host = view.fixture.componentInstance;
      host.disabled.set(true);
      view.fixture.detectChanges();
      await view.fixture.whenStable();
      const cmp = editorOf(view);
      const before = host.changes.length;
      cmp.toggleFormat('bold');
      expect(host.changes.length).toBe(before);
      expect(cmp.activeFormats().size).toBe(0);
    });

    it('does nothing before the editor exists or after it is gone', async () => {
      const view = await render(Host);
      const cmp = editorOf(view);
      view.fixture.destroy();
      expect(() => cmp.toggleFormat('italic')).not.toThrow();
    });
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
      const cells = [...card.querySelectorAll('.mde__voteCell')].map((c) => c.textContent);
      expect(cells).toEqual(['Ja3', 'Nein1', 'Enthaltung0']);
      // Without info the card names no result: only the consumer knows the majority rule.
      expect(card.querySelector('.mde__voteResult')).toBeNull();
      expect(card.querySelectorAll('.mde__voteSeg')).toHaveLength(2);
      expect(container.querySelector('blockquote')).toBeNull();
    });

    it('takes the caption, the labels and the result from the resolver', async () => {
      const seen: string[] = [];
      const resolve: VoteCalloutResolver = (question) => {
        seen.push(question);
        return {
          caption: 'Beschluss · 18:52 · Einfache Mehrheit',
          result: { label: 'Abgelehnt', tone: 'rejected' },
          labels: { yes: 'Yes', no: 'No', abstain: 'Abstain', result: 'Result' },
        };
      };
      const { container } = await render(`<app-markdown-editor [value]="md" [voteInfo]="resolve" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md, resolve },
      });
      const card = container.querySelector('.mde__vote') as HTMLElement;
      expect(seen).toContain('Wird der Antrag angenommen?');
      expect(card.dataset['result']).toBe('rejected');
      expect(card.querySelector('.mde__voteKind')?.textContent).toBe('Beschluss · 18:52 · Einfache Mehrheit');
      const cells = [...card.querySelectorAll('.mde__voteCell')].map((c) => c.textContent);
      expect(cells).toEqual(['Yes3', 'No1', 'Abstain0', 'ResultAbgelehnt']);
    });

    it('renders the cards again when the resolver changes', async () => {
      const view = await render(`<app-markdown-editor [value]="md" [voteInfo]="resolve" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md, resolve: null as VoteCalloutResolver | null },
      });
      expect(view.container.querySelector('.mde__voteResult')).toBeNull();
      view.fixture.componentInstance.resolve = () => ({ result: { label: 'Angenommen', tone: 'passed' } });
      view.fixture.detectChanges();
      await view.fixture.whenStable();
      expect(view.container.querySelector('.mde__voteResult')?.textContent).toBe('Angenommen');
      expect((view.container.querySelector('.mde__vote') as HTMLElement).dataset['result']).toBe('passed');
    });

    it('shows the plain card when the resolver fails', async () => {
      const resolve: VoteCalloutResolver = () => {
        throw new Error('boom');
      };
      const { container } = await render(`<app-markdown-editor [value]="md" [voteInfo]="resolve" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md, resolve },
      });
      expect(container.querySelector('.mde__voteKind')?.textContent).toBe('Abstimmung');
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
      expect(cards[0].querySelector('.mde__voteCounts')).toBeNull();
      expect((cards[1] as HTMLElement).dataset['result']).toBe('tie');
    });

    const election =
      '> [!abstimmung] **Wahl des Vorsitzes**\n> Wahl · 2 Posten\n' +
      '> Mara: 9 · Ben: 4 · Selin: 7 · Enthaltungen: 1\n> Gewählt: Mara, Selin';

    it('shows an election as a ranking with the seat line', async () => {
      const resolve: VoteCalloutResolver = () => ({
        caption: 'Wahl · 2 Posten · 12:05',
        result: { label: 'Gewählt', tone: 'passed' },
      });
      const view = await render(`<app-markdown-editor [value]="md" [voteInfo]="resolve" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md: election, resolve },
      });
      const card = view.container.querySelector('.mde__vote') as HTMLElement;
      expect(card.querySelector('.mde__voteKind')?.textContent).toBe('Wahl · 2 Posten · 12:05');
      expect(card.querySelector('.mde__voteStatus')?.textContent).toBe('Gewählt');
      const names = [...card.querySelectorAll('.mde__elName')].map((n) => n.textContent);
      expect(names).toEqual(['Mara', 'Selin', 'Ben', 'Enthaltungen']);
      const elected = [...card.querySelectorAll('.mde__elRow--elected .mde__elName')];
      expect(elected.map((n) => n.textContent)).toEqual(['Mara', 'Selin']);
      expect(card.querySelectorAll('.mde__elLine')).toHaveLength(1);
      const fills = [...card.querySelectorAll<HTMLElement>('.mde__elFill')].map((f) => f.style.width);
      expect(fills[0]).toBe('100%');
      expect(card.querySelector('.mde__voteBody')).toBeNull();
      expect(markdownOf(view)).toBe(election);
    });

    it('shows the public form and a pending lot', async () => {
      const { container } = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: {
          md:
            '> [!abstimmung] **A**\n> Wahl · 1 Posten\n> Gewählt: Hannah\n> 3 weitere Kandidierende\n\n' +
            '> [!abstimmung] **B**\n> Wahl · 1 Posten\n> Ben: 6 · Amira: 6 · Enthaltungen: 0\n' +
            '> Gewählt: niemand\n> Gleichstand: das Los steht aus.',
        },
      });
      const [pub, lot] = [...container.querySelectorAll('.mde__vote')];
      expect(pub.querySelector('.mde__voteKind')?.textContent).toBe('Wahl · 1 Posten');
      expect(pub.querySelector('.mde__elRow--public .mde__elName')?.textContent).toBe('Hannah');
      expect(pub.querySelector('.mde__voteBody')?.textContent).toBe('3 weitere Kandidierende');
      expect(lot.querySelector('.mde__elTag--warn')?.textContent).toBe('Los steht aus');
      expect(lot.querySelectorAll('.mde__elRow--elected')).toHaveLength(0);
      expect(lot.querySelector('.mde__elLine')).toBeNull();
    });
    const poll =
      '> [!abstimmung] **Wohin geht der Ausflug?**\n> Umfrage · Einzelwahl\n' +
      '> Freiburg: 7\n> Konstanz: 7\n> Tübingen: 2\n> Enthaltungen: 1\n' +
      '> Meiste Stimmen: Freiburg, Konstanz\n> 17 Antworten · Meinungsbild, kein Beschluss';

    it('shows a poll as a ranking and marks every best option', async () => {
      const view = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md: poll },
      });
      const card = view.container.querySelector('.mde__vote') as HTMLElement;
      expect(card.dataset['poll']).toBe('single');
      expect(card.querySelector('.mde__voteKind')?.textContent).toBe('Umfrage · Einzelwahl');
      const names = [...card.querySelectorAll('.mde__elName')].map((n) => n.textContent);
      expect(names).toEqual(['Freiburg', 'Konstanz', 'Tübingen', 'Enthaltungen']);
      const top = [...card.querySelectorAll('.mde__pollRow--top .mde__elName')];
      expect(top.map((n) => n.textContent)).toEqual(['Freiburg', 'Konstanz']);
      expect(card.querySelectorAll('.mde__pollRow--top svg')).toHaveLength(2);
      expect(card.querySelector('.mde__pollTop')?.textContent).toBe('meiste Stimmen');
      const fills = [...card.querySelectorAll<HTMLElement>('.mde__elFill')].map((f) => f.style.width);
      expect(fills).toEqual(['100%', '100%', `${(2 / 7) * 100}%`]);
      expect(card.querySelector('.mde__elRow--abstain .mde__elNum')?.textContent).toBe('1');
      expect(card.querySelector('.mde__pollFoot')?.textContent).toBe(
        '17 Antworten · Meinungsbild, kein Beschluss',
      );
      expect(card.querySelector('.mde__voteBody')).toBeNull();
      expect(card.querySelector('.mde__pollLegend')).toBeNull();
      expect(markdownOf(view)).toBe(poll);
    });

    it('shows a date poll with stacked bars and an open poll with its kind only', async () => {
      const dates =
        '> [!abstimmung] **Wann?**\n> Terminumfrage\n' +
        '> Mi, 4.11. · 17:00–19:00: 6 (+3)\n> Di, 3.11. · 18:00–20:00: 5 (+0)\n' +
        '> Zahl = Ja, (+n) = Vielleicht\n> Bester Termin: Mi, 4.11. · 17:00–19:00\n' +
        '> 10 Antworten · Meinungsbild, kein Beschluss\n\n' +
        '> [!abstimmung] **Offen?**\n> Umfrage · Mehrfachwahl, höchstens 2';
      const view = await render(`<app-markdown-editor [value]="md" />`, {
        imports: [MarkdownEditorComponent],
        componentProperties: { md: dates },
      });
      const [date, open] = [...view.container.querySelectorAll<HTMLElement>('.mde__vote')];
      expect(date.dataset['poll']).toBe('date');
      const nums = [...date.querySelectorAll('.mde__elNum')].map((n) => n.textContent);
      expect(nums).toEqual(['6 + 3', '5 + 0']);
      const maybe = [...date.querySelectorAll<HTMLElement>('.mde__pollMaybe')];
      expect(maybe.map((m) => m.style.width)).toEqual([`${(3 / 9) * 100}%`]);
      expect(date.querySelector('.mde__pollTop')?.textContent).toBe('bester Termin');
      expect(date.querySelector('.mde__pollLegend')?.textContent).toBe('JaVielleicht');
      expect(date.querySelector('.mde__elRow--abstain')).toBeNull();
      expect(open.dataset['poll']).toBe('multi');
      expect(open.querySelector('.mde__voteKind')?.textContent).toBe('Umfrage · Mehrfachwahl, höchstens 2');
      expect(open.querySelector('.mde__elRows')).toBeNull();
      expect(open.querySelector('.mde__pollFoot')).toBeNull();
      expect(markdownOf(view)).toBe(dates);
    });
  });

  describe('parsePoll', () => {
    it('splits the best options at the known labels and keeps a label with a comma whole', () => {
      const card = parsePoll([
        'Umfrage · Mehrfachwahl',
        'Ja: 5',
        'Nein, danke: 5',
        'Nein: 1',
        'Ein Hinweis',
        'Meiste Stimmen: Ja, Nein, danke',
      ]);
      expect(card?.rows.map((r) => [r.label, r.top])).toEqual([
        ['Ja', true],
        ['Nein, danke', true],
        ['Nein', false],
      ]);
      expect(card?.notes).toEqual(['Ein Hinweis']);
      expect(card?.abstentions).toBeNull();
    });

    it('reads no poll without the kind line', () => {
      expect(parsePoll([])).toBeNull();
      expect(parsePoll(['Umfrage zur Mensa', 'Freiburg: 7'])).toBeNull();
      expect(parsePoll(['Umfrage · Einzelwahl', 'Meiste Stimmen: X'])?.rows).toEqual([]);
    });
  });

  describe('parseElection', () => {
    it('keeps a name with a comma whole and the elected first within a tie', () => {
      const card = parseElection([
        'Wahl · 2 Posten',
        'Krüger, Ben: 6 · Amira: 6 · Finn: 3 · Enthaltungen: 0',
        'Gewählt: Amira, Krüger, Ben',
        'Durch Los entschieden.',
        'Stichwahl (2. Wahlgang) um 1 Posten: X, Y',
      ]);
      expect(card?.rows.map((r) => [r.name, r.elected])).toEqual([
        ['Krüger, Ben', true],
        ['Amira', true],
        ['Finn', false],
      ]);
      expect(card?.lot).toBe('drawn');
      expect(card?.notes).toEqual(['Stichwahl (2. Wahlgang) um 1 Posten: X, Y']);
    });

    it('reads no ranking without the seat line or with a single candidate', () => {
      expect(parseElection(['Anna: 3'])).toBeNull();
      expect(parseElection(['Wahl · 1 Posten', 'Kandidatur: Anna'])).toBeNull();
      expect(parseElection(['Wahl · 1 Posten', 'Gewählt: niemand'])?.elected).toEqual([]);
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

    interface TypingView {
      state: { selection: { from: number }; tr: { insertText: (t: string, a: number, b: number) => unknown } };
      dispatch: (tr: unknown) => void;
      someProp: (
        name: string,
        fn: (handler: (v: unknown, from: number, to: number, text: string) => boolean) => boolean,
      ) => boolean | undefined;
    }

    /** Type the text character by character, the way the browser feeds an editor. */
    async function typeIntoEditor(text: string): Promise<HTMLElement> {
      const view = await render(`<app-markdown-editor />`, { imports: [MarkdownEditorComponent] });
      const cmp = view.fixture.debugElement.children[0].componentInstance as {
        editor: { view: TypingView };
      };
      const ev = cmp.editor.view;
      for (const char of text) {
        const pos = ev.state.selection.from;
        const handled = ev.someProp('handleTextInput', (handler) => handler(ev, pos, pos, char));
        if (!handled) ev.dispatch(ev.state.tr.insertText(char, pos, pos));
      }
      return editorEl(view.container);
    }

    it('turns a typed $…$ into a formula', async () => {
      const pm = await typeIntoEditor('Die Fläche ist $a^2$ groß.');
      const inline = pm.querySelector('span.tiptap-mathematics-render') as HTMLElement;
      expect(inline?.getAttribute('data-latex')).toBe('a^2');
    });

    it('turns a typed $$…$$ line into a block formula', async () => {
      const pm = await typeIntoEditor('$$E = mc^2$$');
      const block = pm.querySelector('div.tiptap-mathematics-render') as HTMLElement;
      expect(block?.getAttribute('data-latex')).toBe('E = mc^2');
      expect(pm.querySelectorAll('span.tiptap-mathematics-render')).toHaveLength(0);
    });

    it('does not turn a typed price into a formula', async () => {
      const pm = await typeIntoEditor('Kostet $5 und $6 pro Stück.');
      expect(pm.querySelectorAll('.tiptap-mathematics-render')).toHaveLength(0);
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
