---
id: "003131"
title: A team board shows the icon of the teams
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-28
tests:
  - "views/board/src/board.util.spec.ts:BOARD_ICON"
implementation:
  - views/board/src/board.util.ts
scope:
  - views/board
---

# A team board shows the icon of the teams

`BOARD_ICON` must give the board kind `team` the icon `network`, the icon of the tab Teams. It
must not give it `landmark`, the icon of a Gremium. The icons of the kinds `personal`, `free`
and `permission` must not change. The rows view of the boards (002271) and every app picker
that reads `BOARD_ICON` show the new icon.

Reason: A board of the kind `team` belongs to a team, which can be a Gremium or another team
(app spec 003067). The Gremium icon names only one of them.

Test: A unit test reads `BOARD_ICON.team` as `network`.
