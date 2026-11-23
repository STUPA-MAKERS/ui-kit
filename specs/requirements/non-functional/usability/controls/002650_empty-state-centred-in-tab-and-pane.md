---
id: "002650"
title: An empty state that is the content of a page, a tab or a pane is centred in the free area
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
implementation: null
scope:
  - src/lib
  - src/styles
---

# An empty state that is the content of a page, a tab or a pane is centred in the free area

When the content of a page, a tab or a pane is an empty state or a failed load (002405), the state
must sit in the horizontal and the vertical middle of the free area below the head, the tabs or
the tool row, not at its top. A tool row above it (a search, filters, a button) stays at the top, and
the empty state centres in the area below that row.

- A tab: the tabs of the Gremium detail (Info, Sitzungen, Mitglieder, Anwesenheit, Beschlüsse,
  To-Dos), and every other tab whose content is a list.
- A side pane: "Verknüpft mit TOP", the To-Dos of a meeting, the attendance of a member and the
  archive of a board.
- A pane beside a main view: the day pane beside the month grid of the Kalender ("Keine
  Einträge an diesem Tag.").
- A page: every page and Verwaltung page whose content is an empty state or a failed load (for
  example "Haushalte konnten nicht geladen werden.").
- The free area ends at the bottom of the box that scrolls the state, or, where the page
  scrolls, at the bottom of the screen above the bottom bar.
- The size of the face does not change (001360).

An empty section inside a longer content (for example "Verknüpft" in a detail) keeps its own
height.

The call site marks such an empty state with `fill`; a failed load with the face always has it.
The empty state measures the free height below its own top and takes at least that height, so the
boxes between it and the page do not have to pass the height down.

Reason: An empty state at the top of a tall tab or pane left a large empty band below it, and
the page looked unfinished.

Test: A unit test gives a `fill` state a scrolling parent of a fixed height and expects the free
height below the state as its minimum height. The screenshots of the app show the centred state.
