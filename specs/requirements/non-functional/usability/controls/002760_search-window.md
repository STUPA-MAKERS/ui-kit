---
id: "002760"
title: The kit has one search window with the look of the global search
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-23
tests:
  - "src/lib/search-window/search-window.component.spec.ts:SearchWindowComponent"
implementation:
  - src/lib/search-window/search-window.component.ts
scope:
  - src/lib
---

# The kit has one search window with the look of the global search

`app-search-window` must be a floating panel with the look of the global search (001977): the
same frosted glass, scrim and corner radius, and the search pill with the key "Esc" (⎋ on Apple
devices, a ✕ on a phone) as the close button. It must take `label`, `rows` (`id`, `icon`, `title`,
`subtitle`), `loading`, `error` and `empty`, the two-way values `open` and `query`, and must
report a pick as `picked`. The arrow keys must move the selection, Enter must pick the selected
row, and Escape, the close button and a click on the scrim must close the window. The window
must start with an empty field, keep Tab inside the panel and give the focus back on close. It
must render the panel at the end of `<body>`.

Reason: An app needs the search gesture for a source of its own, for example a document archive
(STUPA-Workflow:002534). One window in the kit keeps the look of every search the same. A dialog
or a sheet clips and transforms its content, so the panel cannot stay inside it.

Test: A unit test opens the window, moves the selection, picks a row with Enter and closes the
window with Escape, the close button and the scrim. A jest-axe test finds no violation.
