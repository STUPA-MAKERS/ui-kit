---
id: "002295"
title: The display modes reach the Material components
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - src/styles/material.scss
scope:
  - src/lib
  - src/styles
---

# The display modes reach the Material components

Hoher Kontrast, the four colours of the very high contrast and the highlighted fields (000598)
must look on a wrapped Material component as they look on the kit component it replaces: the
same edge, fill, text colour and focus ring. The wrapper must set them through the tokens of the
Material component. Only where Material has no token for a part (the fill of an unchecked check
box) may the wrapper set that one part through the inner class of Material.

Reason: A display mode that misses a control is an accessibility bug.

Test: Screenshots of each wrapped component in every display mode for approval, and the contrast
test of the kit styles.
