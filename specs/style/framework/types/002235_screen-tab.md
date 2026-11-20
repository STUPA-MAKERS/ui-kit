---
id: "002235"
title: A tab of a screen is a ScreenTab with a slot
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# A tab of a screen is a ScreenTab with a slot

A tab of a detail screen must be given as a `ScreenTab` and its body as a slot with the same key:

```ts
interface ScreenTab { readonly key: string; readonly label: string; readonly icon?: IconName; readonly mark?: 'new' | 'warn' | null; readonly hidden?: boolean; }
```

```html
<app-detail-screen [head]="head()" [tabs]="tabs()" [actions]="actions()" (action)="onAction($event)">
  <ng-template screenTab="overview">…</ng-template>
  <ng-template screenTab="history">…</ng-template>
</app-detail-screen>
```

The screen must keep the open tab in the URL (`tab`), render only the open tab, show no count on a
tab (000560), pack the tabs at the start on a phone (000673) and make the tabs swipeable on a
phone. A tab without a slot must fail the build of the page in dev mode.

Reason: Tabs as data plus slots keep the tab bar the same and the content free.

Test: Unit tests of the detail screen: URL, swipe and a missing slot.
