---
id: "002792"
title: A row shows code in the monospace font
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - src/lib/list-item/list-item.component.ts
  - src/lib/screen/screen.types.ts
scope:
  - src/lib/list-item
  - screens
---

# A row shows code in the monospace font

`app-list-item` must have the input `code` with the values `title` and `sub`, and `ListRow` must
have the field `code` with the values `title` and `meta`. With `title`, the title must show in the
monospace font at the small text size. With `sub` or `meta`, the line below the title must show
in the monospace font. `app-list-detail-screen` and `app-record-section` must pass the field to
the row.

Reason: A rule ID, a path or a file name is code, and the spec explorer shows it in the
monospace font, so the reader can tell it from a title.

Test: A unit test of `app-list-item` with each value.
