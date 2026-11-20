---
id: "002278"
title: The form editor edits a FormDef
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The form editor edits a FormDef

`/views/form-editor` must export the view and these view models:

```ts
input: FormDef; kinds: readonly FieldDef['kind'][]; languages: readonly string[]
```

Outputs: `change: FormDef`, `select: key | null`.

Behaviour:

- A preview renders the same `app-form` (002255).

Reason: The form editor then edits exactly what the form renders.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
