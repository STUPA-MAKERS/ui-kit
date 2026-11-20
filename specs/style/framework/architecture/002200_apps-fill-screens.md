---
id: "002200"
title: An app only fills the screens of the kit
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# An app only fills the screens of the kit

Every routed page of a consumer app must render exactly one screen component of the kit. The app
must give the screen its data, its texts and its actions through inputs and react to the outputs.
The app must not build the frame of a page (head, panes, sheets, bars, footer) itself.

Reason: Every app then has the same structure, the same shell and the same UI and UX features. A fix in the kit reaches every app at once.

Test: A contract test in each app: the template of a routed component has one kit screen element as its root.
