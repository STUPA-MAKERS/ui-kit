---
id: "000690"
title: The format bar marks a segment for blackout
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - views/protocol
---

# The format bar marks a segment for blackout

The format bar of the protocol editor must have the button "Schwärzen". It must put the marker
around the selection, or remove it when the selection already has it. If the selection spans
more than one paragraph, or the cursor is in an empty line, the button must put a blackout block
(STUPA-Workflow:000965) around the selected paragraphs. In a block, the button must remove the block. In the formatted view
the shortcut must be Ctrl+Shift+X (Cmd+Shift+X on macOS). The formatted view must show the
marked segment as in 000689.

Reason: A keeper marks a name while the meeting runs, so the mark must take one action.

Test: A frontend test applies and removes the mark on a selection.
