import { Extension } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import type { MarkType } from '@tiptap/pm/model';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { MASK, matchKnownName, type KnownName } from '@stupa-makers/ui-kit';

export interface AutoBlackoutOptions {
  /** The known names, read at each typed character. `null` or empty turns it off. */
  readonly names: () => readonly KnownName[] | null;
}

/**
 * The text of the textblock of the cursor up to the cursor. A text with the blackout mark
 * or a code mark and every inline node that is no text count as `MASK`, so the offsets
 * are the positions in the textblock.
 */
function lineText(state: EditorState): string | null {
  const { selection } = state;
  if (!selection.empty) return null;
  const $from = selection.$from;
  const parent = $from.parent;
  if (!parent.isTextblock || parent.type.spec.code) return null;
  const ancestors = Array.from({ length: $from.depth }, (_v, i) => $from.node(i + 1));
  if (ancestors.some((n) => n.type.name === 'blackoutBlock')) return null;
  const text = Array.from({ length: parent.childCount }, (_v, i) => parent.child(i))
    .map((node) =>
      !node.isText || node.marks.some((m) => m.type.name === 'blackout' || m.type.spec.code === true)
        ? MASK.repeat(node.nodeSize)
        : (node.text ?? ''),
    )
    .join('');
  return text.slice(0, $from.parentOffset);
}

/** The transaction that puts the blackout mark around a known name before the cursor. */
export function autoBlackoutTransaction(
  state: EditorState,
  names: readonly KnownName[],
  mark: MarkType,
): Transaction | null {
  if (names.length === 0) return null;
  const text = lineText(state);
  const match = text ? matchKnownName(text, names) : null;
  if (!match) return null;
  const start = state.selection.$from.start();
  return closeHistory(state.tr.addMark(start + match.from, start + match.to, mark.create()));
}

/** Notes a typed character between the input and the next view update. */
class TypedFlag {
  private typed = false;

  /** Note a typed character. False lets the editor insert it. */
  set(): false {
    this.typed = true;
    return false;
  }

  /** True once after a typed character. */
  take(): boolean {
    const typed = this.typed;
    this.typed = false;
    return typed;
  }
}

/**
 * Black out a known name right after it is typed (000969). Only typed text counts: a
 * paste and a drop do not set the marker. The marker is a history step of its own, so
 * one undo removes it and keeps the name.
 */
export const AutoBlackout = Extension.create<AutoBlackoutOptions>({
  name: 'autoBlackout',

  addOptions() {
    return { names: () => null };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const mark = this.editor.schema.marks['blackout'];
    const typed = new TypedFlag();
    const apply = (view: EditorView): void => {
      const names = options.names();
      if (!mark || !names || view.isDestroyed) return;
      const tr = autoBlackoutTransaction(view.state, names, mark);
      if (!tr) return;
      view.dispatch(tr);
      view.dispatch(closeHistory(view.state.tr));
    };
    return [
      new Plugin({
        key: new PluginKey('autoBlackout'),
        props: {
          handleTextInput: () => typed.set(),
        },
        view: () => ({
          update: (view) => {
            if (!typed.take()) return;
            queueMicrotask(() => apply(view));
          },
        }),
      }),
    ];
  },
});
