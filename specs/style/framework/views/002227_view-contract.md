---
id: "002227"
title: Each domain view has a contract spec before it is built
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - specs
---

# Each domain view has a contract spec before it is built

Before a domain view of 002203 is built, its contract must be a spec in the kit: the view model
of its inputs, its outputs, the texts it needs and the states it shows. The first contracts are:

| View | Entry point | Inputs | Outputs |
| --- | --- | --- | --- |
| Graph | `/views/graph` | `GraphNode[]` (id, kind, label, icon, colour role), `GraphEdge[]`, filters | node open, node focus, filter change |
| Calendar | `/views/calendar` | `CalendarEntry[]` (id, start, end, all day, kind, title, colour role, link), view, day | range change, entry open, create at a time |
| Board | `/views/board` | `BoardColumn[]`, `BoardCard[]` (title, labels, avatars, due, marks) | card move (card, column, before), card open, card add, column menu action |
| Protocol | `/views/protocol` | Markdown, known names, enabled tools, read only | value change, image upload through the `upload` port |
| Vote | `/views/voting` | `VoteCard` (question, options, rule, state, result), `Ballot` | cast, action |
| Meeting | `/views/meeting` | `AgendaItem[]` with times, `AttendanceMatrix` (people, meetings, cells), session dock state | item open, item move, attendance change, action |
| Chat | `/views/chat` | `ChatMessage[]`, composer visibility options | send (text, visibility, files), action |
| Flow editor | `/views/flow-editor` | `FlowGraph` (states, transitions, guards as text) | graph operation |
| Form editor | `/views/form-editor` | `FormDef` | `FormDef` change |
| Plan table | `/views/plan-table` | `PlanRow[]` as a tree, `PlanColumn[]`, editable cells | cell change, row open |
| Activity | `/views/activity` | `ActivityEntry[]` (item, actor, change, time, new) | entry open, load more |

Reason: A contract first keeps the view free of the app API and lets the app write its adapter at the same time.

Test: Review of the contract spec in the pull request of the view.
