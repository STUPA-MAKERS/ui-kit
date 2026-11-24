---
id: "002793"
title: A row can link to another site
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - src/lib/list-item/list-item.component.ts
  - screens/src/list-detail-screen/list-detail-screen.component.html
  - screens/src/record-section/record-section.component.html
scope:
  - src/lib/list-item
  - screens
---

# A row can link to another site

`app-list-item` must have the input `href`, and `ListRow` must have the field `href`. With an
`href` and no router `link`, the title must be an `<a href>` that opens the address in a new tab
(`target="_blank"`, `rel="noopener"`). In `app-list-detail-screen` and `app-record-section`, a row
with an `href` and without a status must end in the icon `ext`.

Reason: The spec explorer links each path, test and code reference to its line on GitHub, and
the icon tells the reader that the row leaves the app.

Test: A unit test of `app-list-item` and of `app-record-section` with an `href`.
