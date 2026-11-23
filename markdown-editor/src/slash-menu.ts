import { signal } from '@angular/core';
import type { IconName } from '@stupa-makers/ui-kit';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/** One command of the slash menu (§002769). The consumer of the editor runs it. */
export interface SlashCommand {
  readonly id: string;
  readonly icon: IconName;
  /** The name in the language of the UI. The typed text filters by it. */
  readonly label: string;
}

/** The slash text at the cursor: where its `/` is and the text behind it. */
export interface SlashQuery {
  readonly from: number;
  readonly query: string;
}

/** The open menu: the place of its `/`, the commands that fit and the marked one. */
export interface SlashMenuState {
  readonly from: number;
  readonly commands: readonly SlashCommand[];
  readonly active: number;
}

/**
 * The `/` at the start of a word in front of the cursor, with the text behind it. `null`
 * with a selection, in code, inside a word and after a space behind the `/`.
 */
export function slashQueryAt(state: EditorState): SlashQuery | null {
  const { $from, empty } = state.selection;
  if (!empty || !$from.parent.isTextblock) return null;
  if ($from.parent.type.spec.code || $from.marks().some((mark) => mark.type.spec.code)) return null;
  const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
  const match = /(?:^|\s)\/([^\s/]*)$/.exec(before);
  if (!match) return null;
  const query = match[1];
  return { from: $from.pos - query.length - 1, query };
}

/** The commands with a word in their name that starts with `query`, in any case (§002770). */
export function filterSlashCommands(
  commands: readonly SlashCommand[],
  query: string,
): readonly SlashCommand[] {
  const q = query.toLocaleLowerCase();
  if (!q) return commands;
  return commands.filter((command) =>
    command.label
      .toLocaleLowerCase()
      .split(/[\s-]+/)
      .some((word) => word.startsWith(q)),
  );
}

/**
 * The slash menu of the Markdown editor (§002769, §002770).
 *
 * A typed `/` at the start of a word opens it. The `/` and the text behind it stay in the
 * document and filter the commands. The menu closes when the text fits no command, when
 * the cursor leaves the text, and on Escape; the typed text then stays. A run removes the
 * text and gives the ID of the command to `run`.
 */
export class SlashMenu {
  private readonly _state = signal<SlashMenuState | null>(null);
  /** The open menu, or `null`. */
  readonly state = this._state.asReadonly();

  constructor(
    private readonly commands: () => readonly SlashCommand[],
    private readonly run: (id: string) => void,
  ) {}

  /** Follow a change of the document or of the cursor. */
  onTransaction(view: EditorView, transaction: Transaction): void {
    const open = this._state();
    const at = view.editable ? slashQueryAt(view.state) : null;
    if (!at) return this.close();
    if (!open && !this.typedSlash(at, transaction)) return;
    if (open && open.from !== at.from) return this.close();
    const commands = filterSlashCommands(this.commands(), at.query);
    if (!commands.length) return this.close();
    const marked = open?.commands[open.active]?.id;
    const active = Math.max(0, commands.findIndex((command) => command.id === marked));
    this._state.set({ from: at.from, commands, active });
  }

  /** The transaction put the `/` of `at` into the document, in front of the cursor. */
  private typedSlash(at: SlashQuery, transaction: Transaction): boolean {
    if (!transaction.docChanged || at.query !== '') return false;
    const before = transaction.before;
    if (at.from + 1 > before.content.size) return true;
    return before.textBetween(at.from, at.from + 1, '\n', '￼') !== '/';
  }

  /** The keys of the open menu. Returns true when the menu took the key. */
  onKeyDown(view: EditorView, event: KeyboardEvent): boolean {
    const open = this._state();
    if (!open) return false;
    switch (event.key) {
      case 'ArrowDown':
        this.mark((open.active + 1) % open.commands.length);
        return true;
      case 'ArrowUp':
        this.mark((open.active + open.commands.length - 1) % open.commands.length);
        return true;
      case 'Enter':
      case 'Tab':
        this.pick(view, open.commands[open.active].id);
        return true;
      case 'Escape':
        this.close();
        return true;
      default:
        return false;
    }
  }

  /** Mark the command at `index`. */
  mark(index: number): void {
    const open = this._state();
    if (open && index !== open.active) this._state.set({ ...open, active: index });
  }

  /** Run a command: remove the slash text and tell the consumer. */
  pick(view: EditorView, id: string): void {
    const open = this._state();
    if (!open) return;
    this.close();
    view.dispatch(view.state.tr.delete(open.from, view.state.selection.from));
    view.focus();
    this.run(id);
  }

  close(): void {
    if (this._state()) this._state.set(null);
  }
}
