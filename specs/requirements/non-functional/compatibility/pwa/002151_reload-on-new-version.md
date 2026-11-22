---
id: "002151"
title: A new app version reloads the app at once
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
implementation: null
scope:
  - src/lib
---

# A new app version reloads the app at once

When an API answer carries an `X-App-Version` (STUPA-Workflow:002150) that is not the build ID of the
running app, the app must reload the page at once, without a wait for the service worker
(STUPA-Workflow:002340). The app must not show an update notice. While a text field has the focus,
the reload must wait until the next page change or the next API answer while no text field
has the focus. An answer without the header or a local build with the build ID `dev` must not
reload.

Reason: An old frontend against a new API can fail. A notice that waits for a click leaves
people on the old version for days. Typed text that is not saved must not be lost.

Test: A unit test answers with another version and expects one reload. With the focus in a text field it expects no reload until the next page change.
