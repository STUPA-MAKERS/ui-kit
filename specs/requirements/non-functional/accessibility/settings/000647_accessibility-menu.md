---
id: "000647"
title: Accessibility has its own menu
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Accessibility has its own menu

The app must have a menu "Barrierefreiheit" that is separate from the help menu. Its button must
show the icon `eye` and the label "Barrierefreiheit". The button must sit directly above "Hilfe"
in the navigation rail and directly before the help button in the public header. On a phone, the
public header button must open the menu as a bottom sheet, and the "Mehr" sheet must show the
menu as its own group "Barrierefreiheit" directly before the group "Hilfe". In that group the
caption of "Darstellung" is "Barrierefreiheit", so the sheet shows one caption, not two.

The menu must show, in this order: the group "Darstellung" (000593), a separator and the link
"Erklärung zur Barrierefreiheit" to `/accessibility` (STUPA-Workflow:000496). The help menu must show only
"Handbuch im Wiki" and "Problem melden" (STUPA-Workflow:000150).

Reason: A person who needs an accessibility setting looks for it under accessibility, not under
help. One button with the accessibility icon finds the settings and the statement in one place.

Test: `frontend/src/app/features/help/help-menu/help-menu.component.spec.ts`.
