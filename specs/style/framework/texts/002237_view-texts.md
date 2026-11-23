---
id: "002237"
title: Each view brings its own texts
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - src/lib/intl/intl.ts
scope:
  - src/lib/intl
  - views
---

# Each view brings its own texts

The core catalogue of the kit (002223) must hold only the texts of the controls, of the shell and
the texts that more than one view uses. A text that only the views of one entry
`@stupa-makers/ui-kit/views/<name>` use must be in the file `<name>.texts.ts` of that entry, with
a DE and an EN text, and its key must be in the key type `UiKit<Name>TextKey`.

Each component of a view that shows one of these texts must give them to `registerUiKitTexts()`
before its first render. The texts then load in the chunk of the view, and not in the start
bundle of an app.

An override of the app wins over a registered text, and a registered text wins over the DE
text.

Reason: The texts of all views made the start bundle of STUPA-Workflow bigger than its budget of
1 MB (002003 of STUPA-Workflow), although an app shows each view only on its own page.

Test: The type of each texts file has every key of its view in DE and EN, and the kit build fails
when one is missing. The unit test of the kit intl checks that a view text is not in the core
catalogue, that it translates after the registration, and that an override wins.
