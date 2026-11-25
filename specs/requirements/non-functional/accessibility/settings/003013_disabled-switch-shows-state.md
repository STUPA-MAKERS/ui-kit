---
id: "003013"
title: A disabled switch still shows whether it is on
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-25
tests:
  - "src/styles/display-settings.spec.ts:disabledSwitchShowsState"
implementation:
  - src/lib/switch/switch.component.scss
scope:
  - src/lib/switch
---

# A disabled switch still shows whether it is on

A disabled switch that is on must keep the fill of a switch that is on, faded to half, with the
knob of a switch that is on. A disabled switch that is off must keep the fill of a switch that
is off, faded to half. The two states must not look the same.

While "Hoher Kontrast" is on (000620), a disabled switch must not be faded. When on, it must
have a white fill with a black knob on the right. When off, it must look like a switch that is
off.

Reason: A disabled switch that is on but grey reads as off. The person then does not see that a
setting applies, for example a switch that a level above turns on.

Test: The style test expects different track colours for the disabled switch that is on and
the disabled switch that is off, in the normal look and in very high contrast.
