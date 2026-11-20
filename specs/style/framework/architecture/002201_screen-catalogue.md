---
id: "002201"
title: The kit has one screen for each page pattern
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# The kit has one screen for each page pattern

The kit must provide one screen component for each page pattern of the consumer apps:

- `app-list-detail-screen`: a list column, a detail pane and the empty pane.
- `app-detail-screen`: a detail with head, tabs and side sheets.
- `app-form-screen`: a form in place of a detail, with the head bar of a form.
- `app-wizard-screen`: steps of a form, built from a definition.
- `app-settings-screen`: row groups of settings.
- `app-board-screen`, `app-calendar-screen`, `app-graph-screen`, `app-editor-screen`: the screens of the domain views.
- `app-public-screen`: a public page with the public header and the footer.
- `app-status-screen`: error, not found, forbidden and offline.

A dialog and a sheet are overlays, not screens: `app-dialog` and `app-sheet` take the same head,
body and footer slots on every screen. A new pattern must be added to this list before an app uses it.

Reason: A fixed catalogue stops each app from inventing its own page frame.

Test: A unit test of the shell entry point: each screen of the list is exported and has a jest-axe test.
