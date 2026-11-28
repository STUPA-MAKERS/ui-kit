---
id: "001306"
title: The meta line in the head of a detail is a list of chips
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-28
implementation:
  - src/lib/list-detail/list-detail-bar.component.scss
scope:
  - src/lib
---

# The meta line in the head of a detail is a list of chips

The line below the title of a detail must show its facts as a list of chips, not as text with a
middle dot between the facts. This holds for the head of a Gremium, an Antrag, a Rechnung, a
Buchung, an Umbuchung, a selection of Buchungen, a Haushalt sheet, a Ticket and an Abstimmung.

1. Each fact must be a chip: the grey pill of the app chips, in the small font. A chip of a fact
   is not a control and must have no press state.
2. A status in the line must be its status chip (001305), with no second pill around it.
3. The chips must wrap onto the next line when the line is too short. No line may start with a
   dot.
4. In very high contrast a chip of a fact must have no fill and a thin white edge, so that it
   does not look like a choice (000615) or a state (000605).
5. A list row keeps its dots. The phone bar of the meeting head keeps its dots, because the bar
   has one small line below the title.
6. In the phone bar of a detail, the chips must be compact: 20 px high, in the extra-small font,
   2 px below the title. The title and the chips then fit the bar together.

Reason: A long line of facts with dots between them reads as one sentence. Chips show where one
fact ends and the next one starts, and they look like the status chip beside them.

Test: A frontend unit test that finds the facts of the Antrag head as separate chips, with no
dot in the line.
