---
id: "002230"
title: The head of a screen is a ScreenHead
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - src/lib/screen/screen.types.ts
scope:
  - src/lib
---

# The head of a screen is a ScreenHead

The head of every screen must be given as a `ScreenHead`:

```ts
interface ScreenHead {
  readonly title: string;              // the h1 of the page, also the page title
  readonly kicker?: string;            // the first meta chip, for example the number "A-0123"; never a line above the title
  readonly status?: StatusChip;        // 001305
  readonly meta?: readonly MetaChip[]; // 001306, in this order
  readonly back?: BackTarget | null;   // null: no back button; absent: the parent route
  readonly lang?: LangSwitch;          // 000672, the language of a content editor
}
interface StatusChip { readonly label: string; readonly kind: StatusKind; }
interface MetaChip { readonly label: string; readonly icon?: IconName; readonly link?: RouteLink; readonly title?: string; }
type BackTarget = RouteLink | { readonly action: string };
```

The screen must render the title as the one `h1` of the page (000520), set the page title from it
(000511) and keep the head as far from the top as from the side (001340). The actions of the head
must come from the `Action[]` of the screen (002219), not from the `ScreenHead`.

Reason: One head type gives every page the same head anatomy.

Test: Unit tests of each screen with a full and with a minimal ScreenHead.
