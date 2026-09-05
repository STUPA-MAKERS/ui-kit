import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  type OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

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
          ],
          content: this.value(),
          editable: !disabled,
          onUpdate: ({ editor }) => {
            if (this.emitting) return;
            this.valueChange.emit(this.toMarkdown(editor));
          },
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
