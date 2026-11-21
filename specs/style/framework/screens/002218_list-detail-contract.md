---
id: "002218"
title: The list/detail screen owns the list, the panes and the URL state
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - screens/src/list-detail-screen/list-detail-screen.component.ts
scope:
  - shell
---

# The list/detail screen owns the list, the panes and the URL state

`app-list-detail-screen` must take the rows as `ListRow[]` (title, meta parts, status, avatar,
link, selectable), the groups, the filters, the sort, the search and the actions, and must show
the detail of a child route in its detail pane. The screen must keep the open row, the search,
the filters, the sort and the tab in the URL, under the parameter names that its config gives.
The screen must report a change through outputs and must not read data itself. The screen must
bring the long-press selection, the selection bar, the empty pane, the skeleton rows and the
load-more row.

Reason: Every list page then has the same geometry, URL, selection and loading.

Test: Unit tests of the screen with the fixtures of `/testing`.
