---
id: "002420"
title: A head is opaque before the page notes that content scrolls under it
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
tests:
  - "src/styles/styles.spec.ts:OpaqueBeforeScript"
implementation:
  - src/lib/sticky-bar/sticky-bar.component.scss
  - src/lib/list-group/list-group.component.scss
  - src/styles/base.scss
scope:
  - src/lib
  - src/styles
  - shell
---

# A head is opaque before the page notes that content scrolls under it

A bar or a head that sticks over scrolling content (002010) must be opaque in every state. Its
colour and its opacity must not depend on a state that the page script sets on a scroll, for
example a stuck, scrolled, under or condensed class. Such a state may only add the hairline at
the foot of the head. This applies on a phone and on a wide screen, to the search bar of a
list, the head of a list column, a pinned group head, a tab line and the bar of a detail.

No row and no group head may show through a head or between its parts, also in the frames of a
fast scroll.

The page header right above the sticky search bar of a phone list lies above the bar, so the
opaque bar does not cut the outline of a round button in that header (very high contrast).

Reason: A phone moves a fast scroll on its own thread, and the script that sets the state of a
head runs one frame or more later. The search bar of a phone list had no colour until it was
marked stuck, so on a fast scroll the rows showed through its top part and between the filters.
The same fault came back three times (the glass bars, 001931, the solid bars), each time
because a new look put the colour of a head on such a state. A unit test of the styles alone
did not catch it, because the fault shows only in a browser.

Test: A unit test of the kit styles finds no transparent background on a head state that the
script sets, and the solid colour of the phone search bar at rest. The browser check
`STUPA-Workflow:frontend/e2e/07-opaque-heads.spec.ts` (in the axe gate of every frontend change)
strips the state classes on every route on a phone, in the light theme and in very high
contrast, and expects every sticky bar to be opaque.
