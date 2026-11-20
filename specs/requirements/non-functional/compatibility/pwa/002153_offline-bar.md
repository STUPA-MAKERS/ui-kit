---
id: "002153"
title: The app shows the offline bar
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The app shows the offline bar

Without network, the app must show the offline bar.

Reason: The person must know why a page does not load or save.

Test: The kit test of `OfflineService` sets the browser offline and expects the bar.
