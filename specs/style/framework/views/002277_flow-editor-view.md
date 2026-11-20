---
id: "002277"
title: The flow editor takes a FlowGraph
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The flow editor takes a FlowGraph

`/views/flow-editor` must export the view and these view models:

```ts
interface FlowGraph { readonly states: readonly { id: string; label: string; kind: string }[];
  readonly transitions: readonly { id: string; from: string; to: string; label: string; guard?: string }[] }
```

Outputs: `op: { kind: 'add-state' | 'move' | 'connect' | 'remove' | 'edit', … }`, `select: id | null`.

Behaviour:

- The editor lays out by itself (000137); the inspector is the side slot of the editor screen.

Reason: The flow editor then needs only the graph.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
