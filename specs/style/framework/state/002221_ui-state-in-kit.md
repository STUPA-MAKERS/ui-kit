---
id: "002221"
title: A kit component holds its UI state and the app holds the data
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# A kit component holds its UI state and the app holds the data

A kit component must hold its own UI state: an open sheet, the open tab, the scroll place, the
expanded rows, the selection mode, a drag in progress and the draft text of a field. A kit
component must not hold the data of the app as a source of truth. It must emit each change of the
data as an output and show the new data when the input changes. An optimistic view (for example a
moved card) must go back when the input does not follow within one change of the input.

Reason: The app stays the only owner of the data, and every view behaves the same on a refused write.

Test: Unit tests of the board, the plan table and the form with a refused change.
