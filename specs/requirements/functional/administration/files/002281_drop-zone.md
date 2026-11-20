---
id: "002281"
title: A drop target accepts files by drag and drop
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib/file-drop
---

# A drop target accepts files by drag and drop

A component that takes files must accept them by drag and drop through `appFileDrop` and
`app-drop-overlay`.

Reason: A person who drags a file onto the page expects the page to take it.

Test: The tests of `appFileDrop` check that a drop over the target emits the files.
