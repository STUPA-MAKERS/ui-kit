---
id: "001304"
title: The protocol state and its actions sit in the meeting head
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-28
implementation: null
scope:
  - views/protocol
---

# The protocol state and its actions sit in the meeting head

On the page of a closed meeting, the status of the meeting head must show the state of the
protocol: "Protokoll-Entwurf", "Protokoll wird erstellt", "Protokoll final", "Protokoll final,
nicht versandt" (STUPA-Workflow:003019) or "Protokoll genehmigt". The head must hold at most one
protocol action beside the session menu: "Finalisieren" for a draft, "Senden" for a final protocol
that did not go out since its last finalization (STUPA-Workflow:003019), or "PDF" for every other
final protocol ("PDF intern" when a public variant exists). Every other protocol action must be
an item of the section "Protokoll" at the top of the session menu. The head of an approved
protocol must link the meeting that approved it. On a phone the head action must be the first
item of that section, and the head must not show the link. The sheet of an agenda item must not
show the state or the actions of the protocol.

Reason: The protocol belongs to the whole meeting. A bar on top of the sheet of an agenda item
looked like a part of that item, and five buttons in one bar were cluttered. The head already
holds a title, one action and a menu (000197).

Test: A frontend unit test that finds the status, the one head action and the menu section for
a draft and for a final protocol, and no protocol bar in the sheet.
