---
id: "002210"
title: A spec about the look and the behaviour of the UI lives in the kit
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - specs
---

# A spec about the look and the behaviour of the UI lives in the kit

A spec must be in the kit when it rules how the UI looks or behaves for the data that it gets:
layout, screens, controls, motion, loading, PWA behaviour and accessibility, also for a domain
view. A spec must stay in the app when it rules data, permissions, the server, a business rule, a
concrete text, a route or which screen a page uses. A spec that rules both must be split into a
kit spec and an app spec that names it.

Reason: One criterion decides the place of each spec, so no rule is written two times.

Test: Review of each spec pull request.
