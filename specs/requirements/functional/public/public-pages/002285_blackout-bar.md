---
id: "002285"
title: A blackout block shows as one bar on screen
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - markdown-view
---

# A blackout block shows as one bar on screen

The Markdown view must show one black bar in place of each blackout block that it gets. The bar
must have the full text width and the height of one line, whatever the length of the block. It
must have the colour of the bar of a segment (000688). The bar must have the text alternative of
its input for a screen reader.

Reason: The bar shows that the text has a gap there, but not how long the gap is.

Test: A unit test of the Markdown view checks the bar and its text alternative.
