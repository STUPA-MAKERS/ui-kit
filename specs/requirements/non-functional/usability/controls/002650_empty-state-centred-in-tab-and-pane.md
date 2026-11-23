---
id: "002650"
title: An empty state that is the content of a tab or a side pane is centred in the free area
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-23
implementation: null
scope:
  - src/lib
  - src/styles
---

# An empty state that is the content of a tab or a side pane is centred in the free area

When the content of a tab or of a side pane is an empty state, the empty state must sit in the
horizontal and the vertical middle of the free area below the tabs or below the head of the
pane, not at its top. A tool row above it (a search, filters, a button) stays at the top, and
the empty state centres in the area below that row.

- A tab: the tabs of the Gremium detail (Info, Sitzungen, Mitglieder, Anwesenheit, Beschlüsse,
  To-Dos), and every other tab whose content is a list.
- A side pane: "Verknüpft mit TOP", the To-Dos of a meeting, the attendance of a member and the
  archive of a board.
- Where the tab or the pane has no free height of its own (a page that scrolls below the split),
  the empty state is at least most of a screen high and centres in that height.
- The size of the face does not change (001360).

An empty section inside a longer content (for example "Verknüpft" in a detail) keeps its own
height.

The call site marks such an empty state with `fill`. The kit makes the tab panel, the body of the
side pane and every box between them and the empty state into flex columns that pass the free
height down.

Reason: An empty state at the top of a tall tab or pane left a large empty band below it, and
the page looked unfinished.

Test: A source test of the kit styles expects the flex columns from the tab panel and the side
pane body to the empty state. The screenshots of the app show the centred state.
