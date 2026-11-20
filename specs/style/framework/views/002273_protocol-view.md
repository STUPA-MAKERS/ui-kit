---
id: "002273"
title: The protocol view is the Markdown editor with the protocol tools
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The protocol view is the Markdown editor with the protocol tools

`/views/protocol` must export the view and these view models:

```ts
interface ProtocolEditorInput { readonly value: string; readonly readOnly?: boolean;
  readonly knownNames?: readonly string[];      // 000969
  readonly tools?: readonly ('blackout' | 'time-note' | 'pdf' | 'vote' | 'image' | 'table' | 'math')[];
  readonly votes?: readonly { id: string; label: string }[] }
```

Outputs: `valueChange: string`, `insertVote: id`.

Behaviour:

- The format bar has the blackout tool (000690) and the time-note tool (000873).
- An embedded PDF shows as a file badge (000863); a marked segment shows as marked (000689) and a
  black bar has one width and the text colour (000688).
- Images go through the `upload` port.

Reason: The protocol editor then needs only the text and the names.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
