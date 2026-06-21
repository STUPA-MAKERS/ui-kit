/*
 * Secondary entry point '@stupa-makers/ui-kit/markdown-editor'.
 * Isolated so the Tiptap dependency stays out of the primary entry's bundle and lands in
 * the consumer's lazy chunk only where the editor is actually used.
 */
export { MarkdownEditorComponent } from './markdown-editor.component';
