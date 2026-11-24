---
id: "002791"
title: The UML view takes the drawing of the spec explorer
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - views/uml/src/uml-diagram-view.component.ts
  - views/uml/src/uml.types.ts
scope:
  - views/uml
---

# The UML view takes the drawing of the spec explorer

`/views/uml` must export a copy of the UML drawing of the page UML of the spec explorer
(`spec-explorer:F/uml/views/000096`), with the same look and behaviour:

| Kit part | Copy of | Does |
|---|---|---|
| `app-uml-diagram-view` | `app-uml-diagram` | draws the frames, the boxes, the start point and the lines of a laid-out view as SVG, with the zoom buttons, the wheel, the drag and the keys `+`, `-`, `0` and the arrows |
| `uml.types.ts` | `uml-layout.ts` (types and sizes) | `UmlLayout`, `UmlBox`, `UmlLine`, the text sizes `UML_CHAR_W`, `UML_LINE_H`, `UML_HEAD_H`, `UML_PAD_X` |

Inputs: `layout`, `selected` (the id of the chosen box), `state` (round boxes of a state view),
`label` (the name of the drawing for a screen reader). Output: `pick` with the id of a clicked box.

The layout (ELK), the page, the list of the same content and the detail of an element stay in
the app.

App parts: the view knows no route and no server.

Texts: the view reads its texts through `UI_KIT_INTL` (`uml.zoom.*`).

Reason: The drawing of the spec explorer is a domain view (002203), and an app has no styles of
its own (002205).

Test: A unit test and a jest-axe test of `app-uml-diagram-view`.
