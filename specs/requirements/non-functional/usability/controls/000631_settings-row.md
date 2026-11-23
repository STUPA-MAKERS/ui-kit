---
id: "000631"
title: A settings row is a row of a row group, 56 px high
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-23
implementation: null
scope:
  - src/lib
---

# A settings row is a row of a row group, 56 px high

A row that holds one setting (a label and a switch, or a label, a choice and a switch) must be
a child of the shared row group (`.rowgroup`). The row must be at least 56 px high. Its
content must start 16 px from the left edge and end 16 px before the right edge. A page must
not set the surface, the gap or the corners of such a row in its own stylesheet.

This applies to every switch in Verwaltung that sets one value, on a page, in a side panel and
in a dialog:

- Benachrichtigungen, Hilfe & Tickets and Darstellung (the switch "Gravatar-Bilder zeigen" in
  Profilbilder).
- Haushalt: the dialog of a Kostenstelle (Aktiv, Haushaltsplan führen, Ausgaben standardmäßig deckungsfähig) and the dialog
  of a Haushaltsjahr (Aktiv).
- Abläufe: the inspector of a state and the inspector of a transition (the views
  `state-inspector-view` and `transition-inspector-view` of the kit).
- Gremien: the dialog of a Gremium and the dialog "Vorgaben für neue Gremien".
- Benutzer: the switch "Konto zusätzlich deaktivieren" in the dialog that takes the rights away.

It also applies to Konto > Benachrichtigungen. Switches that follow each other share one row
group. A field between two switches (for example the lead time of a delegation) ends the
group, and the next switch starts a new one.

A switch in the end slot of a record row (Übersetzungen > Sprachen, "Aktiv") is not a
settings row, because the record row already is a row of a group.

Reason: One shared row gives every page and dialog the same height, inset, surface and
corners. A switch that a page draws by itself drifts from the other row groups with the next
change, and a free switch beside raised rows looks like a different control.

Test: A source test of the templates of Verwaltung expects the classes
`rowgroup rowgroup--settings` on the list of the rows and no `min-height`, `background` or
`border-radius` for the row in the stylesheet of the page. A second source test finds no
`app-switch` in a template of Verwaltung outside such a group, except in the end slot of a
record row. A screenshot shows each page and dialog.
