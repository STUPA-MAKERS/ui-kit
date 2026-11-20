---
id: "002245"
title: The public screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The public screen has a fixed interface

`app-public-screen` must have this interface:

```ts
head: ScreenHead                 // the title is 28 px (000677)
state: LoadState<unknown>
```

Slots: `screenBody`.

Outputs: none.

Behaviour:

- The public header with its button group (001356) and the footer with the link to the
  accessibility statement (STUPA-Workflow:000496).
- The content fills its width or is centred (000201).

Reason: Every public page then has the same header, footer and width.

Test: Unit tests and a jest-axe test of `app-public-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
