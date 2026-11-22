---
id: "002152"
title: The app reloads at most twice for the same server version
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
implementation: null
scope:
  - src/lib
---

# The app reloads at most twice for the same server version

Before a reload of 002151, the app must store the server version, the number of reloads for
it and the time in the session storage of the tab. The second reload for the same server
version removes the service worker first (STUPA-Workflow:002340). After two reloads for the
same server version within 10 minutes, the app must not reload again.

Reason: A broken service worker cache or a proxy cache can keep the old frontend after the
reload. Without the guard, the app would reload without end.

Test: A unit test stores two reloads for one version, answers with that version and expects
no reload. An answer with a third version reloads.
