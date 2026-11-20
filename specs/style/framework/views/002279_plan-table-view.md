---
id: "002279"
title: The plan table takes rows as a tree
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The plan table takes rows as a tree

`/views/plan-table` must export the view and these view models:

```ts
interface PlanColumn { readonly key: string; readonly label: string; readonly kind: 'text' | 'money' | 'percent'; readonly editable?: boolean }
interface PlanRow { readonly id: string; readonly label: string; readonly level: number; readonly parent?: string;
  readonly values: Record<string, string | number | null>; readonly muted?: boolean; readonly link?: RouteLink }
```

Outputs: `cellChange: { row, column, value }`, `rowOpen: id`.

Behaviour:

- The amounts end on one edge (001020); a parent row is grey (from `muted`).
- A cell saves when the person leaves it (002256).

Reason: Every tree table then looks the same.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
