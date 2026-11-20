---
id: "000623"
title: A script reads the motion setting, not the system
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A script reads the motion setting, not the system

A script that moves or scrolls content must ask `reducedMotion()` of the kit. It must not read
`prefers-reduced-motion` itself. While less motion is in effect (000219), a scroll that a script
starts must be instant.

Reason: A script that reads the system does not follow the switch "Weniger Bewegung" (000594), and
a smooth scroll moves the whole page.

Test: `frontend/vendor/ui-kit/src/styles/display-settings.spec.ts` searches the sources of the
kit, and `frontend/src/app/shared/very-high-contrast.styles.spec.ts` searches the sources of the
app. Each fails on `prefers-reduced-motion` outside the display service and on a literal
`behavior: 'smooth'`. `scrollBehavior()` of the kit gives the behaviour from `reducedMotion()`.
