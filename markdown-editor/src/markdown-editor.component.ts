import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  IconComponent,
  RowMenuComponent,
  UiKitTranslatePipe,
  type RowMenuItem,
  type RowMenuSection,
  type UiKitTextKey,
  UI_KIT_INTL,
} from '@stupa-makers/ui-kit';
import { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';
import { Focus, Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { BlockMathMarkdown, InlineMathMarkdown } from './math.extension';
import {
  IMAGE_UPLOAD_TYPES,
  MarkdownImage,
  MarkdownTable,
  MarkdownTableCell,
  MarkdownTableHeader,
  MarkdownTableRow,
  isMediaImageSrc,
  stripForeignImages,
} from './media.extension';
import { type TableControls, appendToTable, measureTableControls } from './table-controls';
import {
  VoteCallout,
  type VoteCalloutResolver,
  type VoteCalloutView,
} from './vote-callout.extension';

// A formula with an error shows the source in red instead of failing the render.
const KATEX_OPTIONS = { throwOnError: false };

/**
 * A format that a toolbar of the consumer can switch: a heading (level 2, because level 1
 * is the heading of the document), bold, italic and a bullet list.
 */
export type MarkdownFormat = 'heading' | 'bold' | 'italic' | 'bulletList';

const FORMATS: readonly MarkdownFormat[] = ['heading', 'bold', 'italic', 'bulletList'];

/** An image that an upload stored: its canonical path and its alt text. */
export interface MarkdownImageRef {
  src: string;
  alt: string;
}

/**
 * Upload one image file and resolve to its reference. The uploader reports its own
 * errors to the user; a rejected promise inserts nothing.
 */
export type MarkdownImageUploader = (file: File) => Promise<MarkdownImageRef>;

/** An edit of the table at the cursor, for a toolbar of the consumer. */
export type MarkdownTableCommand =
  | 'addRowBefore'
  | 'addRowAfter'
  | 'addColumnBefore'
  | 'addColumnAfter'
  | 'deleteRow'
  | 'deleteColumn'
  | 'deleteTable';

/** One item of a table menu: its command, its text and its icon. */
interface TableMenuItem {
  id: MarkdownTableCommand;
  label: UiKitTextKey;
  icon: RowMenuItem['icon'];
  danger?: boolean;
}

const COLUMN_ITEMS: readonly TableMenuItem[] = [
  { id: 'addColumnBefore', label: 'editorTable.insertColumnLeft', icon: 'plus' },
  { id: 'addColumnAfter', label: 'editorTable.insertColumnRight', icon: 'plus' },
  { id: 'deleteColumn', label: 'editorTable.deleteColumn', icon: 'minus' },
];
const ROW_ITEMS: readonly TableMenuItem[] = [
  { id: 'addRowBefore', label: 'editorTable.insertRowAbove', icon: 'plus' },
  { id: 'addRowAfter', label: 'editorTable.insertRowBelow', icon: 'plus' },
  { id: 'deleteRow', label: 'editorTable.deleteRow', icon: 'minus' },
];
const TABLE_ITEMS: readonly TableMenuItem[] = [
  { id: 'deleteTable', label: 'editorTable.delete', icon: 'trash', danger: true },
];

/**
 * A link target that the editor sets: `http:`, `https:`, `mailto:`, a path of the
 * platform or an anchor. A protocol-relative `//host` is not a path.
 */
function isSafeHref(href: string): boolean {
  if (/^(https?:\/\/|mailto:)\S+$/i.test(href)) return true;
  return /^(\/(?!\/)|#)\S*$/.test(href);
}

/** The image files of a paste or a drop. Other files are ignored. */
function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => IMAGE_UPLOAD_TYPES.includes(f.type));
}

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
 *
 * GFM tables and images are part of the document (`media.extension.ts`). A table
 * keeps its column alignment; a cell holds one line of inline text. An image shows only
 * with the canonical path `/api/media/images/<uuid>`; any other image reference stays
 * unchanged in the Markdown and shows its alt text. Links `[label](target)` keep their
 * target (web, `mailto:`, a path of the platform); markdown-it keeps a `javascript:` or
 * `data:` target as plain text. With `imageUpload`, a paste or a drop of image files
 * uploads them; `insertImage`, `insertTable`, `tableCommand`, `pickImage`, `setLink` and
 * `unsetLink` serve a toolbar of the consumer.
 *
 * While an editable editor has the focus and the cursor is in a table, the table shows
 * its own controls: a grip on the top edge of the cursor's column and one on the start
 * edge of its row, each with a menu (insert before, insert after, delete), a bar below
 * the table that adds a row, a bar at its end that adds a column, and the table menu
 * above that bar (delete the table).
 */
@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Tiptap creates the editor nodes outside the Angular template, so the emulated
  // scope attribute never reaches them. Every rule is prefixed with `.mde__host` or
  // the element name instead.
  encapsulation: ViewEncapsulation.None,
  imports: [IconComponent, RowMenuComponent, UiKitTranslatePipe],
  // The controls of a table are placed against the editor element.
  host: {
    '(focusin)': 'focusWithin.set(true)',
    '(focusout)': 'onFocusOut($event)',
  },
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
  /**
   * Find what the consumer knows about the vote of a vote callout, by its question: the
   * caption, the result and the labels (`VoteCalloutInfo`). The cards render again when
   * the resolver changes. `null` shows the plain card.
   */
  readonly voteInfo = input<VoteCalloutResolver | null>(null);
  /**
   * Upload an image file. When set, a paste or a drop of PNG, JPEG, GIF or WebP files
   * uploads each file and inserts the image. `null` ignores image files.
   */
  readonly imageUpload = input<MarkdownImageUploader | null>(null);

  /** Emittiert das serialisierte Markdown bei jeder Änderung. */
  readonly valueChange = output<string>();

  /**
   * The formats at the cursor or on the selection. A toolbar of the consumer reads it to
   * show a format button as pressed. It changes with every transaction of the editor.
   */
  readonly activeFormats = signal<ReadonlySet<MarkdownFormat>>(new Set());
  /** The cursor is in a table, so a toolbar can show the table edits. */
  readonly inTable = signal(false);
  /** The number of image uploads that still run. */
  readonly uploading = signal(0);

  /** The focus is in the editor or in one of its table controls. */
  protected readonly focusWithin = signal(false);
  /** Where the controls of the table at the cursor go; `null` outside a table. */
  private readonly tablePlace = signal<TableControls | null>(null);
  /** The editable state that the controls follow. */
  private readonly editable = signal(false);
  /** The table controls, while they show. */
  protected readonly tableControls = computed(() =>
    this.editable() && this.focusWithin() ? this.tablePlace() : null,
  );

  private readonly intl = inject(UI_KIT_INTL);
  protected readonly columnMenu = computed(() => this.menuOf(COLUMN_ITEMS));
  protected readonly rowMenu = computed(() => this.menuOf(ROW_ITEMS));
  protected readonly tableMenu = computed(() => this.menuOf(TABLE_ITEMS));

  private readonly frame = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  /** Places the table controls again when the text or the width changes. */
  private resize: ResizeObserver | null = null;
  private editor: Editor | null = null;
  private loadedKey: string | null = null;
  private emitting = false;
  /** The vote cards on screen, to render them again with a new resolver. */
  private readonly voteViews = new Set<VoteCalloutView>();

  constructor() {
    // A wide table scrolls sideways in its wrapper. A scroll does not bubble, so the
    // listener catches it on the way down.
    const onScroll = (): void => this.placeTableControls();
    this.frame.nativeElement.addEventListener('scroll', onScroll, { capture: true, passive: true });
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
            // show the text on the first line of an empty document. In a document
            // with content they show the hint on the empty line of the cursor while
            // the editor has the focus (`has-focus`), else on the empty last line.
            // All only while editable.
            Placeholder.configure({
              showOnlyCurrent: false,
              placeholder: ({ editor }) => (editor.isEmpty ? this.placeholder() : this.hint()),
            }),
            // The top-level block of the cursor, while the editor has the focus. The
            // class of the placeholder cannot carry it: the placeholder updates only
            // the changed range and keeps the class of the line the cursor left.
            Focus.configure({ mode: 'shallowest' }),
            VoteCallout.configure({
              resolver: () => this.voteInfo(),
              views: this.voteViews,
            }),
            InlineMathMarkdown.configure({ katexOptions: KATEX_OPTIONS }),
            BlockMathMarkdown.configure({ katexOptions: KATEX_OPTIONS }),
            MarkdownTable,
            MarkdownTableRow,
            MarkdownTableHeader,
            MarkdownTableCell,
            MarkdownImage,
          ],
          editorProps: {
            transformPastedHTML: (html) => stripForeignImages(html),
            handlePaste: (_view, event) => this.onPasteFiles(event),
            handleDrop: (view, event, _slice, moved) => this.onDropFiles(view, event, moved),
          },
          content: this.value(),
          editable: !disabled,
          onUpdate: ({ editor }) => {
            if (this.emitting) return;
            this.valueChange.emit(this.toMarkdown(editor));
          },
          onTransaction: ({ editor }) => this.readFormats(editor),
        });
        this.loadedKey = key;
        this.editable.set(!disabled);
        this.ensureTrailingLine();
        if (typeof ResizeObserver !== 'undefined') {
          this.resize = new ResizeObserver(() => this.placeTableControls());
          this.resize.observe(this.editor.view.dom);
        }
        return;
      }
      this.editable.set(!disabled);
      // `false`: no update event. Tiptap emits one by default, and this effect runs on
      // every change of the document key, before the new content loads: the old text then
      // went out as a change of the new document, also from an editor that is read-only.
      if (this.editor.isEditable === disabled) this.editor.setEditable(!disabled, false);
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
   * A card reads the resolver when it renders. A new resolver (for example after a vote
   * closed) renders the cards on screen again; the document does not change.
   */
  private readonly voteInfoEffect = effect(() => {
    this.voteInfo();
    for (const view of this.voteViews) view.render();
  });

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

  /**
   * Insert an image at the cursor. Only the canonical path `/api/media/images/<uuid>`
   * is accepted; any other source inserts nothing and returns false.
   */
  insertImage(src: string, alt = ''): boolean {
    const editor = this.editor;
    if (!editor || !editor.isEditable || !isMediaImageSrc(src)) return false;
    return editor
      .chain()
      .focus()
      .insertContent({ type: 'image', attrs: { src, alt } })
      .run();
  }

  /**
   * Make the selection a link to `href`, or change the link at the cursor. Only
   * `http:`, `https:`, `mailto:`, a path of the platform (`/antraege/123`) and an anchor
   * (`#top`) are accepted; any other target (`javascript:`, `data:`, `//host`) changes
   * nothing and returns false. An empty selection outside a link inserts the target as
   * its own label.
   */
  setLink(href: string): boolean {
    const editor = this.editor;
    const target = href.trim();
    if (!editor || !editor.isEditable || !isSafeHref(target)) return false;
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && !editor.isActive('link')) {
      return chain
        .insertContent({ type: 'text', text: target, marks: [{ type: 'link', attrs: { href: target } }] })
        .run();
    }
    return chain.extendMarkRange('link').setLink({ href: target }).run();
  }

  /** Remove the link at the cursor or on the selection; the text stays. */
  unsetLink(): boolean {
    const editor = this.editor;
    if (!editor || !editor.isEditable) return false;
    return editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }

  /** Insert a table with a header row at the cursor. */
  insertTable(rows = 3, cols = 3): boolean {
    const editor = this.editor;
    if (!editor || !editor.isEditable) return false;
    return editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  }

  /** Edit the table at the cursor. Outside a table it does nothing and returns false. */
  tableCommand(command: MarkdownTableCommand): boolean {
    const editor = this.editor;
    if (!editor || !editor.isEditable) return false;
    const chain = editor.chain().focus();
    switch (command) {
      case 'addRowBefore':
        return chain.addRowBefore().run();
      case 'addRowAfter':
        return chain.addRowAfter().run();
      case 'addColumnBefore':
        return chain.addColumnBefore().run();
      case 'addColumnAfter':
        return chain.addColumnAfter().run();
      case 'deleteRow':
        return chain.deleteRow().run();
      case 'deleteColumn':
        return chain.deleteColumn().run();
      case 'deleteTable':
        return chain.deleteTable().run();
    }
  }

  /** A table control ran its command: rows, columns or the whole table. */
  protected onTableMenu(item: RowMenuItem): void {
    this.tableCommand(item.id as MarkdownTableCommand);
  }

  /** A bar of the table: add a row below the table or a column at its end. */
  protected appendTable(what: 'row' | 'column'): void {
    const editor = this.editor;
    if (!editor || !editor.isEditable) return;
    appendToTable(editor, what);
  }

  /** The focus left the editor and its table controls: the controls hide. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.frame.nativeElement.contains(next)) return;
    this.focusWithin.set(false);
  }

  /** Measure where the controls of the table at the cursor go. */
  protected placeTableControls(): void {
    const editor = this.editor;
    const next = editor ? measureTableControls(editor, this.frame.nativeElement) : null;
    const prev = this.tablePlace();
    if (prev === next) return;
    if (prev && next && (Object.keys(next) as (keyof TableControls)[]).every((k) => prev[k] === next[k])) {
      return;
    }
    this.tablePlace.set(next);
  }

  private menuOf(items: readonly TableMenuItem[]): RowMenuSection[] {
    this.intl.lang();
    return [
      {
        items: items.map((item) => ({
          id: item.id,
          icon: item.icon,
          danger: item.danger,
          label: this.intl.translate(item.label),
        })),
      },
    ];
  }

  /** Open the file dialog of the browser and upload the chosen images (`imageUpload`). */
  pickImage(): void {
    if (!this.imageUpload() || !this.editor?.isEditable) return;
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = IMAGE_UPLOAD_TYPES.join(',');
    picker.multiple = true;
    picker.addEventListener('change', () => void this.uploadImages(imageFiles(picker.files)));
    picker.click();
  }

  /**
   * Upload image files one after the other and insert each image when its upload ends:
   * at `pos`, or at the cursor. Files of another type are ignored. Resolves to the
   * number of inserted images.
   */
  async uploadImages(files: readonly File[], pos?: number): Promise<number> {
    const upload = this.imageUpload();
    const images = files.filter((f) => IMAGE_UPLOAD_TYPES.includes(f.type));
    if (!upload || !images.length) return 0;
    let at = pos;
    let inserted = 0;
    this.uploading.update((n) => n + images.length);
    for (const file of images) {
      try {
        const ref = await upload(file);
        const editor = this.editor;
        if (!editor || !editor.isEditable || !isMediaImageSrc(ref.src)) continue;
        const node = { type: 'image', attrs: { src: ref.src, alt: ref.alt } };
        if (at === undefined) {
          if (editor.chain().focus().insertContent(node).run()) inserted++;
        } else {
          at = Math.min(at, editor.state.doc.content.size);
          const before = editor.state.doc.content.size;
          if (editor.chain().insertContentAt(at, node).run()) {
            inserted++;
            at += editor.state.doc.content.size - before;
          }
        }
      } catch {
        // The uploader reported the error; the image is not inserted.
      } finally {
        this.uploading.update((n) => n - 1);
      }
    }
    return inserted;
  }

  /** A paste with image files uploads them instead of the pasted content. */
  private onPasteFiles(event: ClipboardEvent): boolean {
    if (!this.imageUpload()) return false;
    const files = imageFiles(event.clipboardData?.files);
    if (!files.length) return false;
    event.preventDefault();
    void this.uploadImages(files);
    return true;
  }

  /** A drop of image files from outside uploads them at the drop position. */
  private onDropFiles(view: EditorView, event: DragEvent, moved: boolean): boolean {
    if (moved || !this.imageUpload()) return false;
    const files = imageFiles(event.dataTransfer?.files);
    if (!files.length) return false;
    event.preventDefault();
    const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
    void this.uploadImages(files, pos);
    return true;
  }

  /** Read the formats at the cursor into `activeFormats`. */
  private readFormats(editor: Editor): void {
    this.placeTableControls();
    const inTable = editor.isActive('table');
    if (inTable !== this.inTable()) this.inTable.set(inTable);
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
    this.resize?.disconnect();
    this.resize = null;
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
