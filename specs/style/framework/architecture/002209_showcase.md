---
id: "002209"
title: Every screen and domain view has a page in the kit showcase
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# Every screen and domain view has a page in the kit showcase

The kit must have a showcase app with one page for each screen of 002201 and each domain view of
002203, filled with fixture data. Each page must show the default look and every accessibility
mode of the display settings.

Reason: A screenshot for an approval and a visual check need the component without an app and without a server.

Test: A unit test of the showcase routes: each exported screen and domain view has a route.
