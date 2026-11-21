---
id: "002257"
title: The records screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation: null
scope:
  - shell
  - src/lib
---

# The records screen has a fixed interface

`app-records-screen` is a copy of the record pages of the administration of STUPA-Workflow
(Erzwungene Statuswechsel, Agent-Zugänge, Audit-Log, Versionen, Backups, Webhooks, Kalender,
Rollen, Gruppen-Zuordnung): a page in the detail pane with a head, filter chips and one row
group of records. It must have this interface:

```ts
head: ScreenHead
rows: LoadState<readonly ListRow[]>
filters?: readonly FilterDef[]      // chips in the sticky bar under the head
search?: SearchDef
actions?: readonly Action[]         // head actions and FAB, placed by priority (002231)
empty: { readonly heading: string; readonly icon: IconName }
emptyFiltered?: { readonly heading: string; readonly icon: IconName }
skeleton?: number                   // grey rows while loading, default 5
more?: boolean                      // a load-more row at the end
```

Slots: `screenRow` (optional, the content of a row with kit components, for example the scopes of
an agent grant) and `screenListHead` (optional, a block above the rows).

Outputs: `query: ListQuery`, `action: { key, ids? }`, `more: void`.

Behaviour:

- The head is the page header of the pane; the filter chips sit in a sticky bar under it and
  keep their values in the URL, as on the list/detail screen (002218).
- The rows are one records row group (`rowgroup--records`); a row with a link opens it.
- Loading shows `skeleton` grey rows; a load error is a toast with "Erneut versuchen" and keeps
  the rows that were there; no rows show `empty`, or `emptyFiltered` while a filter is set.
- The container widths of the admin pages apply (000637).

Reason: Every record page of the administration then has the same head, chips, rows and states,
and the app writes no styles for them.

Test: Unit tests and a jest-axe test of `app-records-screen`, at phone, narrow and wide width.
