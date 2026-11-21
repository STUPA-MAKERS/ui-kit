---
id: "002243"
title: The wizard screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation: null
scope:
  - shell
  - src/lib
---

# The wizard screen has a fixed interface

`app-wizard-screen` is a copy of the apply wizard of STUPA-Workflow (001180-001185). It must have
this interface:

```ts
head: ScreenHead
form: FormDef
steps: readonly WizardStep[]       // named steps, each with one or more sections of the form
value: Record<string, unknown>
step: number                       // the start step, from 0; the `step` of the URL wins
errors?: Record<string, string>
intro?: WizardIntro                // a choice step before the form, for example the Antragsart
review?: WizardReview              // the summary step after the form ("Prüfen & absenden")
submit: { readonly label: string; readonly busy?: boolean; readonly disabled?: boolean }
discard?: { readonly label: string; readonly title: string; readonly body: string }
saved?: string                     // the note under the stepper ("Entwurf in diesem Tab gespeichert")
leave?: { readonly label: string } // the back arrow of the phone bar

interface WizardStep {
  readonly key: string;
  readonly label: string;          // the name in the stepper, "Angaben"
  readonly title: string;          // the title of the step, "Angaben zum Vorhaben"
  readonly sections: readonly string[];
}
interface WizardIntro {
  readonly key: string;
  readonly label: string;          // the name in the stepper, "Antragsart"
  readonly title: string;          // "Antragsart wählen"
  readonly groups: readonly ChoiceGroup[];
  readonly chosen: string | null;  // the value the page keeps; Weiter needs one
}
interface ChoiceGroup {
  readonly key: string;
  readonly label?: string;         // without a label the options stand alone (002282)
  readonly text?: string;          // Markdown, always visible under the label
  readonly options: readonly { readonly value: string; readonly label: string }[];
}
interface WizardReview {
  readonly key: string;
  readonly label: string;
  readonly title: string;
  readonly hint?: string;          // the line under its name in the stepper
}
```

Slots: one per step, `<ng-template screenWizardStep="<step key>">`, shown under the content of
that step. A page puts its own parts there (Folgeantrag, Kontakt, ALTCHA).

Outputs: `valueChange`, `stepChange`, `choice`, `submit`, `discard`, `leave`.

Behaviour:

- Desktop: the page title and a vertical stepper stand in a sticky column on the left; the step is
  a sheet on the right. Each stepper line shows the chosen option, the section names or the hint.
  Only a done step opens from the stepper.
- The step shows "Schritt n von m" above its title. After the choice the chosen option follows
  the count ("Schritt 2 von 3 · Projektantrag: VSM").
- The choice step shows the groups as radio rows. A group with a label is a section with the
  label as its heading, and its text renders as Markdown (lists, bold, links; no images) with the
  renderer of the kit (`markdownToSafeHtml`).
- Weiter checks the fields of the step (`app-form` with `only`, 002256). A step with an error stays
  open, the focus moves to the first field with an error, and a toast says "Bitte prüfe die
  markierten Felder.". The submit button checks every step and opens the first one with an error.
- The review step is built by the kit from the FormDef and the value: one section per form
  section, one row per filled field.
- Zurück and Weiter stand in the footer of the step; the submit button takes the place of Weiter
  on the last step. "Entwurf verwerfen" stands at the left of the footer, and on a phone under the
  sheet; it asks first. The page passes `discard` only when there is a draft.
- Phone: a bar with the back arrow and the title; the stepper is hidden, the buttons fill the
  width.
- The step is in the URL (`step`, from 1). A step after the choice does not open from the URL
  while nothing is chosen.

Decisions, each approved on its own card:

- The steps are named lists of sections (`steps`), as in the app.
- The kit builds the summary, the app built it in the page.
- App-only parts come in through one slot per step.
- The group text is Markdown, rendered by the kit.
- The hidden phone "Entwurf verwerfen" takes no gap on the desktop, so the page does not move
  20px to the left after the first pick (a bug of the app).

Reason: A wizard built from the same FormDef needs no own page code.

Test: Unit tests and a jest-axe test of `app-wizard-screen` with the fixtures of `/testing`, at
phone, narrow and wide width.
