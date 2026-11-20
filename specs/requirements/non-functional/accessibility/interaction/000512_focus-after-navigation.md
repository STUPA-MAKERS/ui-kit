---
id: "000512"
title: Focus goes to the heading after navigation
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
---

# Focus goes to the heading after navigation

After a route change, the focus must go to the `h1` of the new page. A detail pane that
opens beside a list must move the focus to its heading. When the detail closes on a phone
and the list shows again, the focus must go back to the row that opened the detail.
A change of only the query or the fragment must not move the focus.

Reason: WCAG 2.4.3. Without this, a screen reader stays at the old link and does not
announce the new page.
