import { Node, mergeAttributes } from '@tiptap/core';

/**
 * The vote callout of the protocol as one card.
 *
 * The protocol writes a vote as
 *
 *     > [!abstimmung] **Frage**
 *     > ja: 3, nein: 1, enthaltung: 0
 *
 * The render service reads the counts from the tally line and renders its tally box.
 * The editor shows the same block as a card and writes it back line for line, so the
 * Markdown that leaves the editor is the Markdown that came in. The card is one atom:
 * it is selected and deleted as a whole, its text is not edited in place.
 *
 * The card shows a caption, the question, the counts and a bar of the counts. The
 * consumer can add what the Markdown does not hold through a resolver
 * (`VoteCalloutInfo`): the caption with the time and the majority rule, the result
 * under that rule, and the labels in the language of the page.
 */

const MARKER = /^\[!(abstimmung|vote)\]\s*/i;

const TALLY: Record<'yes' | 'no' | 'abstain', RegExp> = {
  yes: /(?:ja|yes)\s*[:=]?\s*(\d+)/i,
  no: /(?:nein|no)\s*[:=]?\s*(\d+)/i,
  abstain: /(?:enthaltung|enth\.?|abstain)\s*[:=]?\s*(\d+)/i,
};

/** A line carries the counts when at least two of the three appear, as in pytex. */
function isTallyLine(line: string): boolean {
  return Object.values(TALLY).filter((rx) => rx.test(line)).length >= 2;
}

function count(line: string, key: keyof typeof TALLY): number {
  const match = TALLY[key].exec(line);
  return match ? Number(match[1]) : 0;
}

