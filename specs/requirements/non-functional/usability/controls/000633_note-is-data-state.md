---
id: "000633"
title: A note shows a state of the data, not a failed request
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A note shows a state of the data, not a failed request

An error note (`app-note` with `kind="error"`) must show only a state of the data that the
user can change on this view: a value that is not allowed, or a conflict between two records.
A request that fails (a load, a save, a delete, an upload) must show as a toast
(`NF/usability/controls/000401`), also when the request starts in a dialog. The dialog must
stay open after a failed request.

Reason: A note stays until the data changes, so it fits a state that the user repairs in
the form. A failed request has nothing to repair in the form, and a note about it stays
after the next try succeeds or covers the fields of a dialog.

Test: A unit test of each of these components makes the request fail and expects one error
toast and no `app-note` with `kind="error"`.
