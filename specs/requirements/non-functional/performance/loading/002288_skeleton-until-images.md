---
id: "002288"
title: A list with images keeps its skeleton until the images have loaded
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - screens
---

# A list with images keeps its skeleton until the images have loaded

On the first load, a list whose rows show images must show its skeleton until each image of the
answer has loaded or failed. The wait must not be longer than 3 seconds. After 3 seconds the rows
show, and an image that is still loading appears in its row when it arrives. An image that fails
counts as loaded, because its row shows the fallback. A refresh must not show the skeleton again.

Reason: Without the wait, the rows show with fallbacks and the images replace them one by one,
so the list flickers. The limit stops one slow image from holding the whole list.

Test: A unit test of the preloader checks that a failed image counts as done and that the wait
ends after 3 seconds.
