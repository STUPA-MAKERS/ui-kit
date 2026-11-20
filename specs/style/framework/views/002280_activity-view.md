---
id: "002280"
title: The activity view takes entries
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The activity view takes entries

`/views/activity` must export the view and these view models:

```ts
interface ActivityEntry { readonly id: string; readonly item: { title: string; icon: IconName; link: RouteLink };
  readonly actor: PersonRef | null; readonly change: string; readonly time: string; readonly new?: boolean }
```

Outputs: `entryOpen: id`, `more`.

Behaviour:

- A row names the item, the actor, the change and the time (001277); a new entry has a dot.

Reason: Every activity list then looks the same.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
