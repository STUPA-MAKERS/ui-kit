---
id: "000596"
title: Less transparency makes the glass surfaces opaque
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Less transparency makes the glass surfaces opaque

With `prefers-reduced-transparency: reduce`, or with the switch "Weniger Transparenz" on,
every frosted surface must be opaque and must show no blur.

Reason: Content that shows through a bar or a sheet makes its text harder to read.

Test: `frontend/vendor/ui-kit/src/styles/display-settings.spec.ts`.
