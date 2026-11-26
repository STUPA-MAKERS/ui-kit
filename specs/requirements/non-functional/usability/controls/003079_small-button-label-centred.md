---
id: "003079"
title: The label of a small button sits on its middle
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-26
implementation:
  - src/lib/button/button.component.scss
scope:
  - src/lib/button
---

# The label of a small button sits on its middle

The capital letters of the label of a small button (`size="sm"`) must sit on the vertical middle
of the button, within 0.5px. A leading icon must stay on the centre of the left end cap
(000214). The label must keep its place and its width in the button, and a letter with a
descender must not be cut.

Reason: The font puts more room above its capitals than below its baseline, so the 13px label
sat about 1.5px above the middle and looked wrong beside its icon (the edit action of the Info,
Frederik 2026-11-26).

Test: A test of the button checks the offset of the label and of the leading icon. A person
checks the look on screenshots in both themes and in very high contrast.
