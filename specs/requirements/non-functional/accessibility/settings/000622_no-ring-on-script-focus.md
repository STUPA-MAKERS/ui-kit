---
id: "000622"
title: A heading that a script focuses shows no focus ring
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A heading that a script focuses shows no focus ring

An element that has `tabindex="-1"` and that a script focuses (for example the title of a detail
after it opens) must not show a focus ring. This applies in every display setting, also in "Hoher
Kontrast".

Reason: The script moves the focus so that a screen reader reads the new title. A ring around a
heading looks like an input field.

Test: `frontend/vendor/ui-kit/src/styles/display-settings.spec.ts` expects that the focus rule of
high contrast excludes `[tabindex='-1']`.
