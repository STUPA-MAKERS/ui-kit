---
id: "002256"
title: A form reports its value, its validity and its dirty state
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A form reports its value, its validity and its dirty state

`app-form` must emit `valueChange` with the whole value after each change, keep `valid` and `dirty`
as signals, and check required, limits and patterns itself. It must show a server error from
`errors` until the field changes. A field with `autosave` in its section must emit `commit` when
the person leaves it (000812) or when its section leaves the page (000850).

Reason: The page wiring then needs no form logic of its own.

Test: Unit tests of `app-form`: errors, dirty, commit.
