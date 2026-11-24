---
id: "002795"
title: The list/detail screen has a scope, tools and a body in place of the rows
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - screens/src/list-detail-screen/list-detail-screen.component.ts
  - screens/src/list-detail-screen/list-detail-screen.component.html
scope:
  - screens
---

# The list/detail screen has a scope, tools and a body in place of the rows

`app-list-detail-screen` must have these optional inputs and slots:

| Part | Place | Use |
|---|---|---|
| `scope: { label, chips }` and the output `scopeChange: { key, value }` | a group of chips above the search, named by the label; each chip is always set and has an icon | the chips that pick the source of the whole list, for example repository and ref; they are not URL filters |
| `screenFilters` | in the line of the filter chips, after the chips of `filters` | chips that are not a URL filter, for example the view of a drawing |
| `screenTools` | at the end of the line of the filter chips; on a phone it wraps to the start | a switch of the list, for example drawing or list |
| `screenBody` | in place of the rows, filling the free height of the column; on a phone at least 60vh | a drawing |
| `filtersLabel` | the name of the group of the filter chips | |
| `config.listWidth: 'fill'` | the list column takes the width that the detail column leaves | a drawing in the list column |

Reason: The pages of the spec explorer pick a repository and a ref above the search, and the page
UML shows a drawing in the list column.

Test: A unit test of `app-list-detail-screen` with each slot.
