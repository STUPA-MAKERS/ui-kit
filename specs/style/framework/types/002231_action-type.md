---
id: "002231"
title: The Action type has a fixed set of fields
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - src/lib/screen/screen.types.ts
  - src/lib/screen/actions.ts
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
  readonly disabledReason?: string;           // why it is disabled: tooltip of the button, description of a menu item
  readonly busy?: boolean;                    // shows the spinner of the button and blocks a second press
  readonly route?: RouteLink;                 // a link instead of an output
  readonly href?: string;                     // an external link, opens in a new tab
  readonly confirm?: ConfirmSpec;
  readonly group?: string;                    // the section of the ⋮ menu
  readonly overflow?: 'auto' | 'never' | 'always'; // manual override of the ⋮ placement, default 'auto'
}
interface HeadSlots { readonly phone?: number; readonly narrow?: number; readonly wide?: number; } // icon buttons in the head per width
interface ConfirmSpec { readonly title: string; readonly text?: string; readonly confirmLabel: string; readonly word?: string; }
```

The kit must place actions so:

| Priority | Wide (≥ 1200 px) | Narrow | Phone (< 768 px) |
| --- | --- | --- | --- |
| `head` | icon button in the head button group | icon button in the head button group | the first one in the head (000197), the rest in ⋮ |
| `menu` | ⋮ menu | ⋮ menu | ⋮ menu |
| `fab` | FAB, more than one as a FAB group (STUPA-Workflow:001982) | FAB | FAB that folds on scroll (000567) |

Every screen must take an optional input `headSlots: HeadSlots` that overrides how many `head`
actions stay in the head at each width; the rest goes into the ⋮ menu. An action with `overflow:
'never'` must stay in the head at every width and counts against the slots; an action with
`overflow: 'always'` must go into the ⋮ menu at every width. Without an override the table above
applies.

A `danger` action must stand last in its menu section and be red (000400). An action with
`confirm.word` must ask the person to type the word (STUPA-Workflow:000303). A view must show an action in one
place only (000671).

Reason: A fixed type lets the kit apply every button and menu rule without the app.

Test: Unit tests of the placement table at the three widths.
