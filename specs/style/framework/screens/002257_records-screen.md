---
id: "002257"
title: The records screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - screens/src/records-screen/records-screen.component.ts
scope:
  - shell
  - src/lib
---

# The records screen has a fixed interface

`app-records-screen` is a copy of the record pages of the administration of STUPA-Workflow
(Erzwungene Statuswechsel, Agent-Zugänge, Audit-Log, Versionen, Backups, Webhooks, Kalender,
Rollen, Gruppen-Zuordnung): a page in the detail pane with a head, filter chips and one row
group of records. It must have this interface:

```ts
head: ScreenHead
rows: LoadState<readonly ListRow[]>  // empty and error come with the rows
actions?: readonly Action[]          // head actions and FAB, placed by priority (002231)
filtersLabel?: string | null         // the name of the filter row for screen readers
skeleton?: number                    // grey rows on the first load, default 5
variant?: 'rows' | 'records'         // records: the denser row group of record tables
keepOnError?: boolean                // a load error keeps the rows or empty state shown before
```

Slots: `screenFilters` (optional, the filter chips of the page, built with kit chips; the screen
puts them in a sticky bar under the head) and `screenRecord` (optional, the content of a record
with kit components, for example the scopes of an agent grant; context: the row). The slot draws
one whole list item (`li`), and the list is then a `ul`. `screenListFoot` (optional) is a block
under the rows, for example the pager of Agent-Zugänge. `screenIntro` (optional) is a block
between the head and the filters, for example the chain check of the Audit-Log.

Outputs: `action: { key }`, `more: void`.

Behaviour:

- The head is the page header of the pane; the filter row sits in a sticky bar under it.
- The rows are one row group, a list named by the title; a row without the slot is a list item
  with the title, the meta parts joined by " · " on wrapping lines, and the link of the row.
- The first load shows `skeleton` grey rows; a reload with a filter keeps the previous rows
  (`loading.previous`). An empty state comes from the rows. A load error is a toast with
  "Erneut versuchen". `ready.more` adds a "Mehr laden" button at the end.
- In the pane of a list/detail page the screen starts 32 px below the top of the sheet, as the
  settings screen does (002244).

Reason: Every record page of the administration then has the same head, chips, rows and states,
and the app writes no styles for them.

Test: Unit tests and a jest-axe test of `app-records-screen`, at phone, narrow and wide width.
