---
id: "002249"
title: The graph screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The graph screen has a fixed interface

`app-graph-screen` must have this interface:

```ts
head: ScreenHead
graph: LoadState<GraphView>        // 002270
filters?: readonly FilterDef[]     // above the drawing (001425)
search?: SearchDef
```

Slots: none.

Outputs: `query`, `nodeOpen: id`, `nodeFocus: id | null`, `more`.

Behaviour:

- The drawing fills the body; the text alternative is a list below it (001428).

Reason: The graph page then needs only data.

Test: Unit tests and a jest-axe test of `app-graph-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
