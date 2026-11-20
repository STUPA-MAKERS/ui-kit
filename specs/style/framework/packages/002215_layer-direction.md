---
id: "002215"
title: An entry point imports only the layers below it
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src
  - shell
---

# An entry point imports only the layers below it

The layers must import in one direction only: core is the lowest layer, then `/markdown-view`,
`/markdown-editor` and `/pwa`, then `/shell` and `/screens`, then `/views/<domain>`. An entry point
must not import from a layer above it. `/shell` and `/screens` must not import from each other
except through core. A view must not import a different view. `/testing` may import everything
and nothing may import `/testing` outside a test.

Reason: One direction keeps every entry point buildable alone and stops cycles.

Test: An ESLint import-boundary rule in the kit CI.
