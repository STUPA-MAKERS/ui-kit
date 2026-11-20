---
id: "002211"
title: The kit and its apps share one number space
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - specs
---

# The kit and its apps share one number space

The number of a spec must be unique over the specs of the kit and of STUPA-Workflow. A new spec
gets the highest number of both repositories and their open pull requests plus one. A spec that
moves between the two repositories must keep its number, its file name and its folder path.

Reason: A moved rule keeps its identity, and a number never names two rules.

Test: `scripts/check_specs.py` of both repositories reads the numbers of the other repository.
