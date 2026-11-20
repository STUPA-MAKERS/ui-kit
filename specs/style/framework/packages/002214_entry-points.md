---
id: "002214"
title: The kit has six kinds of entry points
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src
  - shell
---

# The kit has six kinds of entry points

The kit must ship these entry points of `@stupa-makers/ui-kit`:

| Entry point | Holds |
| --- | --- |
| `@stupa-makers/ui-kit` (core) | Tokens, styles, primitives (button, icon, field, chip, switch), overlays (dialog, sheet, popover, toast), patterns (row group, list item, facts, empty state, skeleton) and the shared types of 002219 to 002222. No router. |
| `/shell` | The frame of an app, the navigation, the account menu, the help and accessibility menus, the display settings, the search palette, the status bars and `provideFramework()`. |
| `/screens` | The screens of 002201 and the route helpers of 002224. |
| `/views/<domain>` | One entry point for each domain view of 002203, for example `/views/graph`, `/views/calendar`, `/views/board`. |
| `/markdown-editor`, `/markdown-view`, `/pwa` | As now. |
| `/testing` | The fixtures of every view model, the test harnesses and the axe helpers. |

A new entry point must be added to this table first.

Reason: An app loads a heavy view (graph layout, Tiptap) only on the route that shows it.

Test: A unit test reads the `ng-package.json` files and compares them with the table.
