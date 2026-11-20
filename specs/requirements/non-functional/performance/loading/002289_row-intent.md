---
id: "002289"
title: A list reports a sign of intent for a row
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - screens
---

# A list reports a sign of intent for a row

A list must report a sign of intent for a row when the pointer of a mouse moves onto the link of
the row, when a finger, pen or mouse presses it, or when it gets the focus. A touch that moves
over a link is no sign of intent.

Reason: A press comes about 100 ms before the click, so an app can read ahead in that time.

Test: A unit test of the list checks each sign and that a touch over a link reports none.
