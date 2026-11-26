---
id: "003075"
title: A row of a tree list steps in by its depth
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-26
implementation:
  - src/lib/list-item/list-item.component.ts
scope:
  - src/lib/list-item
---

# A row of a tree list steps in by its depth

`app-list-item` must have the input `depth`, a whole number from 0. A row with a depth above 0
must step in from the start edge by one step of `--li-indent` (default `var(--space-6)`) per
level, so its lead lines up under the title of its parent row. The row must keep its full width
for the hover, the selected surface and the click target. The row must not draw a line or an
arrow for the level. A screen reader must hear the level, because the step is visual only: the
row (the list item) must carry `aria-level` with the depth plus 1 when the depth is above 0.

Reason: A team shows its sub-teams under it in the list of the tab Teams, and the reader must
see which team a sub-team belongs to.

Test: A unit test of `app-list-item` with depth 0 and depth 2.
