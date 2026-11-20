---
id: "000499"
title: Text has a contrast of 4.5:1
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Text has a contrast of 4.5:1

Text must have a contrast ratio of at least 4.5:1 to its background. Text of 24 px, or bold
text of 18.66 px, must have at least 3:1. This applies in both themes and on every surface.

Reason: WCAG 1.4.3.

Test: `frontend/src/app/shared/ui/surface-contrast.spec.ts` and the axe check of STUPA-Workflow:000491.
