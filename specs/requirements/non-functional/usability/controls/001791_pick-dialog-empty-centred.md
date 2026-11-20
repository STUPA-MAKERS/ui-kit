---
id: "001791"
title: The empty state of a pick dialog is centred in the list area
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The empty state of a pick dialog is centred in the list area

When the list of a pick dialog (001790) has no row, its empty state must sit in the vertical
middle of the free height of the list area, not at its top. This applies to "TOP hinzufügen"
(Anträge, Haushaltspläne, To-Dos) and to "Auf Tagesordnung setzen".

Reason: The list area has a fixed height so that the dialog keeps its height. An empty state at
the top left a large empty band under it.
