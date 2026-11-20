---
id: "000576"
title: A load error shows as a toast with a retry action
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A load error shows as a toast with a retry action

When a page or a pane cannot load its content, the app must show an error toast with the
action "Erneut versuchen". The page must not show the error as a note in its content area.
The action must load the content again.

The content area must keep the content that it showed before the error. Without such
content, a list must show its placeholder for an empty list (`app-empty-state`).

Reason: The error note filled the list with a red card. The toast says the same without
covering the page, and it shows the same way on every page (000401).

Test: A unit test of the list pages makes the load fail and expects one error toast with the
retry action and no `app-note` with `kind="error"` in the content area.
