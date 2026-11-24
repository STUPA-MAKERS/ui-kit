---
id: "002796"
title: The list/detail screen can reset the search and the filters
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - screens/src/list-detail-screen/list-detail-screen.component.ts
scope:
  - screens
---

# The list/detail screen can reset the search and the filters

With `config.reset: true`, `app-list-detail-screen` must show the text button "Zurücksetzen"
("Reset") after the filter chips while the search or a filter is set. A press must clear the
search and every filter in the URL and emit the query.

Reason: The lists of the spec explorer have this button, and a reader with three filters set
gets back to the whole list with one press.

Test: A unit test of `app-list-detail-screen`: the button shows only with a set filter, and a
press clears it.
