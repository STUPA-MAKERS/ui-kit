---
id: "002259"
title: The sections screen has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
implementation:
  - screens/src/sections-screen/sections-screen.component.ts
scope:
  - shell
  - src/lib
---

# The sections screen has a fixed interface

`app-sections-screen` is a copy of the section pages of the administration of STUPA-Workflow
(Gruppen-Zuordnung, Backups): a page in the detail pane with a head and a column of blocks, each
with its own load state. It must have this interface:

```ts
head: ScreenHead
actions?: readonly Action[]  // head actions and FAB, placed by priority (002231)
```

Content: the blocks of the page, in order: record sections (002258), kit sections and notes.

Outputs: `action: { key }`.

Behaviour:

- The head is the page header of the pane. The blocks sit in one column 20 px apart.
- The screen has no load state of its own: each record section loads, fails and stays empty on
  its own, so one failed list does not hide the others.
- In the pane of a list/detail page the screen starts 32 px below the top of the sheet, as the
  records screen does (002257), and a page with a FAB ends with room for it.

Reason: A page with more than one list keeps the head, the gaps and the pane offset of the
other screens, and the app writes no page styles.

Test: Unit tests and a jest-axe test of `app-sections-screen`, at phone, narrow and wide width.
