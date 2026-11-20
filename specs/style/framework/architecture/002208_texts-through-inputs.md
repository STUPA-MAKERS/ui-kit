---
id: "002208"
title: Content texts come from the app, control texts from the kit
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# Content texts come from the app, control texts from the kit

A kit component must take every content text through an input. Its own control texts (for
example Schließen, Mehr, Öffnen, Abbrechen) must come from the i18n token of the kit with built-in
DE and EN texts. An app must change a control text only through the text overrides of 002207.

Reason: A control has the same word in every app, and a content word stays the choice of the app.

Test: The text-language test of the kit (`src/lib/text-lang.spec.ts`).
