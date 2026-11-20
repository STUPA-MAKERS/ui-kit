---
id: "000661"
title: The search field of a list names the count
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The search field of a list names the count

The search field of a list page must show the placeholder "N … durchsuchen", where N is the
number of items in the list and "…" is the name of the items. For one item the name must be
in the singular ("1 Ticket durchsuchen"). The pattern is that of Anträge. It applies to
Anträge, Aufgaben, Buchungen, Rechnungen, Tickets, Gremien, Abstimmungen and the boards.

The list of Sitzungen loads in both directions and has no total, so its search field must
show "Sitzungen durchsuchen" without a count.

A search field that searches a part of a page, for example the cost centres of the budget
tree or the settings of Verwaltung, must show "… durchsuchen" without a count.

Reason: The lists use four patterns ("8 Anträge durchsuchen", "Aufgaben durchsuchen",
"Beschreibung suchen …", "Suchen (Nummer, Lieferant) …"), and three lists have no singular
("1 Tickets durchsuchen").

Test: A unit test of each list page renders it with no item, one item and two items and
expects the placeholder of the pattern.
