/**
 * The Markdown renderer of the app. It escapes first, so it is safe against XSS. The
 * renderer escapes the WHOLE input before it makes any tag. Markup can come from the
 * generator only. The generator writes fixed tags and attributes, allows a fixed list of
 * link protocols and builds an image source only from a validated uuid.
 *
 * Blocks: headings (`#` to `######`, shifted by `headingOffset`), fenced code, `>` quotes
 * with blocks of their own, GitHub and protocol callouts (`> [!NOTE]`, `> [!abstimmung]`,
 * …), `-`/`*` lists, `1.` lists, task items (`- [ ]`, `- [x]`), GFM pipe tables with
 * alignment, horizontal rules (`---`, `***`, `___`) and paragraphs. A single line break
 * inside a paragraph stays as a `<br>`.
 *
 * Inline: backslash escapes (`\*`), a backslash at the end of a line as a line break,
 * `**bold**`, `*italic*`, `_italic_`, `~~strike~~`, `` `code` ``, a link with the http,
 * https or mailto protocol or an app path (`/…`), and an image. An image renders only
 * when its destination is the canonical path `/api/media/images/<uuid>`. Every other
 * destination renders as its alt text, so no external image loads (tracking pixels).
 */

import { assertNever } from '@stupa-makers/ui-kit';

import { linkify } from './linkify';

/** The canonical image path. Group 1 is the lowercase uuid. */
const IMAGE_PATH_RE =
  /^\/api\/media\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** The control characters except tab and line feed (and carriage return, which becomes
 *  a line feed first). */
// eslint-disable-next-line no-control-regex -- control characters are the point
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

export interface MarkdownOptions {
  /** The number of levels that a heading moves down. The default 3 renders `#` as h4.
   *  A full-size document uses 0. */
  readonly headingOffset?: number;
  /**
   * The URL of an image from its uuid. The default is the canonical path, which needs a
   * session. `null` renders the alt text instead of an image (anonymous contexts).
   */
  readonly imageSrc?: ((id: string) => string) | null;
  /** Whether a `mailto:` link renders as a link. The default is `true`. With `false`, only http,
   *  https and app paths are links. */
  readonly mailto?: boolean;
}

/** The default image source: the canonical path, served to any authenticated session. */
export const defaultImageSrc = (id: string): string => `/api/media/images/${id}`;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The kind of a link target, or `null` when the target is not allowed. `external` is an
 * http, https or mailto URL and opens in a new tab. `internal` is an app path (`/…`, not
 * `//…`) or an anchor (`#…`) and stays in the tab. Every other scheme (`javascript:`,
 * `data:`, `vbscript:`, …) is refused.
 *
 * The text is escaped already, so a raw `"`, `<`, `>` or `'` arrives as an entity. The
 * check rejects both forms, a backslash and every whitespace or control character, so no
 * attribute break-out can happen even without a sanitizer.
 */
