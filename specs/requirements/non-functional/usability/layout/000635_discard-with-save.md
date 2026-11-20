---
id: "000635"
title: A page with Speichern offers Verwerfen in its header
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
---

# A page with Speichern offers Verwerfen in its header

A page of Verwaltung that shows the floating "Speichern" (`NF/usability/layout/000198`) must
show "Verwerfen" as a text button on the title row while there are unsaved changes.
"Verwerfen" must set every field back to the saved value and must then hide together with
"Speichern". It is the one action of the header (`NF/usability/layout/000197`). On a page whose
header holds tools (Rollen & Rechte, Flow-Editor, Formular-Editor) it is the first of them,
and on a phone the two editors show it in the menu of the header.

Reason: A user who changes a field by mistake needs a way back that does not lose the place
on the page. Without "Verwerfen" the only way back is to load the page again.

Test: A unit test of each settings page changes a field, expects "Verwerfen" and
"Speichern", activates "Verwerfen" and expects the saved value and neither button.
