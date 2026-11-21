---
id: "002256"
title: A form reports its value, its validity and its dirty state
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - screens/src/form/form.component.ts
scope:
  - screens
---

# A form reports its value, its validity and its dirty state

`app-form` must emit `valueChange` with the whole value after each change, keep `valid` and `dirty`
as signals, and check required, limits and patterns itself. It must show a server error from
`errors` until the field changes. A field of a section with `autosave` (002255) must emit `commit` when
the person leaves it (STUPA-Workflow:000812) or when its section leaves the page (STUPA-Workflow:000850).

With `only` (a list of section keys), `app-form` shows only those sections, and
`showErrors(sections)` checks only their fields. A wizard (002243) uses both for its steps.

Reason: The page wiring then needs no form logic of its own.

Test: Unit tests of `app-form`: errors, dirty, commit.
