---
id: "002797"
title: A detail body can have two columns
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - src/lib/columns/columns.component.ts
scope:
  - src/lib/columns
---

# A detail body can have two columns

The kit must have `app-columns` with the slots `[main]` and `[side]`. The main column must take
1.4 parts of the width and at least 22.5rem, the side column 1 part and at least 20rem. When the
two do not fit side by side, the side column must go below the main column. Each column must stack
its sections with a gap of 18px, and the gap between the columns must be 28px.

Reason: The detail of a spec in the spec explorer shows the rule text beside its references.

Test: A unit test of `app-columns`: both slots show in their column.
