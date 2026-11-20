---
id: "002243"
title: The wizard screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The wizard screen has a fixed interface

`app-wizard-screen` must have this interface:

```ts
head: ScreenHead
form: FormDef                      // each section is a step
value: Record<string, unknown>
step: number
errors?: Record<string, string>
submit: { readonly label: string; readonly busy?: boolean }
intro?: { readonly groups: readonly ChoiceGroup[] } // a choice step before the form, for example the Antragsart (001181)
```

Slots: none.

Outputs: `valueChange`, `stepChange`, `choice`, `submit`.

Behaviour:

- The steps show in the stepper; the blocks of a step have one even spacing (001185).
- Weiter checks the fields of the step; a step with an error stays open.
- The step is in the URL (`step`).

Reason: A wizard built from the same FormDef needs no own page code.

Test: Unit tests and a jest-axe test of `app-wizard-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
