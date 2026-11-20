---
id: "002250"
title: The editor screen has a fixed interface
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
  - src/lib
---

# The editor screen has a fixed interface

`app-editor-screen` must have this interface:

```ts
head: ScreenHead                 // with the language switch (000672) when the content has languages
state: LoadState<unknown>
dirty: boolean
save: { readonly label: string; readonly busy?: boolean }
discard?: { readonly label: string }
```

Slots: `screenEditor` (the flow editor, the form editor, the protocol editor or the plan table), `screenInspector` (optional, the side panel).

Outputs: `save`, `discard`, `langChange`.

Behaviour:

- The editor opens without the list (STUPA-Workflow:001482); the inspector is a side sheet; on a phone the
  inspector is a bottom sheet.

Reason: Every full-page editor then has the same head, save and discard.

Test: Unit tests and a jest-axe test of `app-editor-screen` with the fixtures of `/testing`, at phone, narrow and wide width.
