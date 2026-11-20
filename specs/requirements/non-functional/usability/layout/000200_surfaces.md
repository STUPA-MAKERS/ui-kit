---
id: "000200"
title: Surfaces step up
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
---

# Surfaces step up

Fixed chrome must have its own raised surface. A nested surface must use the surface token one
step above the token of its parent, for example `--color-surface-2` in `--color-surface-1`.
