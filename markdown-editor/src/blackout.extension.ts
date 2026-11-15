import { Mark, Node, markInputRule, mergeAttributes } from '@tiptap/core';

/**
 * A segment that the public protocol blacks out: `%%Name%%` in Markdown.
 *
 * The mark shows the text with a dashed outline and the tooltip of the consumer.
 * markdown-it reads the `%%` pairs on the way in, the serializer writes them back on the
 * way out. A `\%%` is a literal `%%`. The marked text is plain text: the mark excludes
 * every other mark.
 *
 * A block that the public protocol blacks out: two lines that hold only `%%`, with any
 * blocks between them (paragraphs, lists, images, embedded PDFs). The node shows its blocks
 * in one box with the dashed outline and the tooltip. `toggleBlackout` switches the mark on
 * a selection in one block, and the block on a selection over more than one block, on an
 * empty paragraph and in a block.
 */

interface MdToken {
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens and state; a rule must write them
  content: string;
}
interface MdInlineState {
  readonly src: string;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens and state; a rule must write them
  pos: number;
  readonly posMax: number;
  push(type: string, tag: string, nesting: number): MdToken;
}
interface MarkdownIt {
  readonly inline: { readonly ruler: { after(name: string, rule: string, fn: (state: MdInlineState, silent: boolean) => boolean): void } };
  readonly renderer: { readonly rules: Record<string, (tokens: readonly MdToken[], idx: number) => string> };
  readonly utils: { escapeHtml(text: string): string };
}

/**
 * `%%…%%` on one line with a non-empty text. A `%%` right after a `%` starts nothing, so the
 * empty marker `%%%%` stays text.
 */
function blackoutRule(state: MdInlineState, silent: boolean): boolean {
  const src = state.src;
  const start = state.pos;
  if (!src.startsWith('%%', start) || src[start - 1] === '\\' || src[start - 1] === '%') return false;
  const end = src.indexOf('%%', start + 2);
  if (end < 0 || end + 2 > state.posMax) return false;
  const text = src.slice(start + 2, end);
  if (!text.trim() || text.includes('\n')) return false;
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens and state; a rule must write them
  if (!silent) state.push('blackout', 'span', 0).content = text;
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens and state; a rule must write them
  state.pos = end + 2;
  return true;
}

function blackoutPlugin(md: MarkdownIt): void {
  md.inline.ruler.after('escape', 'blackout', blackoutRule);
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens and state; a rule must write them
  md.renderer.rules['blackout'] = (tokens, idx) =>
    `<span data-blackout="">${md.utils.escapeHtml(tokens[idx].content)}</span>`;
}

interface MdBlockToken {
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens; a rule must write them
  map: [number, number] | null;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens; a rule must write them
  block: boolean;
}
interface MdBlockState {
  readonly src: string;
  readonly bMarks: readonly number[];
  readonly eMarks: readonly number[];
  readonly tShift: readonly number[];
  readonly md: { readonly block: { tokenize(state: MdBlockState, start: number, end: number): void } };
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable state; a rule must write it
  line: number;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable state; a rule must write it
  lineMax: number;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable state; a rule must write it
  parentType: string;
  push(type: string, tag: string, nesting: number): MdBlockToken;
}
interface MarkdownItBlock {
  readonly block: {
    readonly ruler: {
      before(
        name: string,
        rule: string,
        fn: (state: MdBlockState, start: number, end: number, silent: boolean) => boolean,
        options: { readonly alt: readonly string[] },
      ): void;
    };
  };
  readonly renderer: { readonly rules: Record<string, () => string> };
}

/** A fence line of a blackout block: only `%%`. */
const FENCE = /^[ \t]*%%[ \t]*$/;

function lineOf(state: MdBlockState, line: number): string {
  return state.src.slice(state.bMarks[line], state.eMarks[line]);
}

