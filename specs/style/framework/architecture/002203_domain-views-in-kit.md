---
id: "002203"
title: Domain views are kit components
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# Domain views are kit components

A view that shows the data of a domain must be a kit component too. This includes the protocol
editor and its view, the graph, the calendar, the to-do board, the vote card and the ballot, the
attendance matrix, the agenda, the chat, the flow editor, the form editor, the plan table and the
activity row. The app must only convert its API models to the view models of the kit and send the
outputs to its API.

Reason: An app that has only adapters has no own UI that can drift from the kit.

Test: The no-style check of 002205 and the import lint of 002202.
