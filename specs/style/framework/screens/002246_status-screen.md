---
id: "002246"
title: The status screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - screens/src/status-screen/status-screen.component.ts
scope:
  - shell
  - screens
  - src/lib
---

# The status screen has a fixed interface

`app-status-screen` is a copy of the error pages of STUPA-Workflow (403, 404). It must have
this interface:

```ts
kind: 'not-found' | 'forbidden' | 'error' | 'offline'
heading: string
body?: string
actions?: readonly Action[]
```

Slots: none.

Outputs: `action: { key }` (an action without a route).

Behaviour:

- One block in the middle of the page: the code in large monospace type, the heading with its
  icon, the text and the actions as one button group (the first filled, the others tonal).
- The kind sets the code and the icon: `not-found` 404 with the lens, `forbidden` 403 with the
  lock, `error` 500 with the warning sign, `offline` no code with the crossed-out cloud.
- The routed page fills the height of the page, so the block stands in the middle of the
  frame. The shell draws the frame (rail or public bar).
- The route sets the page title (`title` of `screenRoute`), as in the app.

Decisions, each on its own card (pending):

- The block of the app (code, icon and heading), not the empty-state face.
- `error` shows the code 500, `offline` shows no code.
- `error` has the warning sign, `offline` the crossed-out cloud.
- The route sets the page title, not the screen.

Reason: Error pages then look the same in every app.

Test: Unit tests and a jest-axe test of `app-status-screen`, at phone, narrow and wide width.
