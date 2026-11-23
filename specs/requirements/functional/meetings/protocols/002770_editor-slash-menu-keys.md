---
id: "002770"
title: The command menu filters, runs and closes with the keyboard
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

# The command menu filters, runs and closes with the keyboard

The text that a person types after the `/` must filter the commands: a command stays while a
word of its name starts with that text, without regard to upper and lower case. The first
command of the menu must be marked. Arrow down and arrow up must move the mark. Enter, Tab or a
press on a command must run it: the editor must remove the `/` and the text after it and emit
`slashCommand` with the ID of the command. The cursor must stay at that place. Escape, a space,
a press outside the menu or a text that fits no command must close the menu and keep the typed
text. The menu must be a list box that a screen reader reads (`role="listbox"`, the marked
command as the active option).

Reason: A menu that takes the keys of a text editor must give them back at once when the person
does not want a command, so a `/` in a normal sentence costs nothing.

Test: A unit test filters, moves the mark, runs a command with Enter and with a press, and
closes the menu with Escape and with a text that fits no command.
