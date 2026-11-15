import { Extension } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import type { MarkType } from '@tiptap/pm/model';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { MASK, matchKnownName, type KnownName } from './known-names';

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
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'blackoutBlock') return null;
  }
  let text = '';
  parent.forEach((node) => {
    const masked =
      !node.isText || node.marks.some((m) => m.type.name === 'blackout' || m.type.spec.code === true);
    text += masked ? MASK.repeat(node.nodeSize) : (node.text ?? '');
  });
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
    let typed = false;
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
          handleTextInput: () => {
            typed = true;
            return false;
          },
        },
        view: () => ({
          update: (view) => {
            if (!typed) return;
            typed = false;
            queueMicrotask(() => apply(view));
          },
        }),
      }),
    ];
  },
});
