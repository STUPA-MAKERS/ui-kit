---
id: "002271"
title: The board views take the board, the rows, the list and the tiles
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - views/board/src/todo-board-view.component.ts
  - views/board/src/todo-board-rows-view.component.ts
  - views/board/src/todo-list-view.component.ts
  - views/board/src/todo-card-tile-view.component.ts
  - views/board/src/todo-move-sheet-view.component.ts
scope:
  - views/board
---

# The board views take the board, the rows, the list and the tiles

`/views/board` must export copies of these to-do components of STUPA-Workflow, with the same
behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-todo-board-view` | `app-todo-board-view` | the columns of a board: drag, keyboard drag, done preview, quick add, column menu; on the phone one page per column behind tabs |
| `app-todo-board-rows-view` | the view part of `app-todo-board-rows` | one row per board ("Meine To-Dos", "Alle"): collapse, drag and transfer between rows; on the phone one list per board |
| `app-todo-list-view` | `app-todo-list-view` | the list mode of a board: groups per column, due sort, done circle |
| `app-todo-card-tile-view` | `app-todo-card-tile` | one card: labels, title, first link, due date, checklist, comments, people, column tag |
| `app-todo-label-view`, `app-todo-due-view`, `app-todo-assignees-view` | the card facts | a label, a due date, the people of a card |
| `app-todo-move-sheet-view` | `app-todo-move-sheet` | the "Verschieben" sheet: column, place, "In anderes Board verschieben" |
| `app-todo-due-chip-view` | `app-todo-due-chip` | the due date of a card as a chip with the date picker of the browser |
| `app-todo-board-skeleton-view` | `app-todo-board-skeleton` | the board, the list and the rows while they load |

View models: the to-do types of STUPA-Workflow (`TodoBoard`, `TodoColumn`, `TodoCardTile`,
`TodoLabel`, `TodoLink`, `TodoAssignedBoard`, `TodoCardMove`), with the same fields, so the app
passes its API objects as they are. The board helpers (`boardRows`, the filters, the move
requests, the tile updates, `DROP_ENTER`) move with them. The inputs and outputs are those of the
app components.

The board page, the card detail, the dialogs, the board settings, the archive and the board
picker stay in the app.

App parts: the views know no route, no permission and no server.

- The rows view takes the rows that `boardRows` builds and emits `rowMove` (a move inside a
  board) and `rowTransfer` (a move to another board); the app reads the rows, takes the live
  changes and runs the moves and the transfers, with the toast and the rollback of a refused
  one.
- The rows view takes the link of a board head as a function (`boardLink`).

Texts: the views read their texts through `UI_KIT_INTL` (`todos.*`), so an app can map them to
its own catalogue.

Behaviour: every rule of the app components stays, and:

- A drag moves a card; the move sheet is the alternative without a drag (000515, 000148,
  001380).
- The column menu stands in the top right corner (001967).
- A refused move goes back (002221).

Reason: The board page then needs only data, and another app gets the same boards.

Test: The specs of the app components run against the views; unit tests and a jest-axe test of
each view with the fixtures of `/testing`.
