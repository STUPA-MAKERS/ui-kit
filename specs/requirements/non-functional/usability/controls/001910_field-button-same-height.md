---
id: "001910"
title: A button beside a field is as high as the field
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A button beside a field is as high as the field

A button that stands on one line beside a text field (such as "Hinzufügen" beside the e-mail
field of the dialog "Beobachter:innen") must be exactly as high as the box of the field
(`--field-height`), and its top edge must line up with the top edge of the box.

Reason: A lower button beside the field looks like a mistake in the layout, and the row reads as
two parts instead of one input with its action.

Test: Screenshot review on the phone and on the desktop, light, dark and very high contrast.
