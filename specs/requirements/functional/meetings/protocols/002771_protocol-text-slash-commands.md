---
id: "002771"
title: The protocol text offers its inserts as slash commands
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - views/protocol/src/top-sheet-view.component.ts
scope:
  - views/protocol
---

# The protocol text offers its inserts as slash commands

The editor of a protocol text (`top-sheet-view`) must offer the commands `Tabelle`, `Bild`,
`PDF` and `Anmerkung`, in this order. In the English UI the names are `Table`, `Image`, `PDF`
and `Note`. Each command must do the same as the tool of the format bar with the same icon
(STUPA-Workflow:000862, 000863, 000873). The view must take the input `extraCommands` and show
those commands after its own, and it must emit `command` with the ID when a person runs one of
them. The format bar of the view must show each of those commands as a tool after `Anmerkung`,
in the same group, with the icon and the name of the command. `insertDocumentRef` must put an
embedded PDF of the app at the cursor of the formatted text or at the caret of the Markdown
source. A text that is not editable has no commands.

Reason: The slash commands and the format bar are two ways to the same inserts. An app adds a
command of its own, for example the search of a document archive (STUPA-Workflow:002527).

Test: A component test runs each of the four commands and one extra command, as a slash command
and as a tool of the format bar.
