---
id: "002798"
title: The accessibility statement can be on another site
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-24
implementation:
  - shell/src/framework/framework.ts
  - shell/src/shell-menu/shell-menu.component.ts
scope:
  - shell
---

# The accessibility statement can be on another site

`FrameworkConfig.a11yStatement` must take a route or an address. With an address, the item
"Erklärung zur Barrierefreiheit" of the accessibility menu must be an `<a href>` that opens the
address in a new tab.

Reason: The spec explorer has no statement of its own: it links to the statement of the
platform at `/barrierefreiheit` (`spec-explorer:NF/accessibility/statement/000077`).

Test: A unit test of `app-shell-menu` with an address.
