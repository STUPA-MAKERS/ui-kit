---
id: "002241"
title: The detail screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The detail screen has a fixed interface

`app-detail-screen` must have this interface:

```ts
head: ScreenHead
state: LoadState<unknown>          // the frame shows the skeleton of a detail while loading
tabs?: readonly ScreenTab[]
actions?: readonly Action[]
sheets?: readonly SideSheetDef[]   // 001460, 001800: side sheets with an edge tab (001801)
comments?: { readonly open: boolean; readonly label: string } // 000131, 000215
```

Slots: `screenTab="<key>"` per tab, `screenBody` when there are no tabs, `screenSheet="<key>"` per side sheet, `screenComments`.

Outputs: `action: { key }`, `tabChange: string`, `sheetChange: { key, open }`.

Behaviour:

- The head has icon buttons and a ⋮ menu (000670); the status is a chip and the meta a list of
  chips.
- A side sheet opens beside the body on a wide screen and as a bottom sheet on a phone; an edge
  tab at the end edge opens it (001801).
- On a phone an open sheet can take the place of the body (001461) when its def says `replaces`.
- The comments open from a head button and sit beside the fields on a wide screen (000215).

Reason: Every detail of every app then has the same head, tabs and sheets.

Test: Unit tests and a jest-axe test of `app-detail-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
