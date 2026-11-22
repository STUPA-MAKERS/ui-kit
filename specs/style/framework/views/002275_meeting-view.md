---
id: "002275"
title: The meeting views take the agenda, the attendance and the dock
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-22
implementation:
  - views/meeting/src/agenda-pane-view.component.ts
  - views/meeting/src/attendance-sheet-view.component.ts
  - views/meeting/src/session-dock-view.component.ts
  - views/meeting/src/meeting-api.ts
scope:
  - views/meeting
---

# The meeting views take the agenda, the attendance and the dock

`/views/meeting` must export copies of these meeting components of STUPA-Workflow, with the same
behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-agenda-pane-view` | `app-agenda-pane` | the Tagesordnung: rows, times, durations, rename, move, done, non-public |
| `app-attendance-sheet-view` | `app-attendance-sheet` | the Anwesenheit sheet: members, delegations, pool seats, the guest tab |
| `app-session-dock-view` | `app-session-dock` | the bar below the meeting: state, TOP steps, votes, presence, tools |
| `app-keeper-menu-view` | `app-keeper-menu` | the Protokollant menu of the dock |
| `app-meeting-head-view` | `app-meeting-head` | the head of a meeting: back, title, status, line, link |
| `app-top-badge-view` | `app-top-badge` | the TOP number in its state (todo, now, done, lock) |

View models: the meeting types of STUPA-Workflow (`Meeting`, `AgendaItem`, `Attendance`,
`AttendanceStatus`, `MeetingVote`, `Delegation`, `LiveViewer`), with the same fields, so the app
passes its API objects as they are. The inputs and outputs are those of the app components.

The meeting pages stay in the app: the meeting page, the TOP sheet, the follow view, the live
channel and the API calls.

App parts: the views know no route, no permission and no server.

- The agenda pane takes `canTodo` instead of the permission check and emits `todoNew` (the
  links of the new card) and `todoLink` (the end to link); the app opens its to-do dialogs.
- The attendance sheet reads and revokes the delegations through the `MEETING_API` port. It
  takes the count of the admitted guests as an input and the app parts as templates: the join
  link with the guest requests (`guestsHead`), the guest list (`guestList`) and the own
  delegation (`ownDelegation`). It emits `substitute`, and the app opens its lead substitute
  dialog.
- The dock takes the guest counts (`pending`, `admitted`) as an input.

Texts: the views read their texts through `UI_KIT_INTL` (`meetings.*`, `guests.*`), so an app can
map them to its own catalogue.

Behaviour: every rule of the app components stays, and:

- An agenda row has a subtitle only when it has one (000100), the first row of an item is its
  Antrag (000101), and no drag handle shows (000607).
- The agenda beside the protocol is a split head over its list (001440, 001443).

Reason: The meeting pages then need only data, and another app gets the same agenda, attendance
and dock.

Test: The specs of the app components run against the views; unit tests and a jest-axe test of
each view with the fixtures of `/testing`.