function hrefKind(url: string, mailto: boolean): 'external' | 'internal' | null {
  if (/["'<>\\]|&(?:quot|lt|gt|#39|#x27);/i.test(url)) return null;
  // eslint-disable-next-line no-control-regex -- control characters are the point
  if (/[\s\x00-\x1f\x7f]/.test(url)) return null;
  if (/^https?:\/\/[^/]/i.test(url) || (mailto && /^mailto:/i.test(url))) return 'external';
  if (/^(\/(?!\/)|#)/.test(url)) return 'internal';
  return null;
}

/**
 * Replace each `[label](dest)` (or `![alt](dest)` when `bang` is set) with the result
 * of `render`. The destination may hold balanced parentheses, as in a Wikipedia URL. A
 * `null` result keeps the source text.
 */
function replaceRefs(
  text: string,
  bang: boolean,
  render: (label: string, dest: string) => string | null,
): string {
  const at = (i: number): RefAt | null => {
    const open = bang ? text.startsWith('![', i) : text[i] === '[';
    const start = i + (bang ? 2 : 1);
    const close = open ? text.indexOf(']', start) : -1;
    const label = close >= 0 ? text.slice(start, close) : '';
    const dest = close >= 0 && text[close + 1] === '(' ? destination(text, close + 2) : null;
    const html = dest !== null && !label.includes('[') ? render(label, dest.url) : null;
    return html === null || dest === null ? null : { html, end: dest.end };
  };
  return Array.from({ length: text.length }, (_, i) => i).reduce(
    (acc, i) => {
      const ref = i < acc.skipTo ? null : at(i);
      return i < acc.skipTo
        ? acc
        : ref
          ? { out: acc.out + ref.html, skipTo: ref.end }
          : { out: acc.out + text[i], skipTo: acc.skipTo };
    },
    { out: '', skipTo: 0 },
  ).out;
}

/** A rendered reference and the index after its closing parenthesis. */
interface RefAt {
  readonly html: string;
  readonly end: number;
}

/** The parenthesis depth after `c`, or `null` when `c` closes the destination. */
function parenStep(depth: number, c: string): number | null {
  return c === '(' ? depth + 1 : c !== ')' ? depth : depth === 0 ? null : depth - 1;
}

/**
 * The destination from `from` to its closing parenthesis, or `null` when it has none.
 * A destination holds no white space, so the search ends at the first one.
 */
function destination(
  text: string,
  from: number,
): { readonly url: string; readonly end: number } | null {
  const word = /^\S*/.exec(text.slice(from))?.[0] ?? '';
  const close = word.split('').reduce<{ readonly depth: number; readonly at: number }>(
    (acc, c, j) => {
      const depth = acc.at >= 0 ? null : parenStep(acc.depth, c);
      return acc.at >= 0 ? acc : depth === null ? { depth: 0, at: j } : { depth, at: -1 };
    },
    { depth: 0, at: -1 },
  ).at;
  return close < 0 ? null : { url: text.slice(from, from + close), end: from + close + 1 };
}

/** Callout kind → title and CSS modifier: the GitHub kinds and the protocol kinds. */
const CALLOUT_TITLES: Readonly<Record<string, string>> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
  abstimmung: 'Abstimmung',
  beschluss: 'Beschluss',
  aufgabe: 'Aufgabe',
  frist: 'Frist',
};

/** The inline renderer of one options set. */
type Inline = (text: string) => string;

/**
 * Apply the inline markup to text that is already escaped. Code spans, images and links
 * become placeholders first. The emphasis rules then cannot touch a code span or an
 * attribute value.
 *
 * A fragment can hold the placeholder of an earlier fragment, so the fill happens when the fragment
 * is stashed and the final restore is one pass. The alt text and the source are escaped again,
 * because the source is the output of a consumer function and must never break out of the
 * attribute.
 */
function inlineRenderer(imageSrc: ((id: string) => string) | null, mailto: boolean): Inline {
  return (text: string): string => {
    // The placeholders fill while the replacements run, so the two tables grow in place.
    const parts: string[] = [];
    const texts: string[] = [];
    // eslint-disable-next-line no-control-regex -- NUL sentinel (the source has no control characters)
    const sentinel = /\u0000(\d+)\u0000/g;
    const fill = (s: string, plain = false): string =>
      s.replace(sentinel, (_m, i: string) => (plain ? texts : parts)[Number(i)] ?? '');
    const stash = (html: string, plain = html): string => {
      parts.push(fill(html));
      texts.push(fill(plain, true));
      return `\u0000${parts.length - 1}\u0000`;
    };
    const emphasis = (s: string): string =>
      s
        .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[\s(>])\*([^*\n]+)\*(?=[\s).,!?:;<]|$)/g, '$1<em>$2</em>')
        .replace(/(^|[\s(>])_([^_\n]+)_(?=[\s).,!?:;<]|$)/g, '$1<em>$2</em>');

    const coded = text.replace(/`([^`]+)`/g, (_m, code: string) =>
      stash(`<code>${code}</code>`, code),
    );
    const escaped = coded
      .replace(/\\$/, '')
      .replace(/\\(&amp;|&lt;|&gt;|&quot;|&#39;|[!-/:-@[-`{-~])/g, (_m, c: string) => stash(c));
    const imaged = replaceRefs(escaped, true, (alt, dest) => {
      const id = IMAGE_PATH_RE.exec(dest)?.[1];
      if (!id || !imageSrc) return alt ? stash(alt) : '';
      const src = escapeHtml(imageSrc(id));
      const plain = fill(alt, true);
      return stash(`<img src="${src}" alt="${plain}" loading="lazy" decoding="async">`, plain);
    });
    const linked = replaceRefs(imaged, false, (label, href) => {
      const kind = label ? hrefKind(href, mailto) : null;
      if (!kind) return null;
      const attrs = kind === 'external' ? ' target="_blank" rel="noopener noreferrer"' : '';
      return stash(`<a href="${href}"${attrs}>${emphasis(label)}</a>`, label);
    });
    return fill(emphasis(linked));
  };
}

