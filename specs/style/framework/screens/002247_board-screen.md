---
id: "002247"
title: The board screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The board screen has a fixed interface

`app-board-screen` must have this interface:

```ts
head: ScreenHead
boards?: readonly { readonly key: string; readonly label: string }[] // the board picker
board: LoadState<BoardView>        // 002271
actions?: readonly Action[]
```

Slots: none (the columns and cards come from `/views/board`).

Outputs: `boardChange`, `action`, and the outputs of the board view.

Behaviour:

- Each board lies on a surface of its own (001442); the head and the tabs are one glass surface on a phone.

Reason: The board page then needs only data.

Test: Unit tests and a jest-axe test of `app-board-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
