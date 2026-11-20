---
id: "002272"
title: The calendar view takes entries
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The calendar view takes entries

`/views/calendar` must export the view and these view models:

```ts
interface CalendarEntry { readonly id: string; readonly kind: string; readonly title: string;
  readonly start: string; readonly end?: string; readonly allDay?: boolean;
  readonly colour: ColourRole; readonly link: RouteLink }
```

Outputs: `entryOpen: id`, `create: { start, end? }`, `rangeChange: { from, to }`.

Behaviour:

- The week view shows 00:00 to 24:00 (000746); a later entry lies on an earlier one (000745); an
  entry over several days is a block on each day (000744); the day lines stay when the hours are
  pulled (000743).
- Each day of the month grid is a segment (001780); the picked day lists its entries as a row group
  without a frame (001770).

Reason: The calendar is the same for every kind of entry.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
