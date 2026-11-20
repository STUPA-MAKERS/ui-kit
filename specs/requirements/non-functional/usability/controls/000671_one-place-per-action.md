---
id: "000671"
title: A view shows an action in one place
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A view shows an action in one place

A view must not show the same action two times. An action that belongs to a section must
stand in the head of that section. The invoice detail must show "Buchung anlegen" as a button
only in the head of the section "Buchungen". The head menu has it too (STUPA-Workflow:001292).

Reason: The invoice detail shows "Buchung anlegen" below the title and again in the section.
The person cannot tell if the two buttons do the same.

Test: A unit test of the invoice detail expects exactly one button "Buchung anlegen".
