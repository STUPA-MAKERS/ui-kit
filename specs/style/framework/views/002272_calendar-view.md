---
id: "002272"
title: The calendar views take the grid, the week, the day list and the entry sheets
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - views/calendar/src/calendar-month-view.component.ts
  - views/calendar/src/calendar-week-view.component.ts
  - views/calendar/src/calendar-day-list-view.component.ts
  - views/calendar/src/public-entry-view.component.ts
  - views/calendar/src/external-entry-view.component.ts
scope:
  - views/calendar
---

# The calendar views take the grid, the week, the day list and the entry sheets

`/views/calendar` must export copies of these Kalender parts of STUPA-Workflow, with the same
behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-calendar-month-view` | the month grid of `app-calendar` | the weeks of a month: each day a segment with two entries and "+n weitere", the bars of the entries over several days, arrow keys, Home and End |
| `app-calendar-week-view` | `app-calendar-week` | the hour grid of a week: the all-day row, the blocks of the timed entries, the overlap |
| `app-calendar-day-list-view` | the day column of `app-calendar` | the entries of the picked day as one row group, the empty face, the skeleton |
| `app-public-entry-view` | `app-public-entry` | the sheet of a public Termin or a public meeting |
| `app-external-entry-view` | `app-external-entry` | the sheet of an entry of an external calendar |

View models: the calendar types of STUPA-Workflow (`CalendarEntry`, `ExternalEntry`,
`PublicAppointment`, `PublicMeeting`), with the same fields, so the app passes its API objects as
they are. The grid and entry helpers (`monthGrid`, `weekOf`, `monthRows`, `dayBlocks`,
`weekBars`, `visibleEntries`, `dayList`) move with them. The inputs and outputs are those of the
app components.

The page, the tools (navigation, view switch, search, filter chips), the phone list, the Termin
dialog, the Termin detail and the subscription stay in the app.

App parts: the views know no route, no permission and no server.

- The views emit `selectDay` and `openEntry`; the app opens the route or the sheet of an entry.
- The public sheet emits `protocolOpen` with the id of the protocol; the app opens the protocol.
- The day list shows no retry; the app shows its load error above it.

Texts: the views read their texts through `UI_KIT_INTL` (`calendar.*`), so an app can map them
to its own catalogue.

Behaviour: every rule of the app components stays, and:

- The week view shows 00:00 to 24:00 (000746); a later entry lies on an earlier one (000745); an
  entry over several days is a block on each day (000744); the day lines stay when the hours are
  pulled (000743).
- Each day of the month grid is a segment (001780); the picked day lists its entries as a row
  group without a frame (001770).
- A public sheet never shows a person (000731, 000732).

Reason: The Kalender page then needs only data, and another app gets the same calendar.

Test: The specs of the app components run against the views; unit tests and a jest-axe test of
each view with the fixtures of `/testing`.
