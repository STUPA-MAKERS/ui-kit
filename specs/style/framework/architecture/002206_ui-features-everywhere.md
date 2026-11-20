---
id: "002206"
title: Every UI feature of the kit is on in every app
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
  - pwa
---

# Every UI feature of the kit is on in every app

The shell of the kit must bring every UI and UX feature to every app: the accessibility menu and
the display settings, toasts, the load bar, skeletons, the update and offline bars, the PWA
behaviour, the search palette, swipe back, pull to refresh, the long-press selection, the press
ripple and the motion. An app must not switch off an accessibility feature.

Reason: A user gets the same help in every app, and an app cannot drop a legal accessibility duty.

Test: A unit test of the shell: a shell with the minimal app config has each feature.
