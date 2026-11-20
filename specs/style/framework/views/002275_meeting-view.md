---
id: "002275"
title: The meeting view takes the agenda, the attendance and the dock
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The meeting view takes the agenda, the attendance and the dock

`/views/meeting` must export the view and these view models:

```ts
interface AgendaItem { readonly id: string; readonly number: string; readonly title: string; readonly sub?: string;
  readonly start?: string; readonly duration?: number; readonly state: 'open' | 'current' | 'done';
  readonly firstRow?: ListRow; readonly link?: RouteLink }
interface AttendanceMatrix { readonly people: readonly { id: string; label: string; group?: string }[];
  readonly columns: readonly { id: string; label: string; empty?: boolean }[];
  readonly cells: Record<string, Record<string, { readonly state: string; readonly badges?: readonly string[] }>> }
```

Outputs: `itemOpen: id`, `itemMove: { id, before }`, `attendanceChange: { person, column, state }`, `action: { key }`.

Behaviour:

- An agenda row has a subtitle only when `sub` is given (000100), the first row of an item is
  `firstRow` (000101), and no drag handle shows (000607).
- The agenda beside the protocol is a split head over its list (001440, 001443).
- A month without a meeting is a narrow column with a dash (000610); a cell holds its badges
  (000611); the matrix looks like a row group (000609).

Reason: The meeting views then need only data.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
