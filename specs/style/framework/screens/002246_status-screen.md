---
id: "002246"
title: The status screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The status screen has a fixed interface

`app-status-screen` must have this interface:

```ts
kind: 'not-found' | 'forbidden' | 'error' | 'offline'
heading: string
body?: string
actions?: readonly Action[]
```

Slots: none.

Outputs: `action: { key }`.

Behaviour:

- The empty-state face in the middle; the actions as one button group.
- The page title follows the heading.

Reason: Error pages then look the same in every app.

Test: Unit tests and a jest-axe test of `app-status-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
