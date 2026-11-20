---
id: "002262"
title: The route helpers have fixed signatures
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - shell/src/framework/routes.ts
scope:
  - shell
---

# The route helpers have fixed signatures

The route helpers (002224) must have these signatures:

```ts
type ScreenComponent = Type<unknown> | (() => Promise<Type<unknown>>);   // a loader keeps the chunk lazy
function listDetailRoutes(o: { path: string; title: string; list: ScreenComponent; detail: ScreenComponent;
  param?: string; children?: Routes; canMatch?: CanMatchFn[]; none?: ListNoneData }): Route;
function screenRoute(o: { path: string; title: string; component: ScreenComponent; frame?: 'rail' | 'public' | 'bare';
  footer?: boolean; canMatch?: CanMatchFn[] }): Route;
```

The helpers must load the component lazily, add the empty detail route, set the motion data and
the title, and move the focus to the `h1` after the navigation (000512).

Reason: Fixed helpers keep every route the same.

Test: Unit tests of both helpers.
