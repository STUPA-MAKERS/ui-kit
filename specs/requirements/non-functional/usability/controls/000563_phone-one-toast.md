---
id: "000563"
title: A phone shows one toast at a time
kind: non-functional
status: replaced
owner: frederikbeimgraben
updated: 2026-11-20
replaced_by: NF/usability/controls/000562
scope:
  - src/lib
---

# A phone shows one toast at a time

On a phone, only the newest toast must be visible. A new toast must replace the visible
toast. The live region must still announce every toast.

Reason: A stack of toasts covers too much of a small screen.
