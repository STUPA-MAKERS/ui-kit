import { Node, mergeAttributes } from '@tiptap/core';

/**
 * A time note of a protocol: `> [!anmerkung HH:MM] text` in Markdown, one line.
 *
 * The editor shows the note as one grey, centered line: a time field, the time suffix of
 * the consumer and the text. The text holds inline Markdown and the blackout marks
 * (`%%Name%%`), because markdown-it reads the text with its inline rules. The time field
 * changes the time of the note, so the time stays editable after the insert.
 */

/** `[!anmerkung HH:MM]` at the start of a quote line, with the rest of the line. */
const LINE = /^>\s?\[!anmerkung\s+([01]?\d|2[0-3]):([0-5]\d)\]\s?(.*)$/i;

/** `HH:MM` with two digits for the hour. */
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The time with a two-digit hour, or null for a time that is no time of the day. */
export function normalTime(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  const time = match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
  return TIME.test(time) ? time : null;
}

/** The Markdown line of a time note. */
export function timeNoteLine(time: string, text = ''): string {
  return `> [!anmerkung ${time}] ${text}`.trimEnd();
}

interface MdToken {
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens; a rule must write them
  content: string;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens; a rule must write them
  info: string;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens; a rule must write them
  map: [number, number] | null;
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable tokens; a rule must write them
  children: unknown[] | null;
}
interface MdState {
  readonly src: string;
  readonly bMarks: readonly number[];
  readonly eMarks: readonly number[];
  readonly tShift: readonly number[];
  // eslint-disable-next-line functional/prefer-readonly-type -- markdown-it hands out mutable state; a rule must write it
  line: number;
  push(type: string, tag: string, nesting: number): MdToken;
}
interface MarkdownIt {
  readonly block: {
    readonly ruler: {
      before(
        name: string,
        rule: string,
        fn: (state: MdState, start: number, end: number, silent: boolean) => boolean,
        options: { readonly alt: readonly string[] },
      ): void;
    };
  };
  readonly renderer: { readonly rules: Record<string, (tokens: readonly MdToken[], idx: number) => string> };
  readonly utils: { escapeHtml(text: string): string };
}

/** One `> [!anmerkung HH:MM] text` line becomes a time note with an inline text. */
function timeNoteRule(state: MdState, startLine: number, _endLine: number, silent: boolean): boolean {
  const line = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]);
  const match = LINE.exec(line);
  if (!match) return false;
  if (silent) return true;
  const open = state.push('time_note_open', 'div', 1);
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens; a rule must write them
  open.info = `${match[1].padStart(2, '0')}:${match[2]}`;
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens; a rule must write them
  open.map = [startLine, startLine + 1];
  const inline = state.push('inline', '', 0);
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens; a rule must write them
  inline.content = match[3].trim();
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens; a rule must write them
  inline.map = [startLine, startLine + 1];
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable tokens; a rule must write them
  inline.children = [];
  state.push('time_note_close', 'div', -1);
  // eslint-disable-next-line functional/immutable-data -- markdown-it hands out mutable state; a rule must write it
  state.line = startLine + 1;
  return true;
}

function timeNotePlugin(md: MarkdownIt): void {
  md.block.ruler.before('blockquote', 'time_note', timeNoteRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  // eslint-disable-next-line functional/immutable-data -- markdown-it keeps its renderer rules in a mutable map
  md.renderer.rules['time_note_open'] = (tokens, idx) =>
    `<div data-time-note="" data-time="${md.utils.escapeHtml(tokens[idx].info)}">`;
  // eslint-disable-next-line functional/immutable-data -- markdown-it keeps its renderer rules in a mutable map
  md.renderer.rules['time_note_close'] = () => '</div>\n';
}

/** A DOM element with its attributes. */
function element(tag: string, attrs: Readonly<Record<string, string>>): HTMLElement {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
  return el;
}

interface SerializerState {
  write(text: string): void;
  renderInline(node: unknown): void;
  closeBlock(node: unknown): void;
}

export interface TimeNoteOptions {
  /** The text after the time, for example "Uhr". */
  readonly suffix: () => string;
  /** The accessible name of the time field. */
  readonly timeLabel: () => string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    readonly timeNote: {
      /** Insert a time note with `time` (`HH:MM`) after the block of the cursor. */
      readonly insertTimeNote: (time: string) => ReturnType;
    };
  }
}

export const TimeNote = Node.create<TimeNoteOptions>({
  name: 'timeNote',
  group: 'block',
  content: 'inline*',
  defining: true,

  addOptions() {
    return { suffix: () => 'Uhr', timeLabel: () => '' };
  },

  addAttributes() {
    return {
      time: {
        default: '00:00',
        parseHTML: (element) => normalTime(element.getAttribute('data-time') ?? '') ?? '00:00',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-time-note]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-time-note': '', 'data-time': node.attrs['time'] as string }),
      0,
    ];
  },

  addNodeView() {
    const options = this.options;
    return ({ node, getPos, editor }) => {
      const field = element('input', {
        type: 'time',
        class: 'mde-time-note__time',
        value: node.attrs['time'] as string,
        'aria-label': options.timeLabel(),
      }) as HTMLInputElement;
      field.toggleAttribute('disabled', !editor.isEditable);
      const head = element('span', { class: 'mde-time-note__head', contenteditable: 'false' });
      head.append(field, ` ${options.suffix()} · `);
      const content = element('span', { class: 'mde-time-note__text' });
      const dom = element('div', { class: 'mde-time-note' });
      dom.append(head, content);
      field.addEventListener('change', () => {
        const time = normalTime(field.value);
        const pos = typeof getPos === 'function' ? getPos() : undefined;
        if (time === null || pos === undefined) return;
        editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, 'time', time));
      });
      return {
        dom,
        contentDOM: content,
        stopEvent: (event) => event.target === field,
        ignoreMutation: (mutation) => head.contains(mutation.target),
        update: (next) => {
          if (next.type.name !== 'timeNote') return false;
          const time = next.attrs['time'] as string;
          if (field.value !== time) Reflect.set(field, 'value', time);
          field.toggleAttribute('disabled', !editor.isEditable);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertTimeNote:
        (time: string) =>
        ({ state, chain }) => {
          const valid = normalTime(time);
          if (valid === null) return false;
          const { $from } = state.selection;
          const after = $from.depth > 0 ? $from.after(1) : state.selection.from;
          return chain()
            .insertContentAt(after, { type: this.name, attrs: { time: valid } })
            .setTextSelection(after + 1)
            .run();
        },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: { attrs: { time: string } }) {
          state.write(`> [!anmerkung ${node.attrs.time}] `);
          state.renderInline(node);
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownIt) {
            timeNotePlugin(md);
          },
        },
      },
    };
  },
});