/** Inline emphasis and code markers drop for the card text; the source keeps them. */
function plainText(markdown: string): string {
  return markdown.replace(/\*\*|__|`/g, '').trim();
}

export interface VoteCard {
  kind: string;
  question: string;
  tally: { yes: number; no: number; abstain: number } | null;
  body: string[];
  result: 'passed' | 'rejected' | 'tie' | 'none';
}

/** Read the card from the raw callout lines, the marker line first. */
export function parseVoteCallout(raw: string): VoteCard {
  const lines = raw.split('\n');
  const first = lines[0] ?? '';
  const marker = MARKER.exec(first);
  const kind = marker ? marker[1].toLowerCase() : 'abstimmung';
  const question = plainText(first.replace(MARKER, ''));
  const rest = lines.slice(1).map((l) => l.trim()).filter((l) => l.length > 0);
  const tallyLine = rest.find(isTallyLine);
  const tally = tallyLine
    ? { yes: count(tallyLine, 'yes'), no: count(tallyLine, 'no'), abstain: count(tallyLine, 'abstain') }
    : null;
  const body = rest.filter((l) => l !== tallyLine).map(plainText);
  const result: VoteCard['result'] = !tally
    ? 'none'
    : tally.yes > tally.no
      ? 'passed'
      : tally.yes < tally.no
        ? 'rejected'
        : 'tie';
  return { kind, question, tally, body, result };
}

/**
 * What the consumer knows about the vote of a callout. The Markdown holds only the
 * question and the counts; the time, the majority rule and the result under that rule
 * come from the consumer, which knows the vote.
 */
export interface VoteCalloutInfo {
  /** The line above the question, for example "Beschluss · 18:52 · Einfache Mehrheit". */
  caption?: string | null;
  /** The result under the majority rule of the vote. A tie is a rejection. */
  result?: { label: string; tone: 'passed' | 'rejected' } | null;
  /** The labels of the counts and of the result, in the language of the page. */
  labels?: { yes: string; no: string; abstain: string; result: string } | null;
}

/** Find the info of a callout by its question (the bold text of the marker line). */
export type VoteCalloutResolver = (question: string) => VoteCalloutInfo | null;

/** The options of the node: a getter, so that a node view reads the current resolver. */
export interface VoteCalloutOptions {
  resolver: () => VoteCalloutResolver | null;
  /** The live node views. The editor renders them again when the resolver changes. */
  views: Set<VoteCalloutView> | null;
}

/** A node view that can render its card again with new info. */
export interface VoteCalloutView {
  render(): void;
}

const DEFAULT_LABELS = { yes: 'Ja', no: 'Nein', abstain: 'Enthaltung', result: 'Ergebnis' };

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The ballot box icon of the caption line (the `vote` icon of the kit). */
function voteIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'mde__voteIcon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of [
    'M7 11V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7',
    'm9.5 7 1.8 1.8L14.5 5.5',
    'M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    'M8 15h8',
  ]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Fill the card of a callout: the caption, the question, the other lines, the counts
 * with the result, and a bar of the counts.
 *
 * Without info the caption is the kind of the callout and no result shows: only the
 * consumer knows the majority rule. `data-result` then keeps the plain count
 * comparison for the styles (`passed`, `rejected`, `tie`, `none`).
 */
function fillCard(root: HTMLElement, raw: string, info: VoteCalloutInfo | null): void {
  const card = parseVoteCallout(raw);
  const labels = info?.labels ?? DEFAULT_LABELS;
  root.replaceChildren();
  root.className = 'mde__vote';
  root.dataset['result'] = info?.result ? info.result.tone : card.result;

  const head = el('div', 'mde__voteHead');
  head.appendChild(voteIcon());
  const kind = card.kind.charAt(0).toUpperCase() + card.kind.slice(1);
  head.appendChild(el('span', 'mde__voteKind', info?.caption || kind));
  root.appendChild(head);

  if (card.question) root.appendChild(el('div', 'mde__voteQ', card.question));
  for (const line of card.body) root.appendChild(el('div', 'mde__voteBody', line));

  if (!card.tally) return;
  const tally = card.tally;
  const keys = Object.keys(TALLY) as (keyof typeof TALLY)[];
  const grid = el('div', 'mde__voteCounts');
  for (const key of keys) {
    const cell = el('div', 'mde__voteCell');
    cell.appendChild(el('span', 'mde__voteLabel', labels[key]));
    cell.appendChild(el('span', 'mde__voteNum', String(tally[key])));
    grid.appendChild(cell);
  }
  if (info?.result) {
    const cell = el('div', 'mde__voteCell mde__voteCell--result');
    cell.appendChild(el('span', 'mde__voteLabel', labels.result));
    cell.appendChild(el('span', 'mde__voteResult', info.result.label));
    grid.appendChild(cell);
  }
  root.appendChild(grid);

  const total = tally.yes + tally.no + tally.abstain;
  if (total > 0) {
    const bar = el('div', 'mde__voteBar');
    bar.setAttribute('aria-hidden', 'true');
    for (const key of keys) {
      if (!tally[key]) continue;
      const part = el('span', `mde__voteSeg mde__voteSeg--${key}`);
      part.style.flexGrow = String(tally[key]);
      bar.appendChild(part);
    }
    root.appendChild(bar);
  }
}

/** Read the info of a callout from the resolver; a failing resolver gives none. */
function infoFor(resolver: VoteCalloutResolver | null, raw: string): VoteCalloutInfo | null {
  if (!resolver) return null;
  const question = parseVoteCallout(raw).question;
  try {
    return resolver(question);
  } catch {
    return null;
  }
}

// The parts of markdown-it the block rule touches. The library ships no types of
// its own in this bundle, so the shape is written down here.
interface MdState {
  src: string;
  bMarks: number[];
  eMarks: number[];
  tShift: number[];
  line: number;
  push(type: string, tag: string, nesting: number): { content: string; map: [number, number] | null };
}
interface MarkdownIt {
  block: { ruler: { before(name: string, rule: string, fn: (state: MdState, start: number, end: number, silent: boolean) => boolean, options: { alt: string[] }): void } };
  renderer: { rules: Record<string, (tokens: { content: string }[], idx: number) => string> };
  utils: { escapeHtml(text: string): string };
}

function lineOf(state: MdState, line: number): string {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

/** `> [!abstimmung] …` and the quote lines that follow become one `vote_callout` token. */
function voteCalloutRule(state: MdState, startLine: number, endLine: number, silent: boolean): boolean {
  const first = lineOf(state, startLine);
  if (!/^>\s?\[!(abstimmung|vote)\]/i.test(first)) return false;
  if (silent) return true;
  let next = startLine;
  const lines: string[] = [];
  while (next < endLine) {
    const line = lineOf(state, next);
    if (!line.startsWith('>')) break;
    lines.push(line.replace(/^>\s?/, ''));
    next++;
  }
  const token = state.push('vote_callout', 'div', 0);
  token.content = lines.join('\n');
  token.map = [startLine, next];
  state.line = next;
  return true;
}

function voteCalloutPlugin(md: MarkdownIt): void {
  md.block.ruler.before('blockquote', 'vote_callout', voteCalloutRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.renderer.rules['vote_callout'] = (tokens, idx) =>
    `<div data-vote-callout="" data-raw="${md.utils.escapeHtml(tokens[idx].content)}"></div>\n`;
}

interface SerializerState {
  write(text: string): void;
  closeBlock(node: unknown): void;
}

export const VoteCallout = Node.create<VoteCalloutOptions>({
  name: 'voteCallout',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { resolver: () => null, views: null };
  },

  addAttributes() {
    return { raw: { default: '' } };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vote-callout]',
        getAttrs: (element) => ({ raw: (element as HTMLElement).getAttribute('data-raw') ?? '' }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-vote-callout': '', 'data-raw': HTMLAttributes['raw'] })];
  },

  addNodeView() {
    const options = this.options;
    return ({ node }) => {
      const dom = document.createElement('div');
      const raw = node.attrs['raw'] as string;
      const view: VoteCalloutView = {
        render: () => fillCard(dom, raw, infoFor(options.resolver(), raw)),
      };
      view.render();
      options.views?.add(view);
      return {
        dom,
        update: () => false,
        destroy: () => options.views?.delete(view),
      };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: { attrs: { raw: string } }) {
          const lines = node.attrs.raw.split('\n');
          state.write(lines.map((line) => (line ? `> ${line}` : '>')).join('\n'));
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownIt) {
            voteCalloutPlugin(md);
          },
        },
      },
    };
  },
});
