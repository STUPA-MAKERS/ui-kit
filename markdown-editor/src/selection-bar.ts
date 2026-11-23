import type { IconName, UiKitTextKey } from '@stupa-makers/ui-kit';
import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

/** The inline formats of the format bar at a selection (app spec 002781), in this order. */
export const SELECTION_FORMATS = ['bold', 'italic', 'blackout'] as const;

/** A format of the format bar at a selection. */
export type SelectionFormat = (typeof SELECTION_FORMATS)[number];

/** One button of the format bar: its format, its icon and its text. */
export interface SelectionTool {
  readonly format: SelectionFormat;
  readonly icon: IconName;
  readonly label: UiKitTextKey;
}

export const SELECTION_TOOLS: readonly SelectionTool[] = [
  { format: 'bold', icon: 'bold', label: 'editorSelection.bold' },
  { format: 'italic', icon: 'italic', label: 'editorSelection.italic' },
  { format: 'blackout', icon: 'eyeslash', label: 'editorSelection.blackout' },
];

/**
 * The place of the format bar, in px from the top left corner of the editor element.
 * `above`: the bar stands above the first line of the selection, so `top` is its bottom
 * edge; else `top` is its top edge below the last line.
 */
export interface SelectionBarPlace {
  readonly left: number;
  readonly top: number;
  readonly above: boolean;
}

/** The gap between the selection and the bar. */
const GAP = 6;

/**
 * The selection holds text that the inline formats apply to: a text selection that is
 * not empty and not in code. A node selection (an image, a formula) or a cell selection
 * of a table gets no bar.
 */
export function hasTextSelection(editor: Editor): boolean {
  const { selection } = editor.state;
  if (!(selection instanceof TextSelection) || selection.empty) return false;
  if (selection.$from.parent.type.spec.code) return false;
  return editor.state.doc.textBetween(selection.from, selection.to, ' ', ' ').trim() !== '';
}

interface Coords {
  readonly left: number;
  readonly top: number;
  readonly bottom: number;
}

/** The screen box of the start and of the end of the selection; `null` before the DOM. */
function selectionCoords(
  editor: Editor,
  from: number,
  to: number,
): { readonly start: Coords; readonly end: Coords } | null {
  try {
    return { start: editor.view.coordsAtPos(from, 1), end: editor.view.coordsAtPos(to, -1) };
  } catch {
    return null;
  }
}

/**
 * Measure the place of the format bar for the selection against `frame`, the editor
 * element (app spec 002782). The bar goes below the last line of the selection, with its
 * start at the start of the selection. When the visible area has no room for `size`
 * below the selection, the bar goes above the first line. The bar stays in the width of
 * the frame. Without a text selection it returns `null`.
 */
export function measureSelectionBar(
  editor: Editor,
  frame: HTMLElement,
  size: { readonly width: number; readonly height: number },
): SelectionBarPlace | null {
  if (!hasTextSelection(editor)) return null;
  const { from, to } = editor.state.selection;
  const coords = selectionCoords(editor, from, to);
  if (!coords) return null;
  const { start, end } = coords;
  const origin = frame.getBoundingClientRect();
  // The visible area: the window, cut to the frame when the frame scrolls itself.
  const viewport = frame.ownerDocument.defaultView?.innerHeight ?? Number.POSITIVE_INFINITY;
  const scrolls = frame.scrollHeight > frame.clientHeight;
  const visibleTop = scrolls ? Math.max(0, origin.top) : 0;
  const visibleBottom = scrolls ? Math.min(viewport, origin.top + frame.clientHeight) : viewport;
  const above =
    end.bottom + GAP + size.height > visibleBottom && start.top - GAP - size.height >= visibleTop;
  // A frame that scrolls moves the bar with its content, so the place counts from the
  // start of the content, not from the visible edge.
  const maxLeft = Math.max(0, origin.width - size.width);
  const left = Math.min(Math.max(0, start.left - origin.left), maxLeft) + frame.scrollLeft;
  const edge = above ? start.top - GAP : end.bottom + GAP;
  const top = edge - origin.top + frame.scrollTop;
  return { left: Math.round(left), top: Math.round(top), above };
}
