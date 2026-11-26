---
id: "003075"
title: A row of a tree list tells its level
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-26
implementation:
  - src/lib/list-item/list-item.component.ts
scope:
  - src/lib/list-item
---

# A row of a tree list tells its level

`app-list-item` must have the input `depth`, a whole number from 0. A row with a depth above 0
must not step in and must not draw a line or an arrow for the level: it has the same start edge
as a top row. A screen reader must hear the level: the row (the list item) must carry
`aria-level` with the depth plus 1 when the depth is above 0. The page names the parent in the
text of the row, for example in its line below the title.

Reason: A team shows its sub-teams right under it in the list of the tab Teams. An indent
made the tree too strong, so the row says its parent in words and the level is only for
screen readers.

Test: A unit test of `app-list-item` with depth 0 and depth 2.
