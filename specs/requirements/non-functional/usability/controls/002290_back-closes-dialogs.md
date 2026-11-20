---
id: "002290"
title: Back closes an open dialog
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib/dialog
---

# Back closes an open dialog

Each dialog must be an entry in the history of the browser while it is open. "Back" must close
the open dialog and must keep the screen behind it. A close by a button must take the entry away
again.

Reason: On a phone "back" is the usual way to close what lies on top. Without an entry the step
back leaves the screen, and the person loses the place and what the dialog held.

Test: The test opens a dialog, reads the new entry in the history, goes back and reads that the
dialog closed. It closes by a button and reads that nothing else closed.
