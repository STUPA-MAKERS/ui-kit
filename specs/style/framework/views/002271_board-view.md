---
id: "002271"
title: The board view takes columns and cards
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The board view takes columns and cards

`/views/board` must export the view and these view models:

```ts
interface BoardView { readonly columns: readonly BoardColumn[] }
interface BoardColumn { readonly id: string; readonly label: string; readonly done?: boolean;
  readonly cards: readonly BoardCard[]; readonly actions?: readonly Action[] }
interface BoardCard { readonly id: string; readonly title: string; readonly labels?: readonly { label: string; colour: ColourRole }[];
  readonly avatars?: readonly AvatarRef[]; readonly due?: string; readonly mark?: 'new' | 'warn' | null;
  readonly checklist?: { done: number; total: number }; readonly link: RouteLink }
```

Outputs: `cardMove: { id, column, before: string | null }`, `cardOpen: id`, `cardAdd: column`, `columnAction: { column, key }`.

Behaviour:

- A drag moves a card; the move sheet is the alternative without a drag (000515, 000148).
- The column menu stands in the top right corner (001967).
- A refused move goes back (002221).

Reason: Every board then works the same.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
