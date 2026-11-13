/*
 * Secondary entry point '@stupa-makers/ui-kit/markdown-editor'.
 * Isolated so the Tiptap dependency stays out of the primary entry's bundle and lands in
 * the consumer's lazy chunk only where the editor is actually used.
 */
export { MarkdownEditorComponent } from './markdown-editor.component';
export type {
  MarkdownFormat,
  MarkdownDocumentInfo,
  MarkdownDocumentUploader,
  MarkdownImageRef,
  MarkdownImageUploader,
  MarkdownTableCommand,
} from './markdown-editor.component';
export { IMAGE_UPLOAD_TYPES, MEDIA_IMAGE_PATH, isMediaImageSrc } from './media.extension';
export type { VoteCalloutInfo, VoteCalloutResolver } from './vote-callout.extension';
export { normalTime, timeNoteLine } from './time-note.extension';
export {
  DOCUMENT_UPLOAD_TYPES,
  MEDIA_DOCUMENT_PATH,
  documentLabel,
  isMediaDocumentSrc,
} from './document.extension';
export type { MarkdownDocumentRef } from './document.extension';
