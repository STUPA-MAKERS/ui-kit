---
id: "002270"
title: The graph view takes the canvas, the layout and the kind colours
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - views/graph/src/graph-canvas-view.component.ts
  - views/graph/src/graph-layout.ts
  - views/graph/src/_graph-kinds.scss
scope:
  - views/graph
---

# The graph view takes the canvas, the layout and the kind colours

`/views/graph` must export copies of these graph parts of STUPA-Workflow, with the same
behaviour:

| Kit part | Copy of | Does |
|---|---|---|
| `app-graph-canvas-view` | `app-graph-canvas` | draws the nodes as buttons over the lines: pan, zoom, pinch, the zoom buttons, the roving tab stop with the arrow keys, the drag of a node |
| `graph-layout.ts` | `graph-layout.ts` | the pure force layout: `place`, `step`, `settle`, `fit`, `zoomAt`, `nearestIn`, the reveal queue |
| `_graph-kinds.scss` | `_graph-kinds.scss` | the colour of each kind as `--gk`, the round mark of a kind and of an element without access |

View models: the graph types of STUPA-Workflow (`GraphKind`, `GraphSource`, `GraphLine`) and the
`CanvasNode` of the canvas, with the same fields, so the app passes its nodes and lines as they
are. The inputs and outputs are those of the app canvas.

The page, the search, the depth, the filters, the panel and the sheet of a node, the skeleton and
the paging stay in the app.

App parts: the view knows no route, no permission and no server.

- The canvas emits `chosen` with the key of a node, or null for the empty drawing; the app shows
  the panel and opens the element.
- The app sets where a chosen node goes (`focusAt`) and the room for its controls (`edge`).

Texts: the view reads its texts through `UI_KIT_INTL` (`graph.zoom.*`), so an app can map them
to its own catalogue.

Behaviour: every rule of the app canvas stays, and:

- The graph builds up node by node (001426) and stands still with reduced motion (001427).
- A press shows the node and its neighbours (001429); a drag or Alt and an arrow key moves a node
  (001433).
- A node shows the icon and the colour of its kind (001430); an element without access is grey
  (001422).
- Each node button names its neighbours for a screen reader (001428).

Reason: The graph page then needs only data, and another app gets the same graph.

Test: The specs of the app canvas run against the view; unit tests and a jest-axe test of the
view with the fixtures of `/testing`.
