---
id: "000395"
title: Components use semantic colour tokens
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Components use semantic colour tokens

A component must use only semantic tokens (`--color-*`), never primitives (`--c-*`). A new
colour must start as a primitive and must get a mapping per theme.
