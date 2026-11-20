---
id: "002244"
title: The settings screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The settings screen has a fixed interface

`app-settings-screen` must have this interface:

```ts
head: ScreenHead
groups: readonly SettingsGroup[]
interface SettingsGroup { readonly key: string; readonly label?: string; readonly rows: readonly SettingsRow[] }
interface SettingsRow {
  readonly key: string; readonly label: string; readonly meta?: string;
  readonly control: 'switch' | 'link' | 'value' | 'action';
  readonly value?: boolean | string; readonly link?: RouteLink; readonly action?: Action;
  readonly disabled?: boolean;
}
```

Slots: `screenGroup="<key>"` (optional, a custom body for one group with kit components).

Outputs: `change: { key, value }`, `action: { key }`.

Behaviour:

- Each group is a row group; each row is 56 px high (000631).
- A switch row toggles on a press of the whole row (000204).
- The container widths of the admin pages apply (000637).

Reason: Every settings page then has the same row groups.

Test: Unit tests and a jest-axe test of `app-settings-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
