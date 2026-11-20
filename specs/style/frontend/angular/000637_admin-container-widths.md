---
id: "000637"
title: Container queries in Verwaltung use three named widths
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Container queries in Verwaltung use three named widths

A container query in a stylesheet of Verwaltung must use one of three widths from one shared
SCSS module: 34 rem (the fields of a form stack), 44 rem (the columns of a row stack) and
56 rem (a wide row with five or more columns stacks). A stylesheet must not write another
width. A layout that changes to a named width must stack at the next larger one, so that no
row overflows.

Reason: Two pages with the same layout change at the same window size only when they share
the width. Three named widths also say why a layout changes: the fields, the columns or a
wide row.

Test: A source test reads every stylesheet below `pages/admin` and fails on an `@container`
rule that does not come from the shared module.
