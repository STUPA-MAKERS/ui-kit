---
id: "002286"
title: The accent check keeps the contrast
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The accent check keeps the contrast

The kit must give a check that refuses an accent colour that gives less than 4.5:1 for text on
the accent or less than 3:1 for the accent on the surfaces. The check must use both themes.

Reason: An app sets the accent colour, so the tokens alone cannot keep WCAG 1.4.3 and 1.4.11.

Test: A unit test of the check uses colours on both sides of each limit.
