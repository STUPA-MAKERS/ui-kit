---
id: "002278"
title: The form editor view takes the body of the Formular-Editor
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-28
implementation:
  - views/form-editor/src/form-editor-view.component.ts
  - views/form-editor/src/form-editor.util.ts
  - views/form-editor/src/form-field.util.ts
scope:
  - views/form-editor
---

# The form editor view takes the body of the Formular-Editor

`/views/form-editor` must export `app-form-editor-view`, a copy of the body of the
Formular-Editor (`app-form-editor`) of STUPA-Workflow, with the same behaviour:

- the tabs "Fragen", "Formular", "Regeln" and "Versionen" (app spec 003171);
- in "Fragen": every group one below the other, each with its heading, + ("Frage hinzufügen"
  with the menu of the question types, a bottom sheet on a phone) and the ⋮ menu of the group in
  one button group, the group title and one card per question with its type, key, required flag,
  texts, type options and "Erweiterte Optionen" as an expandable settings row; then "+ Gruppe";
- the card "Formular" (title, description, Mit Budget, signature rows, Anhang Pflicht,
  Vergleichsangebote) and the rules across fields;
- the preview of the form;
- the skeleton of the first load.

Inputs: `loading`, `preview`, `budgetOn`. Two-way models: `groups`, `title`, `description`,
`hasBudget`, `signatureRows`, `attachmentRequired`, `cmpRequired`, `cmpMinCount`, `rules`,
`selected`, `page`. The app projects its versions as `[formVersions]` into the tab "Versionen".
The parent provides `ContentLangState`.

View models: the form types of STUPA-Workflow (`FormFieldDef`, `FieldType`, `FormRule`), with the
same fields, so the app passes its API objects as they are. The form helpers (`form-field.util`:
groups, moves, checks, normalisation) and the rule helpers (`toDraft`, `toRule`,
`formEditorValid`) move with them.

The page, the header (title, version, active, content language, preview, discard), the load, the
save, the activation and the versions stay in the app.

App parts: the view knows no route, no permission and no server.

Texts: the view reads its texts through `UI_KIT_INTL` (`admin.form.*`, `admin.forms.*`), so an
app can map them to its own catalogue.

Behaviour: every rule of the app component stays (000135, 000136, 001631, 001670, 001680,
001732).

Reason: The Formular-Editor page then needs only data, and another app gets the same editor.

Test: The specs of the app component run against the view; unit tests and a jest-axe test of the
view with the fixtures of `/testing`.
