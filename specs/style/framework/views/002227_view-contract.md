---
id: "002227"
title: Each domain view has a contract spec before it is built
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - specs
---

# Each domain view has a contract spec before it is built

Before a domain view of 002203 is built, its contract must be a spec in the kit: the view model
of its inputs, its outputs, the texts it needs and the states it shows. The contracts are 002270 (graph), 002271 (board), 002272 (calendar), 002273 (protocol), 002274
(voting), 002275 (meeting), 002276 (chat), 002277 (flow editor), 002278 (form editor), 002279
(plan table) and 002280 (activity).

Reason: A contract first keeps the view free of the app API and lets the app write its adapter at the same time.

Test: Review of the contract spec in the pull request of the view.
