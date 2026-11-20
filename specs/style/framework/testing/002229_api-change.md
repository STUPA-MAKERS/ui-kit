---
id: "002229"
title: A change of a public kit API comes with the change of every app
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src
  - shell
---

# A change of a public kit API comes with the change of every app

A pull request that changes or removes an exported input, output, type or token of the kit must
name it in its description. The pull request of every consumer app that adapts to it must be open
before the kit pull request merges, and must merge right after it.

Reason: A consumer pins the kit as a submodule, so a breaking change must not wait in the kit.

Test: Review of the kit pull request.
