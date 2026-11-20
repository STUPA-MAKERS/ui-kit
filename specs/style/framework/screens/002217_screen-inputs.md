---
id: "002217"
title: A screen takes its frame as data and its content as slots
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# A screen takes its frame as data and its content as slots

A screen must take the data of its frame through typed inputs: the head as a `ScreenHead`, the
actions as `Action[]` (002219), the tabs as `ScreenTab[]`, the filters as `FilterDef[]`, the
sort as `SortDef[]`, the load state as `LoadState` (002220) and the rows of a list as `ListRow[]`.
A screen must take the content of a body region (a tab, a detail section, a form body) through a
named `ng-template` slot, for example `<ng-template screenTab="history">`. A slot must hold only
kit components and data bindings.

Reason: Data for the frame keeps every head and every list identical, and slots keep the screens open for any content.

Test: The type check of the app, and the no-style check of 002205 for the slot content.
