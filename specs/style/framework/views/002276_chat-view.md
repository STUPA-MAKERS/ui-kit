---
id: "002276"
title: The chat view takes messages and a composer
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The chat view takes messages and a composer

`/views/chat` must export the view and these view models:

```ts
interface ChatMessage { readonly id: string; readonly author: PersonRef; readonly time: string; readonly text: string;
  readonly visibility?: string; readonly files?: readonly FileRef[]; readonly system?: boolean; readonly actions?: readonly Action[] }
interface Composer { readonly visibilities?: readonly { value: string; label: string; readers: string }[];
  readonly value?: string; readonly files?: boolean }
```

Outputs: `send: { text, visibility?, files }`, `action: { id, key }`.

Behaviour:

- The composer has the same gap below as at its side (000602).
- The visibility switch names who reads the message (STUPA-Workflow:001691).

Reason: Every comment thread then looks the same.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
