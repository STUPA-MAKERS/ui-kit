---
id: "002294"
title: The M3 system tokens of Material come from the kit tokens
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - src/styles/material.scss
scope:
  - src/lib
  - src/styles
---

# The M3 system tokens of Material come from the kit tokens

The kit styles must set every `--mat-sys-*` token that a used Material component reads (colour
roles, type scale, shape and state layers) from a kit token, in the light and the dark theme. The
kit must not generate a second palette with `mat.theme`. A change of the accent colour, the theme
or the text size therefore reaches the Material components with no own rule.

Reason: One set of tokens keeps the Material components and the kit components the same colour,
size and shape.

Test: A unit test reads the computed `--mat-sys-primary`, `--mat-sys-surface` and
`--mat-sys-on-surface` and compares them with `--color-accent`, `--color-surface` and
`--color-text`, in both themes.
