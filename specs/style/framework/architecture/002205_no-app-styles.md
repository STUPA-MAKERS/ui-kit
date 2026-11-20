---
id: "002205"
title: An app has no stylesheet of its own
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/styles
---

# An app has no stylesheet of its own

A consumer app must not have a component stylesheet, a `styles` or `styleUrl` in a component, a
`style` attribute or a utility class in a template. The global stylesheet of the app must only
load the styles of the kit and set the brand tokens of 002207. A view that the kit cannot show yet
must get a kit component first, in a kit pull request that merges before the app pull request.

Reason: Every style lives in one place, so all apps look the same and an accessibility mode reaches every view.

Test: A check in each app: no `*.scss` or `*.css` file outside the global stylesheet, no `styles`/`styleUrl` key, no `style=` and no `class=` with a utility class in a template.
