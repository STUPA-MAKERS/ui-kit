import { Node, mergeAttributes } from '@tiptap/core';

/**
 * The pytex vote callout as one card.
 *
 * The protocol writes a vote as
 *
 *     > [!abstimmung] **Frage**
 *     > ja: 3, nein: 1, enthaltung: 0
 *
 * pytex reads the counts from the tally line and renders its tally box. The editor
 * shows the same block as a card and writes it back line for line, so the Markdown
 * that leaves the editor is the Markdown that came in. The card is one atom: it is
 * selected and deleted as a whole, its text is not edited in place.
 */

const MARKER = /^\[!(abstimmung|vote)\]\s*/i;

const TALLY: Record<'yes' | 'no' | 'abstain', RegExp> = {
  yes: /(?:ja|yes)\s*[:=]?\s*(\d+)/i,
  no: /(?:nein|no)\s*[:=]?\s*(\d+)/i,
  abstain: /(?:enthaltung|enth\.?|abstain)\s*[:=]?\s*(\d+)/i,
};

const TALLY_LABEL: Record<keyof typeof TALLY, string> = {
  yes: 'Ja',
  no: 'Nein',
  abstain: 'Enthaltung',
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

function renderCard(raw: string): HTMLElement {
  const card = parseVoteCallout(raw);
  const root = document.createElement('div');
  root.className = 'mde__vote';
  root.dataset['result'] = card.result;

  const head = document.createElement('div');
  head.className = 'mde__voteHead';
  const kind = document.createElement('span');
  kind.className = 'mde__voteKind';
  kind.textContent = card.kind.charAt(0).toUpperCase() + card.kind.slice(1);
  head.appendChild(kind);
  if (card.tally) {
    const tally = document.createElement('span');
    tally.className = 'mde__voteTally';
    tally.textContent = (Object.keys(TALLY) as (keyof typeof TALLY)[])
      .map((key) => `${TALLY_LABEL[key]} ${card.tally![key]}`)
      .join(' · ');
    head.appendChild(tally);
  }
  root.appendChild(head);

  if (card.question) {
    const question = document.createElement('div');
    question.className = 'mde__voteQ';
    question.textContent = card.question;
    root.appendChild(question);
  }
  for (const line of card.body) {
    const p = document.createElement('div');
    p.className = 'mde__voteBody';
    p.textContent = line;
    root.appendChild(p);
  }
  return root;
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

export const VoteCallout = Node.create({
  name: 'voteCallout',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

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
    return ({ node }) => ({
      dom: renderCard(node.attrs['raw'] as string),
      update: () => false,
    });
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
