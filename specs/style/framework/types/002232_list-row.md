---
id: "002232"
title: A row of a list is a ListRow
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A row of a list is a ListRow

A row of a list screen and of a row group must be given as a `ListRow`:

```ts
interface ListRow {
  readonly id: string;
  readonly title: string;
  readonly meta?: readonly string[];      // one meta line with dots between the parts (001961)
  readonly status?: StatusChip;
  readonly avatar?: AvatarRef | readonly AvatarRef[]; // a stack covers the one before (000570)
  readonly icon?: IconName;
  readonly trailing?: string;             // for example an amount, end-aligned
  readonly mark?: 'new' | 'warn' | null;  // a dot, never a count (000560)
  readonly link?: RouteLink;              // default: the detail route of the screen with id
  readonly actions?: readonly Action[];   // the ⋮ of the row, only for the row in use (001920)
  readonly selectable?: boolean;          // default true when the screen has a selection
  readonly swipe?: { readonly start?: Action; readonly end?: Action }; // never delete (000211)
}
interface ListGroup { readonly key: string; readonly label: string; readonly rows: readonly ListRow[]; }
```

The kit must cut no URL, IBAN or e-mail address in a row (000209), show a tooltip only for cut
text (000212), and end a phone row with the ⋮ or with nothing (000675).

Reason: One row type keeps every list row the same.

Test: Unit tests of `app-list-item` with each field.
