---
id: "000491"
title: Every route passes an axe check in both themes
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - shell/src/framework/a11y-routes.ts
scope:
  - shell
---

# Every route passes an axe check in both themes

The e2e suite of each app must run axe-core on every route that shows a page, in the light
theme and in the dark theme. The check must use the tags of `AXE_TAGS` of the kit: `wcag2a`,
`wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`. A violation must fail the suite. The kit must
give `pageRoutes()`, which lists every route of a router config that shows a page, and
`axeRouteGaps()`, which compares them with the routes of the sweep, so a unit test of the app
fails when a route has no axe check.

Reason: jsdom cannot compute contrast or layout, so only a real browser finds these errors.
The list of routes comes from the router, so a new page cannot miss the check.

Test: The unit tests of `pageRoutes()` and `axeRouteGaps()`; the e2e sweep of each app with
`@axe-core/playwright`.
