---
id: "001277"
title: An activity row names the item, the actor, the change and the time
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - views/activity
---

# An activity row names the item, the actor, the change and the time

Each row must show the kind and the title of the item, the actor, a short text of the change
and the time. The row must open the detail page of the item. A comment or a note must show at
most its first line. A row must not show a value of a form field of an Antrag. An actor
without a name must show as "Ohne Namen" (STUPA-Workflow:000159), the platform itself as "System".

Reason: The row says enough to decide whether to open the item, without copying personal data
of an Antrag into a second view.
