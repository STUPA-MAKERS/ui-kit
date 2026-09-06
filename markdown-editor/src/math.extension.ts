import { InputRule } from '@tiptap/core';
import { BlockMath, InlineMath } from '@tiptap/extension-mathematics';

/**
 * TeX math in Markdown: `$…$` inline and `$$…$$` as a block, rendered with KaTeX.
 *
 * The Tiptap nodes render and edit the formula. These two extensions add the
 * Markdown side: markdown-it rules that read the dollar syntax on the way in, and
 * serializers that write it back on the way out. pytex renders the same source as
 * LaTeX in the PDF, so the editor and the document read one syntax.
 */

// The parts of markdown-it the rules touch. The library ships no types in this
// bundle, so the shape is written down here.
interface MdToken {
  content: string;
  map: [number, number] | null;
}
interface MdInlineState {
  src: string;
  pos: number;
  posMax: number;
  push(type: string, tag: string, nesting: number): MdToken;
}
interface MdBlockState {
  src: string;
  bMarks: number[];
  eMarks: number[];
  tShift: number[];
  line: number;
  push(type: string, tag: string, nesting: number): MdToken;
}
interface MarkdownIt {
  inline: { ruler: { after(name: string, rule: string, fn: (state: MdInlineState, silent: boolean) => boolean): void } };
  block: { ruler: { before(name: string, rule: string, fn: (state: MdBlockState, start: number, end: number, silent: boolean) => boolean, options: { alt: string[] }): void } };
  renderer: { rules: Record<string, (tokens: MdToken[], idx: number) => string> };
  utils: { escapeHtml(text: string): string };
}
interface SerializerState {
  write(text: string): void;
  closeBlock(node: unknown): void;
}

const DOLLAR = 0x24;

/**
 * `$…$` on one line. The opening `$` is not followed by white space, the closing
 * `$` is not preceded by white space and not followed by a digit, so that
 * "$5 und $6" stays a price and never a formula. A `\$` inside the formula is a
 * dollar sign and does not close it. The first other `$` must close the formula:
 * a lone dollar in a sentence stays text instead of swallowing the rest of it.
 */
function inlineMathRule(state: MdInlineState, silent: boolean): boolean {
  const src = state.src;
  const start = state.pos;
  if (src.charCodeAt(start) !== DOLLAR || src.charCodeAt(start + 1) === DOLLAR) return false;
  const first = src[start + 1];
  if (first === undefined || /\s/.test(first)) return false;
  let end = start + 1;
  for (;;) {
    end = src.indexOf('$', end);
    if (end === -1 || end >= state.posMax) return false;
    const before = src[end - 1];
    if (before === '\\') {
      end++;
      continue;
    }
    if (before === undefined || /\s/.test(before)) return false;
    break;
  }
  const latex = src.slice(start + 1, end);
  if (!latex.trim() || latex.includes('\n')) return false;
  const after = src[end + 1];
  if (after !== undefined && /\d/.test(after)) return false;
  if (!silent) {
    const token = state.push('math_inline', 'span', 0);
    token.content = latex;
  }
  state.pos = end + 1;
  return true;
}

function lineOf(state: MdBlockState, line: number): string {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

/** `$$ … $$` on one line, or `$$` opening a block that a line ending in `$$` closes. */
function blockMathRule(state: MdBlockState, startLine: number, endLine: number, silent: boolean): boolean {
  const first = lineOf(state, startLine).trim();
  if (!first.startsWith('$$')) return false;
  let latex: string;
  let next = startLine + 1;
  if (first.length > 4 && first.endsWith('$$')) {
    latex = first.slice(2, -2).trim();
  } else {
    const parts = [first.slice(2)];
    let closed = false;
    while (next < endLine) {
      const line = lineOf(state, next).trim();
      next++;
      if (line.endsWith('$$')) {
        parts.push(line.slice(0, -2));
        closed = true;
        break;
      }
      parts.push(line);
    }
    if (!closed) return false;
    latex = parts.join('\n').trim();
  }
  if (!latex) return false;
  if (silent) return true;
  const token = state.push('math_block', 'div', 0);
  token.content = latex;
  token.map = [startLine, next];
  state.line = next;
  return true;
}

function mathPlugin(md: MarkdownIt): void {
  md.inline.ruler.after('escape', 'math_inline', inlineMathRule);
  md.block.ruler.before('fence', 'math_block', blockMathRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.renderer.rules['math_inline'] = (tokens, idx) =>
    `<span data-type="inline-math" data-latex="${md.utils.escapeHtml(tokens[idx].content)}"></span>`;
  md.renderer.rules['math_block'] = (tokens, idx) =>
    `<div data-type="block-math" data-latex="${md.utils.escapeHtml(tokens[idx].content)}"></div>\n`;
}

/** Inline math with the Markdown dollar syntax. */
export const InlineMathMarkdown = InlineMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /(?<!\$)\$([^\s$](?:[^$\n]*[^\s$])?)\$$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ latex: match[1] }));
        },
      }),
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: { attrs: { latex: string } }) {
          state.write(`$${node.attrs.latex}$`);
        },
        parse: {
          setup(md: MarkdownIt) {
            mathPlugin(md);
          },
        },
      },
    };
  },
});

/** Block math with the Markdown double-dollar syntax. The inline node registers the rules. */
export const BlockMathMarkdown = BlockMath.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /^\$\$([^$\n]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const from = state.doc.resolve(range.from);
          const whole =
            from.depth > 0 &&
            from.parent.isTextblock &&
            range.from === from.start() &&
            range.to === from.end() &&
            from.node(-1).canReplaceWith(from.index(-1), from.indexAfter(-1), this.type);
          const target = whole ? { from: from.before(), to: from.after() } : range;
          tr.replaceWith(target.from, target.to, this.type.create({ latex: match[1].trim() }));
        },
      }),
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: { attrs: { latex: string } }) {
          state.write(`$$\n${node.attrs.latex}\n$$`);
          state.closeBlock(node);
        },
      },
    };
  },
});
