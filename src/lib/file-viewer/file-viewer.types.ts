/** How the viewer shows a file: as an image, in the browser's PDF viewer, or not at all. */
export type FileViewerKind = 'image' | 'pdf' | 'other';

/**
 * One file in the viewer.
 *
 * `url` is trusted: the viewer puts it into `<img src>` and `<iframe src>` as it is.
 * Pass only same-origin API URLs (for example `/api/attachments/<id>/download`), never
 * a URL that a user typed or that comes from file content.
 *
 * Without `kind`, the viewer derives it from `mime`, then from the extension of `name`,
 * then from the extension of the path of `url`.
 */
export interface FileViewerItem {
  name: string;
  url: string;
  kind?: FileViewerKind;
  mime?: string;
}

const IMAGE_EXT = new Set([
  'png',
  'jpg',
  'jpeg',
  'jfif',
  'gif',
  'webp',
  'avif',
  'svg',
  'bmp',
  'ico',
]);

/** Image MIME types a browser draws in an `<img>`. TIFF and HEIC are not among them. */
const IMAGE_MIME = /^image\/(png|jpe?g|pjpeg|gif|webp|avif|svg\+xml|bmp|x-ms-bmp|x-icon|vnd\.microsoft\.icon)$/;

function extension(path: string): string {
  const clean = path.split(/[?#]/, 1)[0];
  const base = clean.slice(clean.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

function kindOfExtension(ext: string): FileViewerKind | null {
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXT.has(ext)) return 'image';
  return null;
}

/**
 * The kind of a file: the explicit `kind`, else from `mime`, else from the extension of
 * `name`, else from the extension of the path of `url`. Unknown files are `'other'`.
 */
export function fileViewerKind(item: FileViewerItem): FileViewerKind {
  if (item.kind) return item.kind;
  const mime = item.mime?.split(';', 1)[0].trim().toLowerCase();
  if (mime) {
    if (mime === 'application/pdf') return 'pdf';
    if (IMAGE_MIME.test(mime)) return 'image';
    if (mime !== 'application/octet-stream') return 'other';
  }
  return kindOfExtension(extension(item.name)) ?? kindOfExtension(extension(item.url)) ?? 'other';
}
