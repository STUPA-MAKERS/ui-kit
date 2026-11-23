---
id: "002769"
title: A slash at the start of a word opens the command menu of the editor
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
tests:
  - "markdown-editor/src/markdown-editor.slash-menu.spec.ts:MarkdownEditorSlashMenu"
implementation:
  - markdown-editor/src/slash-menu.ts
  - markdown-editor/src/markdown-editor.component.ts
scope:
  - markdown-editor
---

# A slash at the start of a word opens the command menu of the editor

The Markdown editor must take the input `slashCommands`: a list of commands, each with an ID,
an icon and a name. When a person types `/` at the start of a word, the editor must show a menu
with the commands at the cursor. The `/` must stay in the text while the menu is open. Inside a
word, in code, in the raw Markdown mode and without commands, `/` must stay plain text and no
menu opens.

Reason: A person who writes the protocol inserts an element without a move of the hand from the
keyboard to the format bar.

Test: A unit test types `/` at the start of a word, inside a word, in a code block and without
commands.
