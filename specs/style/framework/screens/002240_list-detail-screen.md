---
id: "002240"
title: The list/detail screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - screens/src/list-detail-screen/list-detail-screen.component.ts
scope:
  - shell
  - src/lib
---

# The list/detail screen has a fixed interface

`app-list-detail-screen` must have this interface:

```ts
head: ScreenHead                 // the list title, hidden on a wide screen (001500)
rows: LoadState<readonly ListRow[] | readonly ListGroup[]>
search?: SearchDef
filters?: readonly FilterDef[]
sort?: readonly SortDef[]
actions?: readonly Action[]       // the list actions; export goes to ⋮ (001812)
selection?: { readonly actions: readonly Action[] } // enables long press and the selection bar
none: { readonly heading: string; readonly icon: IconName } // "Kein … geöffnet" (000665)
config?: { readonly param?: string; readonly listWidth?: 'normal' | 'wide' | 'fill'; readonly reset?: boolean }
filtersLabel?: string
scope?: ScreenScope              // 002795, with the output scopeChange
```

The `fill` width is in 002795, `reset` in 002796.

Slots: `screenRow` (optional, replaces the content of a row with kit components), `screenListHead` (optional, a block above the rows, for example the running meeting of STUPA-Workflow:001302), and `screenFilters`, `screenTools` and `screenBody` of 002795.

Outputs: `query: ListQuery`, `action: { key, ids? }`, `more: void`, `refresh: void` (pull to refresh).

Behaviour:

- Wide: list column and detail pane side by side with the geometry of 000192; the list head is
  solid (000527, 001931); the scroll bar starts below the head (000601).
- Narrow: as wide, with the list column narrower.
- Phone: one pane at a time (000451); the list head is glass; the detail slides in; back returns
  to the list with its scroll place.
- The screen opens no row by itself (000664) and shows the empty pane while no row is open.
- A long press starts the selection in every list with a selection (001810, 001811).

Reason: One list/detail screen gives every work list the pattern of the Anträge list (000417).

Test: Unit tests and a jest-axe test of `app-list-detail-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
