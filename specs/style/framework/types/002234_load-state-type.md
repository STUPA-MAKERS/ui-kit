---
id: "002234"
title: LoadState has four cases
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - src/lib/screen/load-state.ts
scope:
  - src/lib
---

# LoadState has four cases

`LoadState` (002220) must have this type:

```ts
type LoadState<T> =
  | { readonly state: 'loading'; readonly previous?: T } // previous: keep the old data and show the load bar
  | { readonly state: 'ready'; readonly data: T; readonly more?: boolean } // more: the load-more row (000741)
  | { readonly state: 'empty'; readonly heading: string; readonly icon: IconName } // 001364
  | { readonly state: 'error'; readonly message: string; readonly retry: () => void };
```

`loading` without `previous` must show the skeleton in the shape of the page (000893). `loading`
with `previous` must show the old data and the load bar only after its delay (000189). `empty`
must show the empty state with the face (001360). `error` must show a toast with the retry action
(000576) and keep the old data if there is any; without old data it shows the face with the
error text (002405).

Reason: Four fixed cases give every view the same loading, empty and error behaviour.

Test: Unit tests of `toLoadState()` and of a screen in each case.
