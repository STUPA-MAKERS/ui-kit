---
id: "002279"
title: The plan views take the line table, the tree rows and the sums
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - views/plan-table/src/plan-table-view.component.ts
  - views/plan-table/src/plan-tree-row-view.component.ts
  - views/plan-table/src/plan-figures-view.component.ts
scope:
  - views/plan-table
---

# The plan views take the line table, the tree rows and the sums

`/views/plan-table` must export copies of these Haushaltsplan parts of STUPA-Workflow, with the
same behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-plan-table-view` | the line table of `app-budget-plan` | one row per Kostenstelle with its path and its marks (inaktiv, Übertragbar, Deckungsfähig, Gesperrt), the Ansatz and the compared amounts; as a tree with chevrons; amount fields in a draft |
| `app-plan-tree-row-view` | the tree row of `app-budget-plan` | one row of the plan tree: chevron, name in up to two lines, inactive mark, Ansatz, the lines of the levels |
| `app-plan-figures-view` | the sums of `app-budget-plan` | Einnahmen, Ausgaben and the difference, red and "Nicht ausgeglichen" while the sides differ |

View models: the plan row of STUPA-Workflow (`PlanRow`), with the same fields, so the app passes
its rows as they are, and the helpers `groupOf`, `sideSum` and `cents`. The columns are the
`ColumnDef` list of the data table; the app sets their labels.

The page, the list beside the plan with its top-level row, the stepper, the state notes, the line
sheet with its form, the dialogs and the skeleton stay in the app.

App parts: the views know no route, no permission and no server.

- The table emits `rowClick`, `toggle`, `edit` (the typed amount) and `save` (the field lost the
  focus or took Enter); the app keeps the typed text, checks the amount and saves the line.
- The table takes the shown amount of a field as a function (`fieldValue`).
- The tree row emits `toggle` and `pick`; the app keeps which rows are open and the selection.

Texts: the views read their texts through `UI_KIT_INTL` (`budget.*`), so an app can map them to
its own catalogue.

Behaviour: every rule of the app parts stays, and:

- The amounts and the € of a column end on one edge; the sum of a parent stands where its field
  would be (001020).
- The lines of a plan show as a tree with the lines of the levels (001130).
- An amount saves when the person leaves the field (002256).

Reason: The plan page then needs only data, and another app gets the same plan tables.

Test: The specs of the app page run against the views; unit tests and a jest-axe test of each
view with the fixtures of `/testing`.
