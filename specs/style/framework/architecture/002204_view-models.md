---
id: "002204"
title: A kit view model is a typed interface of the kit
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# A kit view model is a typed interface of the kit

Each data-driven component must declare its input data as readonly TypeScript interfaces in the
kit, named after the view (for example `GraphNode`, `CalendarEntry`, `AgendaItem`). A view model
must not name an API route or a field of an app API. An app must map its API data to the view
model in an adapter function with a unit test.

Reason: The kit cannot depend on an app, and a pure adapter is cheap to test.

Test: The `strict` TypeScript build of the kit, and the adapter tests in the app.