/** The cells of a pipe-table row (`| a | b |`). An escaped pipe (`\|`) stays in its cell. */
function tableCells(line: string): readonly string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/(^|[^\\])\|$/, '$1')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));
}

/** The alignment of each column from a separator row, or `null` when it is none. */
function tableAlign(line: string): readonly string[] | null {
  if (!line.includes('-')) return null;
  const cells = tableCells(line);
  if (!cells.every((c) => /^:?-+:?$/.test(c))) return null;
  if (!line.includes('|') && cells.length < 2) return null;
  return cells.map((c) => {
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    return c.startsWith(':') ? 'left' : '';
  });
}

function renderTable(
  head: readonly string[],
  align: readonly string[],
  rows: readonly (readonly string[])[],
  inline: Inline,
): string {
  const cell = (tag: 'th' | 'td', text: string, col: number): string => {
    const cls = align[col] ? ` class="mdv__al--${align[col]}"` : '';
    return `<${tag}${cls}>${inline(text)}</${tag}>`;
  };
  const row = (cells: readonly string[], tag: 'th' | 'td'): string =>
    `<tr>${align.map((_a, i) => cell(tag, cells[i] ?? '', i)).join('')}</tr>`;
  const body = rows.map((r) => row(r, 'td')).join('');
  return (
    `<div class="mdv__table"><table><thead>${row(head, 'th')}</thead>` +
    `<tbody>${body}</tbody></table></div>`
  );
}

/**
 * A group of consecutive `>` lines: a callout or otherwise a plain blockquote. A plain
 * blockquote holds blocks of its own (paragraphs, headings, lists, a nested quote), so
 * a quoted mail keeps its paragraphs. `blocks` renders lines that are escaped already.
 */
function renderQuote(
  lines: readonly string[],
  inline: Inline,
  blocks: (lines: readonly string[]) => string,
): string {
  const marker = /^\[!(\w+)\]\s*(.*)$/.exec(lines[0].trim());
  const kind = marker ? marker[1].toLowerCase() : '';
  if (marker && kind in CALLOUT_TITLES) {
    const first = marker[2].trim();
    const body = [...(first ? [first] : []), ...lines.slice(1)];
    const inner = body.length ? `<p>${body.map(inline).join('<br>')}</p>` : '';
    return (
      `<div class="callout callout--${kind}">` +
      `<p class="callout__title">${CALLOUT_TITLES[kind]}</p>${inner}</div>`
    );
  }
  return `<blockquote>${blocks(lines)}</blockquote>`;
}

/** One list item. A task item (`[ ]`, `[x]`) gets a disabled checkbox. */
function renderItem(text: string, inline: Inline): string {
  const task = /^\[([ xX])\]\s+(.*)$/.exec(text);
  if (!task) return `<li>${inline(text)}</li>`;
  const checked = task[1] === ' ' ? '' : ' checked';
  return (
    `<li class="mdv__task"><input type="checkbox" disabled${checked}> ` +
    `${inline(task[2])}</li>`
  );
}

/**
 * Control characters are removed first, because the NUL character is the placeholder sentinel of
 * the inline renderer and a source that holds one could forge a placeholder.
 */
