---
id: "002222"
title: A form is built from a definition
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - screens/src/form/form.component.ts
scope:
  - src/lib
---

# A form is built from a definition

A form must be built by `app-form` of the kit, on Angular signal forms and without ngx-formly, from a `FormDef`: sections, and fields with key, kind, label,
required, options, limits, `visible` and `disabled`. The field kinds must be text, textarea,
number, money, date, date range, time, select, multi-select, checkbox, switch, tree select, file,
Markdown, repeat group and display. The app must compute `visible` and `disabled` and give them
as data. The kit must show the field errors that the app gives by field key, and its own
required and format errors. A wizard (002201) must use the sections of the same `FormDef` as
steps.

Reason: One form renderer gives every create form, edit form, settings page and wizard the same fields and errors.

Test: Unit tests of `app-form` for each field kind, and the jest-axe test.
