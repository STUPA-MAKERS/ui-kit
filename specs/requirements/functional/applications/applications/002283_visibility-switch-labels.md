---
id: "002283"
title: The visibility switch of a composer takes its labels from inputs
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The visibility switch of a composer takes its labels from inputs

The visibility switch of the message composer must show the labels of its inputs, without an
explanation in brackets.

Reason: The switch is a segment selector, and a long label wraps onto two lines in it.

Test: A unit test of the composer checks that the switch shows the given labels.
