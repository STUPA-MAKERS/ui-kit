import { Node, mergeAttributes } from '@tiptap/core';
import { iconShapes } from '@stupa-makers/ui-kit';

/**
 * An embedded PDF: `[name](/api/media/documents/<uuid>)` in Markdown.
 *
 * The editor shows the reference as a file badge: a file icon, the label "PDF", the
 * name and the page count. The badge is one inline atom, so the cursor moves over it
 * and a delete removes it whole. A click, Enter or Space on the badge calls `open` of
 * the consumer, which shows the PDF in its file viewer. The consumer gives the page
 * count through `info`; without it the badge shows no count. Only the canonical path
 * makes a badge. Every other link stays a link.
 */

/** The canonical path of an embedded PDF. Group 1 is the lowercase uuid. */
export const MEDIA_DOCUMENT_PATH =
  /^\/api\/media\/documents\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** The type that a PDF upload accepts. */
export const DOCUMENT_UPLOAD_TYPES: readonly string[] = ['application/pdf'];

/** The source is the canonical path of an embedded PDF. */
export function isMediaDocumentSrc(src: unknown): src is string {
  return typeof src === 'string' && MEDIA_DOCUMENT_PATH.test(src);
}

/** The label of a Markdown link for a raw text: `\`, `[` and `]` escaped. */
export function documentLabel(name: string): string {
  return name.replace(/[\\[\]]/g, '\\$&');
}

/** An embedded PDF: its canonical path and its file name. */
export interface MarkdownDocumentRef {
  readonly src: string;
  readonly name: string;
}

export interface DocumentRefOptions {
  /** Resolve the page count of a PDF, or null when unknown. */
  readonly info: () => ((src: string) => Promise<number | null>) | null;
  /** Show the PDF, for example in the file viewer of the consumer. */
  readonly open: (ref: MarkdownDocumentRef) => void;
  /** The text of a page count. */
  readonly pagesText: (pages: number) => string;
  /** The accessible name of the badge. */
  readonly openLabel: (name: string) => string;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The file icon of the kit as an SVG element. */
function fileIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attrs: Readonly<Record<string, string>> = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    class: 'mde-doc__icon',
  };
  Object.entries(attrs).forEach(([name, value]) => svg.setAttribute(name, value));
  (iconShapes('file') ?? []).forEach((shape) => {
    const el = document.createElementNS(SVG_NS, shape.t);
    Object.entries(shape)
      .filter(([key]) => key !== 't')
      .forEach(([key, value]) => el.setAttribute(key, String(value)));
    svg.append(el);
  });
  return svg;
}

/** A span with a class and a text. */
function span(cls: string, text = ''): HTMLSpanElement {
  const el = document.createElement('span');
  el.setAttribute('class', cls);
  el.append(text);
  return el;
}

interface SerializerState {
  write(text: string): void;
  esc(text: string): string;
}

export const DocumentRef = Node.create<DocumentRefOptions>({
  name: 'documentRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      info: () => null,
      open: () => undefined,
      pagesText: (pages: number) => `${pages}`,
      openLabel: (name: string) => name,
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      name: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]',
        // Before the link mark: a link to a PDF is a badge, not a link.
        priority: 100,
        getAttrs: (element) => {
          const src = element.getAttribute('href') ?? '';
          return isMediaDocumentSrc(src) ? { src, name: (element.textContent ?? '').trim() } : false;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, { href: node.attrs['src'] as string, 'data-document': '' }),
      node.attrs['name'] as string,
    ];
  },

  addNodeView() {
    const options = this.options;
    return ({ node }) => {
      const src = node.attrs['src'] as string;
      const name = (node.attrs['name'] as string) || 'PDF';
      const dom = span('mde-doc');
      const pages = span('mde-doc__pages');
      dom.setAttribute('contenteditable', 'false');
      dom.setAttribute('role', 'button');
      dom.setAttribute('tabindex', '0');
      dom.setAttribute('aria-label', options.openLabel(name));
      dom.append(fileIcon(), span('mde-doc__kind', 'PDF'), span('mde-doc__name', name), pages);
      const open = (): void => options.open({ src, name });
      dom.addEventListener('click', (event) => {
        event.preventDefault();
        open();
      });
      dom.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      });
      const info = options.info();
      if (info) {
        void info(src)
          .then((count) => {
            if (count !== null && count > 0) pages.replaceChildren(options.pagesText(count));
          })
          .catch(() => undefined);
      }
      return {
        dom,
        stopEvent: (event) => event.type === 'click' || event.type === 'keydown',
        ignoreMutation: () => true,
      };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: { attrs: { src: string; name: string } }) {
          state.write(`[${state.esc(node.attrs.name || 'PDF')}](${node.attrs.src})`);
        },
        parse: {},
      },
    };
  },
});
