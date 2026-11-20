---
id: "001362"
title: The face of an empty state is white in very high contrast
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The face of an empty state is white in very high contrast

With very high contrast on, the face of an empty state (001360) must be white on black: white
eyes with black pupils, a white mouth and white dots at full strength. It must never be yellow,
because yellow means "press" (000614). The dots do not fade, and the face stands still, because
very high contrast turns on less motion (000219).

Reason: Faint grey shapes vanish in very high contrast, and a yellow face would read as a
button.
