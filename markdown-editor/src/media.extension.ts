import Image from '@tiptap/extension-image';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import type { Node as PmNode } from '@tiptap/pm/model';
import { TableMap } from '@tiptap/pm/tables';

/**
 * Tables and images in Markdown, for the editor.
 *
 * Tables are GFM pipe tables. markdown-it reads them on the way in. The serializer of
 * tiptap-markdown 0.9 writes a table only when its shape fits Markdown exactly, and else
 * writes the text `[table]` (the whole table is lost). It also drops the column
 * alignment. The serializer here writes every table: it keeps the alignment of each
 * column (`:--`, `:-:`, `--:`), escapes `|` in a cell, writes the first row as the
 * header row, fills the slots of a merged cell with empty cells, and turns a line break
 * in a cell into a space. A cell holds exactly one paragraph, so what the editor shows is
 * what Markdown can store.
 *
 * An image shows only when its source is the canonical path
 * `/api/media/images/<uuid>`. The editor never loads another source (tracking pixels,
 * mixed content). An image with another source from the Markdown stays in the document
 * as it is and shows its alt text only, so a save writes the reference back unchanged
 * and loses no text. A pasted image with another source becomes its alt text.
 */

/** The canonical image path. Group 1 is the lowercase uuid. */
export const MEDIA_IMAGE_PATH = /^\/api\/media\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** The raster types that an upload accepts. SVG is never one of them. */
export const IMAGE_UPLOAD_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** The source is the canonical image path. */
export function isMediaImageSrc(src: unknown): src is string {
  return typeof src === 'string' && MEDIA_IMAGE_PATH.test(src);
}

// The parts of the prosemirror-markdown serializer state that the serializers touch.
interface SerializerState {
  out: string;
  inlines: unknown[];
  write(text?: string): void;
  ensureNewLine(): void;
  closeBlock(node: unknown): void;
  renderInline(node: PmNode): void;
  esc(text: string, startOfLine?: boolean): string;
}

/** The marker of an image with another source, between markdown-it and the parser. */
const FOREIGN_ATTR = 'data-mde-image';

/** The DOM that markdown-it rendered: the images with another source become markers. */
function markForeignImages(root: HTMLElement): void {
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const src = img.getAttribute('src') ?? '';
    if (isMediaImageSrc(src)) continue;
    const span = img.ownerDocument.createElement('span');
    span.setAttribute(FOREIGN_ATTR, '');
    span.setAttribute('data-src', src);
    span.setAttribute('data-alt', img.getAttribute('alt') ?? '');
    img.replaceWith(span);
  }
}

/** Pasted HTML: an image with another source becomes its alt text. */
export function stripForeignImages(html: string): string {
  if (!html.includes('<img')) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const img of Array.from(doc.body.querySelectorAll('img'))) {
    if (isMediaImageSrc(img.getAttribute('src'))) continue;
    img.replaceWith(doc.createTextNode(img.getAttribute('alt') ?? ''));
  }
  return doc.body.innerHTML;
}

/** The destination of a Markdown image: in angle brackets when it holds white space. */
function destination(src: string): string {
  if (/[\s<>]/.test(src)) return `<${src.replace(/[<>]/g, (c) => encodeURIComponent(c))}>`;
  return src.replace(/[()]/g, '\\$&');
}

/**
 * The image node, inline as in Markdown. `src` and `alt` come from the Markdown and go
 * back to it unchanged. A title is dropped on a load and never written: the app accepts
 * only the plain form `![alt](src)`, so every renderer reads the same image.
 */
