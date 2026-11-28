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
nicht versandt" (STUPA-Workflow:003019) or "Protokoll genehmigt". Beside the session menu, the
head must hold "Finalisieren" for a draft, or "PDF" for a final protocol ("PDF intern" when a
public variant exists). For a holder of the right to finalize, a protocol that did not go out
since its last finalization must show "PDF" and "Senden" (STUPA-Workflow:003019). "Senden" must
be disabled, with its reason, until the PDF is stored, also while the protocol is rendered.
Every other protocol action must be an item of the section "Protokoll" at the top of the session
menu. The head of an approved protocol must link the meeting that approved it. On a phone the
head actions must be the first items of that section, and the head must not show the link. The sheet of an agenda item must not
show the state or the actions of the protocol.

Reason: The protocol belongs to the whole meeting. A bar on top of the sheet of an agenda item
looked like a part of that item, and five buttons in one bar were cluttered. The head already
holds a title, one action and a menu (000197).

Test: A frontend unit test that finds the status, the head actions and the menu section for a
draft, a protocol that is rendered and a final protocol, and no protocol bar in the sheet.
