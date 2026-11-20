---
id: "002287"
title: The accessibility menu links to the accessibility statement
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
---

# The accessibility menu links to the accessibility statement

The accessibility menu (000647) of the shell must link to the statement route of the framework
config on every screen, with and without a login. The footer and the help menu must not link to
it.

Reason: One link in one known place is enough, and a link in the footer is easy to miss on
screens without a footer (002291).

Test: A unit test of the shell checks the link in the menu.
