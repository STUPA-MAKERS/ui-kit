---
id: "002242"
title: The form screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - screens/src/form-screen/form-screen.component.ts
scope:
  - screens
---

# The form screen has a fixed interface

`app-form-screen` must have this interface:

```ts
head: ScreenHead                  // the title is the name of the submit button (000666)
icon?: IconName                    // 001890: the icon of the thing for a new one, `edit` (default) for an edit
subtitle?: string                  // muted after the title, behind a middle dot (001890)
form: FormDef                      // 002255
value: Record<string, unknown>
errors?: Record<string, string>    // by field key, from the server
submit: { readonly label: string; readonly busy?: boolean }
discard?: { readonly label: string } // 000635: a page without a way out; it replaces Abbrechen
```

No slots: the screen is the head bar and the form, as "Antrag bearbeiten".

Outputs: `valueChange`, `submit`, `discard`, `cancel`.

Behaviour:

- The form stands in place of a detail with the head bar of "Antrag bearbeiten" (001890); the
  label of Abbrechen ends at the side inset (001891).
- Wider than a phone, a form screen on the page itself is a sheet on surface 1 with the round
  corners of the detail pane; in the very high contrast it has the white edge of a surface.
- On a phone, the bar at the top shows the X and the title, as in "Antrag bearbeiten"
  (`ListDetailTask`): the bar of the one-view layout, or the screen's own bar outside it. The head
  bar then stays for screen readers only. A page with `discard` has no X and keeps the head bar.
- Speichern floats at the bottom on a phone (000198) above the bottom bar (000408).
- A form that can close shows only "Abbrechen", which asks before it drops changes; a page
  with `discard` (a settings page) shows only "Verwerfen", while there are changes.
- Leaving with unsaved changes asks first.

Reason: Every create and edit form then has the same head bar, buttons and leave guard.

Test: Unit tests and a jest-axe test of `app-form-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
