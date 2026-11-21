---
id: "002405"
title: A failed load without content shows the empty-state face with the error text
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation: null
scope:
  - src/lib
  - screens/src
---

# A failed load without content shows the empty-state face with the error text

When a page, a pane, a section or a dialog list cannot load its content and has no content from
before, its content area must show the empty-state face (`app-empty-state`, 001360). The hint
under the face must be the text of the error toast, such as "Konnte nicht geladen werden.", with
the icon `alert`. It must not be the text of an empty list, such as "Keine Einträge".

The error toast with "Erneut versuchen" stays (000576), and it is the only retry: the face has no
button, as an empty state has none (001363). Content that showed before the error
stays, and then no face shows.

This holds for every kit screen (`LoadState` `error`) and for `app-load-state` of the app, with
and without `keepContent`.

Reason: A blank area or the text of an empty list after a failed load says that there is
nothing, which is false. The face is the one shape for "nothing to show here", and its hint
says why.

Test: The unit tests of the kit screens and of `app-load-state` make the first load fail and
expect one `app-empty-state` with the error text and no text of an empty list. A second test
fails a reload with rows and expects the rows and no `app-empty-state`.
