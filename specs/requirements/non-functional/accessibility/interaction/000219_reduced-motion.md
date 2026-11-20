---
id: "000219"
title: Motion follows the reduced motion setting
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Motion follows the reduced motion setting

With `prefers-reduced-motion`, or with the switch "Weniger Bewegung" on (000593), the app must
show no transitions, no slide and no press shrink. With the switch off, the app must show the
motion also when the system asks for reduced motion (000594).
