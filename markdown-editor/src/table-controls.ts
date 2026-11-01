import type { Editor } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';
import { TableMap, isInTable, selectedRect } from '@tiptap/pm/tables';

/**
 * The controls of the table at the cursor, in px from the top left corner of the editor
 * element: the grip of the cursor's column on the top edge, the grip of its row on the
 * start edge, the bar that adds a row below the table and the bar that adds a column at
 * its end, with the table menu above that bar.
 */
export interface TableControls {
  /** The top edge of the table. */
  top: number;
  /** The bottom edge of the table. */
  bottom: number;
  /** The start edge of the table. */
  left: number;
  /**
   * The visible part of the table from start to end. A wide table scrolls sideways in its
   * wrapper, so the bars cover only what shows.
   */
  visibleLeft: number;
  visibleRight: number;
  /** The centre of the cursor's column, or `null` while it is scrolled out of view. */
  colX: number | null;
  /** The centre of the cursor's row. */
  rowY: number;
}

/** The table at the cursor: its position, its map and the cell of the cursor. */
interface TableAt {
  tableStart: number;
  map: TableMap;
  row: number;
  col: number;
}

function tableAt(state: EditorState): TableAt | null {
  if (!isInTable(state)) return null;
  const rect = selectedRect(state);
  return { tableStart: rect.tableStart, map: rect.map, row: rect.top, col: rect.left };
}

/**
 * Measure the controls of the table at the cursor against `frame`, the editor element.
 * Outside a table, or before the table is in the DOM, it returns `null`.
 */
export function measureTableControls(editor: Editor, frame: HTMLElement): TableControls | null {
  const at = tableAt(editor.state);
  if (!at) return null;
  const cellPos = at.tableStart + at.map.map[at.row * at.map.width + at.col];
  const cell = editor.view.nodeDOM(cellPos);
  if (!(cell instanceof HTMLElement)) return null;
  const table = cell.closest('table');
  const row = cell.closest('tr');
  if (!table || !row) return null;
  const wrapper = table.closest<HTMLElement>('.tableWrapper') ?? table;
  const origin = frame.getBoundingClientRect();
  const t = table.getBoundingClientRect();
  const w = wrapper.getBoundingClientRect();
  const c = cell.getBoundingClientRect();
  const r = row.getBoundingClientRect();
  // The inner box of the wrapper: its scroll bar and its padding do not show the table.
  const style = getComputedStyle(wrapper);
  const innerLeft = w.left + wrapper.clientLeft + parseFloat(style.paddingLeft || '0');
  const innerRight =
    w.left + wrapper.clientLeft + wrapper.clientWidth - parseFloat(style.paddingRight || '0');
  const visibleLeft = Math.max(t.left, innerLeft);
  const visibleRight = Math.min(t.right, innerRight);
  const colX = c.left + c.width / 2;
  return {
    top: t.top - origin.top,
    bottom: t.bottom - origin.top,
    left: t.left - origin.left,
    visibleLeft: visibleLeft - origin.left,
    visibleRight: visibleRight - origin.left,
    colX: colX >= visibleLeft && colX <= visibleRight ? colX - origin.left : null,
    rowY: r.top + r.height / 2 - origin.top,
  };
}

/** Put the cursor into the cell at `row` and `col` of the table that starts at `tableStart`. */
function selectCell(editor: Editor, tableStart: number, row: number, col: number): void {
  const { state } = editor;
  const map = TableMap.get(state.doc.resolve(tableStart).parent);
  const r = Math.min(row, map.height - 1);
  const c = Math.min(col, map.width - 1);
  const cellPos = tableStart + map.map[r * map.width + c];
  // The text of a cell starts inside its paragraph: one step into the cell, one into
  // the paragraph.
  const sel = TextSelection.create(state.doc, cellPos + 2);
  editor.view.dispatch(state.tr.setSelection(sel));
}

/**
 * Add a row below the last row (`row`) or a column after the last column (`column`) of
 * the table at the cursor, and put the cursor into the new cell of the cursor's column
 * or row. Outside a table it does nothing and returns false.
 */
export function appendToTable(editor: Editor, what: 'row' | 'column'): boolean {
  const at = tableAt(editor.state);
  if (!at) return false;
  const lastRow = at.map.height - 1;
  const lastCol = at.map.width - 1;
  if (what === 'row') {
    selectCell(editor, at.tableStart, lastRow, at.col);
    if (!editor.commands.addRowAfter()) return false;
    selectCell(editor, at.tableStart, lastRow + 1, at.col);
  } else {
    selectCell(editor, at.tableStart, at.row, lastCol);
    if (!editor.commands.addColumnAfter()) return false;
    selectCell(editor, at.tableStart, at.row, lastCol + 1);
  }
  editor.commands.focus();
  return true;
}
