---
id: "001703"
title: The bulk result shows success or error per Antrag
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The bulk result shows success or error per Antrag

A bulk action (STUPA-Workflow:001701, STUPA-Workflow:001702) must run each Antrag in its own transaction. An error at one
Antrag must not stop the others. The result must list each Antrag with `Erledigt` (`Done`) or the
error text.

Reason: An all-or-nothing action fails the whole round for one changed Antrag.

Test: A backend integration test runs a bulk action with one failing Antrag and checks the result list.
