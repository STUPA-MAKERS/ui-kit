---
id: "002248"
title: The calendar screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The calendar screen has a fixed interface

`app-calendar-screen` must have this interface:

```ts
head: ScreenHead                 // no visible title on a wide screen (001771)
entries: LoadState<readonly CalendarEntry[]> // 002272
view: 'week' | 'month' | 'days'
day: string                        // ISO date
filters?: readonly FilterDef[]     // in a row of their own below the search (001946)
actions?: readonly Action[]
```

Slots: none.

Outputs: `viewChange`, `dayChange`, `rangeChange: { from, to }`, `entryOpen: id`, `create: { start, end? }`, `query`.

Behaviour:

- Wide and narrow: week and month view (000728); Heute | Abo | Termin anlegen as one head group.
- Phone: a list of days (000726).

Reason: The calendar page then needs only data.

Test: Unit tests and a jest-axe test of `app-calendar-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
