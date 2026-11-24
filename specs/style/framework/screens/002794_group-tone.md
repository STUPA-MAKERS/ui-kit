---
id: "002794"
title: A row group of a list screen can have the warning colour
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - src/lib/screen/screen.types.ts
  - screens/src/list-detail-screen/list-detail-screen.component.html
scope:
  - screens
---

# A row group of a list screen can have the warning colour

`ListGroup` must have the field `tone` with the values `accent` (the default) and `warn`.
`app-list-detail-screen` must give the tone to the head of the group (`app-list-group` `tone`).

Reason: The page Verweise of the spec explorer shows the references without a spec first, under
a head in the warning colour.

Test: A unit test of `app-list-detail-screen` with a group of each tone.
