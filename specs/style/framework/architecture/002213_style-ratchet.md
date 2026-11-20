---
id: "002213"
title: The style lines of an app only fall until they reach zero
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - specs
---

# The style lines of an app only fall until they reach zero

While an app moves to the kit, its CI must count the lines of its own styles that 002205 forbids
and compare them with a stored number. The count must not rise. A pull request that lowers the
count must lower the stored number too. When the count is zero, the check of 002205 must fail on
any own style.

Reason: The move takes many pull requests, and the ratchet stops a step back between them.

Test: A CI job of each app: the counted lines are at most the stored number.
