import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  type OnDestroy,
  ViewEncapsulation,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { BlockMathMarkdown, InlineMathMarkdown } from './math.extension';
import { VoteCallout } from './vote-callout.extension';

// A formula with an error shows the source in red instead of failing the render.
const KATEX_OPTIONS = { throwOnError: false };

/**
 * A format that a toolbar of the consumer can switch: a heading (level 2, because level 1
 * is the heading of the document), bold, italic and a bullet list.
 */
export type MarkdownFormat = 'heading' | 'bold' | 'italic' | 'bulletList';

const FORMATS: readonly MarkdownFormat[] = ['heading', 'bold', 'italic', 'bulletList'];

/** The node or mark name and the attributes that `isActive` checks for a format. */
const ACTIVE_CHECK: Record<MarkdownFormat, { name: string; attrs?: Record<string, unknown> }> = {
  heading: { name: 'heading', attrs: { level: 2 } },
  bold: { name: 'bold' },
  italic: { name: 'italic' },
  bulletList: { name: 'bulletList' },
};

/**
 * WYSIWYG-Markdown-Editor (Tiptap) im Stil von Nextcloud Collectives: man tippt
 * Markdown-Kürzel (`# `, `- `, `**fett**`) und sieht **sofort** das gerenderte
 * Ergebnis — kein separater Vorschau-Bereich. Ein- und Ausgabe sind Markdown.
 *
 * Imperativ angebunden: Tiptap mountet in das Host-`div`. ``docKey`` identifiziert
 * das aktuell editierte Dokument (z. B. ein TOP); ändert es sich, wird der Inhalt
 * neu geladen, ohne die Eingabe während des Tippens zu überschreiben.
 */
@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Tiptap creates the editor nodes outside the Angular template, so the emulated
  // scope attribute never reaches them. Every rule is prefixed with `.mde__host` or
  // the element name instead.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
})
export class MarkdownEditorComponent implements OnDestroy {
  /** Anfangs-/Soll-Markdown des aktuellen Dokuments. */
  readonly value = input<string>('');
  /** Dokument-Schlüssel: ändert er sich, wird ``value`` neu in den Editor geladen. */
  readonly docKey = input<string>('');
  readonly disabled = input<boolean>(false);
  /** Text of the empty document. */
  readonly placeholder = input<string>('');
  /**
   * Text of the empty last line of a document that has content. It shows where the
   * writing continues, the way Nextcloud Collectives does it. Empty means no hint.
   */
  readonly hint = input<string>('');

  /** Emittiert das serialisierte Markdown bei jeder Änderung. */
  readonly valueChange = output<string>();

  /**
   * The formats at the cursor or on the selection. A toolbar of the consumer reads it to
   * show a format button as pressed. It changes with every transaction of the editor.
   */
  readonly activeFormats = signal<ReadonlySet<MarkdownFormat>>(new Set());

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private editor: Editor | null = null;
  private loadedKey: string | null = null;
  private emitting = false;

  constructor() {
    // Editor lazy aufbauen, sobald das Host-Element existiert, und auf
    // docKey/disabled reagieren.
    effect(() => {
      const el = this.host().nativeElement;
      const key = this.docKey();
      const disabled = this.disabled();
      if (!this.editor) {
        this.editor = new Editor({
          element: el,
          extensions: [
            StarterKit,
            Markdown.configure({ html: false }),
            // Every empty paragraph gets the text as `data-placeholder`. The styles
            // show it on the first line of an empty document and on the last line
            // of a document with content, and only while the editor is editable.
            Placeholder.configure({
              showOnlyCurrent: false,
              placeholder: ({ editor }) => (editor.isEmpty ? this.placeholder() : this.hint()),
            }),
            VoteCallout,
            InlineMathMarkdown.configure({ katexOptions: KATEX_OPTIONS }),
            BlockMathMarkdown.configure({ katexOptions: KATEX_OPTIONS }),
          ],
          content: this.value(),
          editable: !disabled,
          onUpdate: ({ editor }) => {
            if (this.emitting) return;
            this.valueChange.emit(this.toMarkdown(editor));
          },
          onTransaction: ({ editor }) => this.readFormats(editor),
        });
        this.loadedKey = key;
        this.ensureTrailingLine();
        return;
      }
      this.editor.setEditable(!disabled);
      // Dokument gewechselt → Inhalt neu laden (ohne valueChange auszulösen).
      if (key !== this.loadedKey) {
        this.loadedKey = key;
        this.emitting = true;
        this.editor.commands.setContent(this.value());
        this.emitting = false;
        this.ensureTrailingLine();
      }
    });
  }

  /**
   * Switch a format at the cursor or on the selection, as the Markdown shortcuts do. The
   * edit goes through the normal update path, so `valueChange` emits the new Markdown. A
   * read-only editor does nothing.
   */
  toggleFormat(format: MarkdownFormat): void {
    const editor = this.editor;
    if (!editor || !editor.isEditable) return;
    const chain = editor.chain().focus();
    switch (format) {
      case 'heading':
        chain.toggleHeading({ level: 2 }).run();
        break;
      case 'bold':
        chain.toggleBold().run();
        break;
      case 'italic':
        chain.toggleItalic().run();
        break;
      case 'bulletList':
        chain.toggleBulletList().run();
        break;
    }
  }

  /** Read the formats at the cursor into `activeFormats`. */
  private readFormats(editor: Editor): void {
    const next = new Set(
      FORMATS.filter((f) => editor.isActive(ACTIVE_CHECK[f].name, ACTIVE_CHECK[f].attrs ?? {})),
    );
    const prev = this.activeFormats();
    if (FORMATS.every((f) => next.has(f) === prev.has(f))) return;
    this.activeFormats.set(next);
  }

  /**
   * End the document with an empty paragraph. `TrailingNode` adds it on the first
   * edit only, so a freshly loaded document would show no line to continue on.
   */
  private ensureTrailingLine(): void {
    const editor = this.editor;
    if (!editor) return;
    const last = editor.state.doc.lastChild;
    if (last?.type.name === 'paragraph' && last.content.size === 0) return;
    const paragraph = editor.schema.nodes['paragraph'].create();
    this.emitting = true;
    editor.view.dispatch(editor.state.tr.insert(editor.state.doc.content.size, paragraph));
    this.emitting = false;
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }

  /** Markdown aus dem Tiptap-Markdown-Storage holen (untypisiert in Tiptap). */
  private toMarkdown(editor: Editor): string {
    const storage = editor.storage as unknown as Record<
      string,
      { getMarkdown?: () => string }
    >;
    return storage['markdown']?.getMarkdown?.() ?? '';
  }
}
