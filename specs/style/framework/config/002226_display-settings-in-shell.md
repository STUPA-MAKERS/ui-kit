---
id: "002226"
title: The display settings and the accessibility menu are part of the shell
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The display settings and the accessibility menu are part of the shell

The shell must hold the accessibility menu, the display settings (theme, more contrast, very
high contrast, less transparency, reduced motion, highlighted fields) and their storage. It must
emit each change through an output port, so that an app can store the settings with the account.
The app must not have an own menu or an own setting for the display.

Reason: The display settings are an accessibility duty of every app, so they must not depend on one app.

Test: A unit test of the shell: the menu exists with the minimal config.