export const MarkdownImage = Image.extend({
  addOptions() {
    return { ...this.parent!(), inline: true, allowBase64: false };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (el: HTMLElement) =>
          isMediaImageSrc(el.getAttribute('src'))
            ? {
                src: el.getAttribute('src'),
                alt: el.getAttribute('alt'),
                title: null,
              }
            : false,
      },
      {
        tag: `span[${FOREIGN_ATTR}]`,
        getAttrs: (el: HTMLElement) => ({
          src: el.getAttribute('data-src') ?? '',
          alt: el.getAttribute('data-alt'),
          title: null,
        }),
      },
    ];
  },
  renderHTML({ node }) {
    const { src, alt } = node.attrs as { src: string | null; alt: string | null };
    if (isMediaImageSrc(src)) {
      return ['img', { src, alt: alt ?? '', class: 'mde__img' }];
    }
    return [
      'span',
      {
        [FOREIGN_ATTR]: '',
        'data-src': src ?? '',
        'data-alt': alt ?? '',
        class: 'mde__imgAlt',
      },
      alt || src || '',
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: PmNode) {
          const { src, alt } = node.attrs as { src: string | null; alt: string | null };
          state.write(`![${state.esc(alt ?? '')}](${destination(src ?? '')})`);
        },
        parse: {
          updateDOM(element: HTMLElement) {
            markForeignImages(element);
          },
        },
      },
    };
  },
});

/** A table cell holds one paragraph: Markdown has no blocks in a cell. */
export const MarkdownTableCell = TableCell.extend({ content: 'paragraph' });
/** A header cell holds one paragraph: Markdown has no blocks in a cell. */
export const MarkdownTableHeader = TableHeader.extend({ content: 'paragraph' });
export { TableRow as MarkdownTableRow };

/** The delimiter of a column for its alignment. */
function delimiter(align: unknown): string {
  switch (align) {
    case 'left':
      return ':---';
    case 'center':
      return ':---:';
    case 'right':
      return '---:';
    default:
      return '---';
  }
}

/** The Markdown of one cell, on one line, with `|` escaped. */
function cellMarkdown(state: SerializerState, cell: PmNode): string {
  const start = state.out.length;
  const inlines = state.inlines.length;
  cell.forEach((block, _offset, i) => {
    if (i) state.out += ' ';
    if (block.isTextblock) state.renderInline(block);
    else state.out += state.esc(block.textContent);
  });
  const text = state.out.slice(start);
  state.out = state.out.slice(0, start);
  // tiptap-markdown records the marks by their offset in `out`, to trim the white space
  // inside them later. The cell text left `out`, so its records must go too.
  state.inlines.length = inlines;
  return text
    .replace(/\\\n/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

/** Write a table as a GFM pipe table. Every table is written, whatever its shape. */
function serializeTable(state: SerializerState, node: PmNode): void {
  const map = TableMap.get(node);
  const seen = new Set<number>();
  const aligns: unknown[] = new Array(map.width).fill(null);
  const rows: string[][] = [];
  // Flush the separation from the block before, so the cells render after it.
  state.write('');
  for (let r = 0; r < map.height; r++) {
    const row: string[] = [];
    for (let c = 0; c < map.width; c++) {
      const pos = map.map[r * map.width + c];
      if (seen.has(pos)) {
        row.push('');
        continue;
      }
      seen.add(pos);
      const cell = node.nodeAt(pos);
      if (!cell) {
        row.push('');
        continue;
      }
      if (aligns[c] === null && cell.attrs['align']) aligns[c] = cell.attrs['align'];
      row.push(cellMarkdown(state, cell));
    }
    rows.push(row);
  }
  const line = (cells: string[]): string => `| ${cells.join(' | ')} |`;
  const lines = rows.map(line);
  lines.splice(1, 0, line(aligns.map(delimiter)));
  lines.forEach((text, i) => {
    if (i) state.ensureNewLine();
    state.write(text);
  });
  state.closeBlock(node);
}

/** The table node: no column resizing, because Markdown stores no widths. */
export const MarkdownTable = Table.extend({
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize(state: SerializerState, node: PmNode) {
          serializeTable(state, node);
        },
        parse: {
          // markdown-it reads the pipe tables.
        },
      },
    };
  },
}).configure({ resizable: false });
