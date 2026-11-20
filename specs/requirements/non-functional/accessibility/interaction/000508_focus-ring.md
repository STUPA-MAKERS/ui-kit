---
id: "000508"
title: The focus ring is 2 px and has a contrast of 3:1
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - src/styles/_nav-items.scss
  - shell/src/shell-menu/shell-menu.component.scss
scope:
  - src/lib
---

# The focus ring is 2 px and has a contrast of 3:1

Every focused control must show a focus ring of at least 2 px. The ring must have a contrast
of at least 3:1 to the colours next to it. A style must not remove the outline without this
ring.

A navigation entry of the rail, of the phone bar and of the rail menus must show the ring only
around its pill, in every display mode. It must not show a second, square frame around the
whole entry.

Reason: WCAG 2.4.7 and 2.4.13. Two frames around one entry looked heavy in the very high
contrast mode, and the pill alone already marks the entry.