export function markdownToSafeHtml(src: string, opts: MarkdownOptions = {}): string {
  const offset = opts.headingOffset ?? 3;
  const inline = inlineRenderer(
    opts.imageSrc === undefined ? defaultImageSrc : opts.imageSrc,
    opts.mailto ?? true,
  );
  const clean = src.replace(/\r\n?/g, '\n').replace(CONTROL_RE, '');
  return linkify(renderBlocks(escapeHtml(clean).split('\n'), offset, inline));
}

/** An open list: its tag and its items so far. */
interface OpenList {
  readonly tag: 'ul' | 'ol';
  readonly items: readonly string[];
}

/**
 * The state of the block scan. At most one of `para`, `list` and `quote` is open, and
 * `fence` holds the lines of an open code fence. Lines before `skipTo` belong to a table
 * that is rendered already.
 */
interface Blocks {
  readonly out: readonly string[];
  readonly para: readonly string[];
  readonly list: OpenList | null;
  readonly quote: readonly string[];
  readonly fence: readonly string[] | null;
  readonly skipTo: number;
}

/** What the block scan needs besides the state. */
interface BlockContext {
  readonly lines: readonly string[];
  readonly offset: number;
  readonly inline: Inline;
}

/** One line outside a code fence, by what it starts. */
type BlockLine =
  | { readonly kind: 'fence' }
  | { readonly kind: 'blank' }
  | { readonly kind: 'heading'; readonly hashes: number; readonly text: string }
  | { readonly kind: 'rule' }
  | { readonly kind: 'table'; readonly head: readonly string[]; readonly align: readonly string[] }
  | { readonly kind: 'item'; readonly tag: 'ul' | 'ol'; readonly text: string }
  | { readonly kind: 'quote'; readonly text: string }
  | { readonly kind: 'text' };

/** The line after a table head, when it makes a table with the head. */
function tableLine(t: string, next: string | undefined): BlockLine | null {
  const align = t.includes('|') && next !== undefined ? tableAlign(next) : null;
  const head = align ? tableCells(t) : null;
  return align && head?.length === align.length ? { kind: 'table', head, align } : null;
}

