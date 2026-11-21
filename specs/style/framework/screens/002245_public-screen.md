---
id: "002245"
title: The public screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - screens/src/public-screen/public-screen.component.ts
scope:
  - shell
  - screens
  - src/lib
---

# The public screen has a fixed interface

`app-public-screen` is a copy of the public pages of STUPA-Workflow (Erklärung zur
Barrierefreiheit, Öffentliche Protokolle, Beschlüsse). It must have this interface:

```ts
head: ScreenHead                   // the title is 28 px (000677)
state?: LoadState<unknown>         // default ready
lede?: string | null               // the line under the title
crumbs?: readonly PublicCrumb[]    // "Start › Öffentliche Protokolle"
actions?: readonly Action[]        // the pill buttons under the lede ("Beschlüsse")
width?: 'narrow' | 'wide'          // default narrow
skeletonRows?: number              // default 6
emptyAction?: Action | null        // the pill button in the empty state ("Zur Startseite")

interface PublicCrumb { readonly label: string; readonly link?: RouteLink }
```

Slots: `screenBody` (the content while the state is ready).

Outputs: `action: { key }` (a pill button without a route).

Behaviour:

- The public frame of the shell draws the header with its button group (001356) and the footer
  with the link to the accessibility statement (STUPA-Workflow:000496). The screen draws only
  the column.
- `narrow` is the text column of 45rem, `wide` the list column of 67.5rem; both are centred
  (000201).
- A crumb without a link is the current page. An action with a route is a link, else it reports
  its key.
- Loading shows `skeletonRows` skeleton rows. Empty shows the kit empty state in a card, with
  `emptyAction` as its button. A load error is a toast with "Erneut versuchen".

Decisions, each on its own card (pending):

- The shell draws the header and footer, not the screen.
- Crumbs, lede and pill buttons are inputs.
- Two column widths, as in the app.
- The empty state has the button of the app.
- A load error is a toast, as on the signed-in pages.
- The page picks the number of skeleton rows.
- An empty statement shows the empty state card, not a grey line.

Reason: Every public page then has the same header, footer, column and head.

Test: Unit tests and a jest-axe test of `app-public-screen`, at phone, narrow and wide width.
