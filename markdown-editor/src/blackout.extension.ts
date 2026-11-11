import { Mark, markInputRule, mergeAttributes } from '@tiptap/core';

/**
 * A segment that the public protocol blacks out: `%%Name%%` in Markdown.
 *
 * The mark shows the text with a dashed outline and the tooltip of the consumer.
 * markdown-it reads the `%%` pairs on the way in, the serializer writes them back on the
 * way out. A `\%%` is a literal `%%`. The marked text is plain text: the mark excludes
 * every other mark.
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
        ({ commands }) =>
          commands.toggleMark(this.name),
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

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    readonly blackout: { readonly toggleBlackout: () => ReturnType };
  }
}
