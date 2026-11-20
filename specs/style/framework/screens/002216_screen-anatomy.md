---
id: "002216"
title: A screen has a head, a body and fixed places for the rest
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# A screen has a head, a body and fixed places for the rest

Every screen of 002201 must build its page from the same parts: the head (title, status chip,
meta chips, action group, ⋮ menu, back button), the tool row (search, filter chips), the body,
the FABs, the side sheets and the empty and error states. The screen must decide the place,
size, surface and motion of each part from the rules of the kit. The app must not place a part
itself.

Reason: The same part sits in the same place on every page of every app.

Test: The jest-axe and geometry tests of each screen in the kit.
