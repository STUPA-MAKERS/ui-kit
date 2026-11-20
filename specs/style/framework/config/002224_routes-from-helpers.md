---
id: "002224"
title: An app builds the routes of a screen with a kit helper
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
---

# An app builds the routes of a screen with a kit helper

An app must declare the routes of a list/detail page with `listDetailRoutes()` and of other
screens with `screenRoute()`. The helper must set the page title, the motion of the route, the
focus target after the navigation and the empty detail route. An app must not set these itself.

Reason: The title, the motion and the focus are then the same on every route.

Test: Unit tests of the route helpers.