/** A fence line opens a block up to the next fence line. Without one, the line is text. */
function blackoutBlockRule(state: MdBlockState, startLine: number, endLine: number, silent: boolean): boolean {
  if (!FENCE.test(lineOf(state, startLine))) return false;
  const close = Array.from({ length: Math.max(0, endLine - startLine - 1) }, (_v, i) => startLine + 1 + i).find(
    (line) => FENCE.test(lineOf(state, line)),
  );
  if (close === undefined) return false;
  if (silent) return true;
  const oldParent = state.parentType;
  const oldMax = state.lineMax;
  /* eslint-disable functional/immutable-data -- markdown-it hands out mutable tokens and state; a rule must write them */
  state.parentType = 'blackout_block';
  state.lineMax = close;
  const open = state.push('blackout_block_open', 'div', 1);
  open.block = true;
  open.map = [startLine, close + 1];
  state.md.block.tokenize(state, startLine + 1, close);
  state.push('blackout_block_close', 'div', -1).block = true;
  state.parentType = oldParent;
  state.lineMax = oldMax;
  state.line = close + 1;
  /* eslint-enable functional/immutable-data */
  return true;
}

function blackoutBlockPlugin(md: MarkdownItBlock): void {
  md.block.ruler.before('fence', 'blackout_block', blackoutBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  // eslint-disable-next-line functional/immutable-data -- markdown-it keeps its renderer rules in a mutable map
  md.renderer.rules['blackout_block_open'] = () => '<div data-blackout-block="">';
  // eslint-disable-next-line functional/immutable-data -- markdown-it keeps its renderer rules in a mutable map
  md.renderer.rules['blackout_block_close'] = () => '</div>\n';
}

interface BlockSerializerState {
  write(text: string): void;
  ensureNewLine(): void;
  renderContent(node: unknown): void;
  closeBlock(node: unknown): void;
}

export interface BlackoutOptions {
  /** The tooltip of a marked segment. */
  readonly title: () => string;
}

export const Blackout = Mark.create<BlackoutOptions>({
  name: 'blackout',
  excludes: '_',
  inclusive: false,
  addOptions() {
    return { title: () => '' };
  },
  parseHTML() {
    return [{ tag: 'span[data-blackout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-blackout': '', class: 'mde-blackout', title: this.options.title() }),
      0,
    ];
  },
  addCommands() {
    return {
      toggleBlackout:
        () =>
        ({ state, commands }) => {
          const { $from, $to, empty } = state.selection;
          const inBlock = Array.from({ length: $from.depth }, (_v, i) => $from.node(i + 1)).some(
            (n) => n.type.name === 'blackoutBlock',
          );
          const marked = state.doc.rangeHasMark($from.pos, $to.pos, this.type) || !!this.type.isInSet($from.marks());
          if (inBlock && !marked) return commands.lift('blackoutBlock');
          const manyBlocks = !$from.sameParent($to);
          const emptyLine = empty && $from.parent.isTextblock && $from.parent.content.size === 0;
          if (manyBlocks || emptyLine) return commands.wrapIn('blackoutBlock');
          return commands.toggleMark(this.name);
        },
    };
  },
  addKeyboardShortcuts() {
    return { 'Mod-Shift-x': () => this.editor.commands.toggleBlackout() };
  },
  addInputRules() {
    return [markInputRule({ find: /(?<![\\%])%%([^%\n]+)%%$/, type: this.type })];
  },
  addStorage() {
    return {
      markdown: {
        serialize: { open: '%%', close: '%%', mixable: false, expelEnclosingWhitespace: true },
        parse: {
          setup(md: MarkdownIt) {
            blackoutPlugin(md);
          },
        },
      },
    };
  },
});

/** The block node of a blacked-out block. */
export const BlackoutBlock = Node.create<BlackoutOptions>({
  name: 'blackoutBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  addOptions() {
    return { title: () => '' };
  },
  parseHTML() {
    return [{ tag: 'div[data-blackout-block]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-blackout-block': '',
        class: 'mde-blackout-block',
        title: this.options.title(),
      }),
      0,
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize(state: BlockSerializerState, node: unknown) {
          state.write('%%');
          state.ensureNewLine();
          state.renderContent(node);
          state.ensureNewLine();
          state.write('%%');
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownItBlock) {
            blackoutBlockPlugin(md);
          },
        },
      },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    readonly blackout: { readonly toggleBlackout: () => ReturnType };
  }
}
