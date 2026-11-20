---
id: "002231"
title: The Action type has a fixed set of fields
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The Action type has a fixed set of fields

An `Action` (002219) must have this type:

```ts
interface Action {
  readonly key: string;                       // emitted by the (action) output
  readonly label: string;                     // the visible name and the accessible name
  readonly icon?: IconName;                   // required for priority 'head' and 'fab'
  readonly kind?: 'main' | 'normal' | 'danger'; // default 'normal'
  readonly priority?: 'head' | 'menu' | 'fab';  // default 'menu'
  readonly disabled?: boolean;
  readonly busy?: boolean;                    // shows the spinner of the button and blocks a second press
  readonly route?: RouteLink;                 // a link instead of an output
  readonly href?: string;                     // an external link, opens in a new tab
  readonly confirm?: ConfirmSpec;
  readonly group?: string;                    // the section of the ⋮ menu
}
interface ConfirmSpec { readonly title: string; readonly text?: string; readonly confirmLabel: string; readonly word?: string; }
```

The kit must place actions so:

| Priority | Wide (≥ 1200 px) | Narrow | Phone (< 768 px) |
| --- | --- | --- | --- |
| `head` | icon button in the head button group | icon button in the head button group | first two in the head, the rest in ⋮ |
| `menu` | ⋮ menu | ⋮ menu | ⋮ menu |
| `fab` | FAB, more than one as a FAB group (001982) | FAB | FAB that folds on scroll (000567) |

A `danger` action must stand last in its menu section and be red (000400). An action with
`confirm.word` must ask the person to type the word (000303). A view must show an action in one
place only (000671).

Reason: A fixed type lets the kit apply every button and menu rule without the app.

Test: Unit tests of the placement table at the three widths.
