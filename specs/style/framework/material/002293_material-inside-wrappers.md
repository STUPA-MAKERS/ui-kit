---
id: "002293"
title: A kit component may use an M3 component of Angular Material inside
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation: null
scope:
  - src/lib
---

# A kit component may use an M3 component of Angular Material inside

Where Angular Material has an M3 component with the same behaviour as a kit component, the kit
component must use the Material component inside instead of its own copy. The kit component must
keep its selector, its inputs, its outputs and its form binding, so an app and a screen change
nothing. An app must not import `@angular/material` itself. A kit component keeps its own build
where Material has no component with the same behaviour, for example the rows of a list with
swipe and long press, the list/detail layout and the search pill.

Reason: The kit does not maintain copies of M3 components, and the apps keep one API (002200).

Test: An ESLint rule in each app forbids imports of `@angular/material`; the unit tests of each
wrapped kit component pass unchanged.
