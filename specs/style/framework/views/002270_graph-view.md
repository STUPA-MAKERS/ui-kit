---
id: "002270"
title: The graph view takes nodes and edges
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The graph view takes nodes and edges

`/views/graph` must export the view and these view models:

```ts
interface GraphView { readonly nodes: readonly GraphNode[]; readonly edges: readonly GraphEdge[]; readonly focus?: string | null }
interface GraphNode { readonly id: string; readonly kind: string; readonly label: string; readonly icon: IconName;
  readonly colour: ColourRole; readonly link: RouteLink; readonly date?: string }
interface GraphEdge { readonly from: string; readonly to: string; readonly kind: 'link' | 'builtin'; readonly label?: string }
```

Outputs: `nodeOpen: id`, `nodeFocus: id | null`, `nodeMove: { id, x, y }`.

Behaviour:

- The graph builds up piece by piece (001426) and stands still with reduced motion (001427).
- A press shows the node and its neighbours (001429); a drag moves a node (001433).
- A node shows the icon and colour of its kind (001430); the colour is a role, not a hex value.
- A text list of the nodes and edges is the alternative (001428).

Reason: The graph is the same for every source of nodes.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
