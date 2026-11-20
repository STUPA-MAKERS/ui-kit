---
id: "002228"
title: The kit tests a view, the app tests its adapter
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
  - testing
---

# The kit tests a view, the app tests its adapter

Each kit component must have a unit test and a jest-axe test with the fixtures of `/testing`, in
the light and the dark theme and in very high contrast. An app must test its adapters (API data
to view model) and the wiring of each route to its screen. An app must not test the look or the
geometry of a kit component.

Reason: A test belongs where the code is, and a look tested in two places drifts.

Test: The coverage gates of the kit, and the adapter tests of the app.
