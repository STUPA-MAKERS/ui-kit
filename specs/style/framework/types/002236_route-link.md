---
id: "002236"
title: A link is a RouteLink
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# A link is a RouteLink

Every link that a view model holds must be a `RouteLink`:

```ts
interface RouteLink { readonly commands: readonly unknown[]; readonly query?: Params; readonly fragment?: string; }
```

A kit component must navigate only through a `RouteLink` of its inputs and must render it as an
`<a href>`, so that a person can open it in a new tab. An external address must be an `href` and
open in a new tab.

Reason: A real link keeps the browser behaviour and the keyboard access.

Test: Unit tests of `app-list-item` and of the head chips.
