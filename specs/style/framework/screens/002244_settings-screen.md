---
id: "002244"
title: The settings screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation: null
scope:
  - shell
  - src/lib
---

# The settings screen has a fixed interface

`app-settings-screen` is a copy of the settings pages of STUPA-Workflow (Benachrichtigungen,
Funktionen, Hilfe & Tickets). It must have this interface:

```ts
head: ScreenHead
groups: readonly SettingsGroup[]
state?: SettingsState              // default ready
save?: { readonly dirty: boolean; readonly busy?: boolean } | null

interface SettingsGroup { readonly key: string; readonly label?: string; readonly rows: readonly SettingsRow[] }
interface SettingsRow {
  readonly key: string; readonly label: string; readonly meta?: string;
  readonly control: 'switch' | 'link' | 'value' | 'action';
  readonly value?: boolean | string; readonly link?: RouteLink; readonly action?: Action;
  readonly disabled?: boolean;
}
type SettingsState =
  | { state: 'loading' } | { state: 'ready' }
  | { state: 'forbidden'; message: string }
  | { state: 'error'; message: string; retry: () => void };
```

Slots: `screenGroup="<key>"` (optional, a custom body for one group with kit components, for
example the Wiki address).

Outputs: `change: { key, value }`, `action: { key }`, `save`, `discard`.

Behaviour:

- The title is the page header; a group with a label is a section with its heading, its rows
  are a settings row group; each row is at least 56 px high (000631). A switch row toggles on a
  press of the whole row (000204); `meta` is the hint under the label.
- Without `save` each change goes out at once (Benachrichtigungen). With `save` the changes are a
  draft: while it has changes, Verwerfen stands in the head and a FAB "Speichern" saves
  (Funktionen, Hilfe & Tickets).
- Loading shows the real labels with a grey switch; the missing right shows as a warning note
  with a lock; a load error is a toast with "Erneut versuchen" (`app-load-state` of the app).
- An action with `confirm` asks first.
- In the pane of a list/detail page the screen starts 32 px below the top of the sheet, and the
  page ends with room for the FAB. On a phone the bar names the page from the start
  (`ListDetailScreenConfig.barTitle`), as the administration of the app does.
- The labels have the normal weight.
- The container widths of the admin pages apply (000637).

Decisions, each approved on its own card:

- Both save kinds; the page picks with `save`.
- The kit shows loading, the missing right and the load error.
- The labels have the normal weight, as on Funktionen and Hilfe & Tickets.

Reason: Every settings page then has the same row groups.

Test: Unit tests and a jest-axe test of `app-settings-screen`, at phone, narrow and wide width.