/** The tests of a trimmed line, in order: the first one that matches wins. */
const BLOCK_LINES: readonly ((t: string, next: string | undefined) => BlockLine | null)[] = [
  (t) => (/^```/.test(t) ? { kind: 'fence' } : null),
  (t) => (t ? null : { kind: 'blank' }),
  (t) => {
    const h = /^(#{1,6})\s+(.*)$/.exec(t);
    return h ? { kind: 'heading', hashes: h[1].length, text: h[2] } : null;
  },
  (t) => (/^([-*_])(\s*\1){2,}$/.test(t) ? { kind: 'rule' } : null),
  tableLine,
  (t) => {
    const ul = /^[-*+]\s+(.*)$/.exec(t);
    return ul ? { kind: 'item', tag: 'ul', text: ul[1] } : null;
  },
  (t) => {
    const ol = /^\d+[.)]\s+(.*)$/.exec(t);
    return ol ? { kind: 'item', tag: 'ol', text: ol[1] } : null;
  },
  (t) => {
    const q = /^&gt;\s?(.*)$/.exec(t);
    return q ? { kind: 'quote', text: q[1] } : null;
  },
];

/** What a trimmed line outside a code fence starts; `next` is the line after it. */
function blockLine(t: string, next: string | undefined): BlockLine {
  return BLOCK_LINES.reduce<BlockLine | null>((hit, test) => hit ?? test(t, next), null) ?? {
    kind: 'text',
  };
}

/** The state with `html` added to the output. */
function emit(s: Blocks, html: string): Blocks {
  return { ...s, out: [...s.out, html] };
}

/** Render the open paragraph, if there is one. */
function closePara(s: Blocks, ctx: BlockContext): Blocks {
  const html = `<p>${s.para.map(ctx.inline).join('<br>')}</p>`;
  return s.para.length ? { ...emit(s, html), para: [] } : s;
}

/** Render the open list, if there is one. */
function closeList(s: Blocks, ctx: BlockContext): Blocks {
  const items = s.list ? s.list.items.map((i) => renderItem(i, ctx.inline)).join('') : '';
  return s.list ? { ...emit(s, `<${s.list.tag}>${items}</${s.list.tag}>`), list: null } : s;
}

/** Render the open quote, if there is one. */
function closeQuote(s: Blocks, ctx: BlockContext): Blocks {
  const blocks = (inner: readonly string[]) => renderBlocks(inner, ctx.offset, ctx.inline);
  return s.quote.length
    ? { ...emit(s, renderQuote(s.quote, ctx.inline, blocks)), quote: [] }
    : s;
}

/** Render the open paragraph, list and quote. */
function closeAll(s: Blocks, ctx: BlockContext): Blocks {
  return closeQuote(closeList(closePara(s, ctx), ctx), ctx);
}

/** The first line from `start` on that is no table row, or the end of the lines. */
function tableEnd(lines: readonly string[], start: number): number {
  const stop = lines.slice(start).findIndex((l) => !(l.trim() && l.includes('|')));
  return stop < 0 ? lines.length : start + stop;
}

/** Add a list item: it continues an open list of the same tag or opens a new one. */
function addItem(s: Blocks, ctx: BlockContext, tag: 'ul' | 'ol', text: string): Blocks {
  const closed = closeQuote(closePara(s, ctx), ctx);
  const open = closed.list?.tag === tag ? closed : { ...closeList(closed, ctx), list: null };
  return { ...open, list: { tag, items: [...(open.list?.items ?? []), text] } };
}

/** The state after one line inside a code fence. */
function fenceStep(s: Blocks, fence: readonly string[], line: string): Blocks {
  return /^```/.test(line.trim())
    ? { ...emit(s, `<pre><code>${fence.join('\n')}</code></pre>`), fence: null }
    : { ...s, fence: [...fence, line] };
}

/** The state after the line at `i`. */
function blockStep(s: Blocks, ctx: BlockContext, i: number): Blocks {
  if (i < s.skipTo) return s;
  if (s.fence) return fenceStep(s, s.fence, ctx.lines[i]);
  const t = ctx.lines[i].trim();
  const line = blockLine(t, ctx.lines[i + 1]);
  switch (line.kind) {
    case 'fence':
      return { ...closeAll(s, ctx), fence: [] };
    case 'blank':
      return closeAll(s, ctx);
    case 'heading': {
      const lvl = Math.min(line.hashes + ctx.offset, 6);
      return emit(closeAll(s, ctx), `<h${lvl}>${ctx.inline(line.text)}</h${lvl}>`);
    }
    case 'rule':
      return emit(closeAll(s, ctx), '<hr>');
    case 'table': {
      const end = tableEnd(ctx.lines, i + 2);
      const rows = ctx.lines.slice(i + 2, end).map(tableCells);
      const table = renderTable(line.head, line.align, rows, ctx.inline);
      return { ...emit(closeAll(s, ctx), table), skipTo: end };
    }
    case 'item':
      return addItem(s, ctx, line.tag, line.text);
    case 'quote': {
      const closed = closeList(closePara(s, ctx), ctx);
      return { ...closed, quote: [...closed.quote, line.text] };
    }
    case 'text': {
      const closed = closeQuote(closeList(s, ctx), ctx);
      return { ...closed, para: [...closed.para, t] };
    }
    default:
      return assertNever(line);
  }
}

const NO_BLOCKS: Blocks = { out: [], para: [], list: null, quote: [], fence: null, skipTo: 0 };

/** The blocks of lines that are escaped already. A blockquote renders its lines again. */
function renderBlocks(lines: readonly string[], offset: number, inline: Inline): string {
  const ctx: BlockContext = { lines, offset, inline };
  const scanned = lines.reduce<Blocks>((s, _line, i) => blockStep(s, ctx, i), NO_BLOCKS);
  const fenced = scanned.fence
    ? emit(scanned, `<pre><code>${scanned.fence.join('\n')}</code></pre>`)
    : scanned;
  return closeAll(fenced, ctx).out.join('\n');
}
