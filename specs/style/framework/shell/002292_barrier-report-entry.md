---
id: "002292"
title: The accessibility menu has an entry to report a barrier
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - shell/src/shell-menu/shell-menu.component.ts
  - shell/src/framework/framework-shell.component.ts
  - shell/src/framework/framework-public-header.component.html
scope:
  - shell
---

# The accessibility menu has an entry to report a barrier

When the config sets `reportBarrier: true`, the accessibility menu must show "Barriere melden"
after the link to the statement, in the rail, in More and in the public header, with and without
a login. The entry must emit the action `reportBarrier`. The app must open its report form with
the kind of a barrier (STUPA-Workflow:000497).

Reason: The law requires a feedback route that a user finds where the accessibility settings
are.

Test: A unit test of the menu checks the entry and its action.
