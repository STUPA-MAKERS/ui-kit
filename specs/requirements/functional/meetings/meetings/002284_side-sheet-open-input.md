---
id: "002284"
title: A side sheet opens by itself on request
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib/side-sheet
---

# A side sheet opens by itself on request

A side sheet must have an input that opens it by itself for a key. The sheet must open once for
each key. When the person closes it, it must stay closed for that key.

Reason: A sheet that opens again after a close fights the person.

Test: A unit test of the side sheet checks that it opens once per key and stays closed after a
close.
