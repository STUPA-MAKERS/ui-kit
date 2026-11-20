---
id: "002202"
title: A kit component is driven by its inputs
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# A kit component is driven by its inputs

A kit component must take everything it shows through inputs and report every user intent
through outputs. A kit component must not call an HTTP API, must not read a permission and must
not hold a business rule. It must navigate only through a link or a route that an input gives.

Reason: A component without data access works in every app and in a test with fixture data.

Test: An import lint in the kit: `src/lib`, `shell` and the domain entry points do not import `HttpClient` and do not inject an app service.
