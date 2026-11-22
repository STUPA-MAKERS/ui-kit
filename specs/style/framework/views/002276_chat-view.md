---
id: "002276"
title: The chat view takes messages, events and a file port
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-22
implementation:
  - views/chat/src/chat-view.component.ts
scope:
  - views/chat
---

# The chat view takes messages, events and a file port

`/views/chat` must export `app-chat-view`, a copy of `app-chat` of STUPA-Workflow (application
comments, the applicant status sheet, ticket notes, card activity), and these view models:

```ts
interface ChatFile { readonly id: string; readonly filename: string; readonly mime: string; readonly size: number;
  readonly url: string; readonly scanState?: 'scanning' | 'clean' | 'quarantined'; readonly lost?: boolean }
interface ChatMessage { readonly id: string; readonly author: PersonRef | null; readonly authorLabel?: string | null;
  readonly body: string /* Markdown */; readonly at: string; readonly editedAt?: string | null; readonly own: boolean;
  readonly canEdit?: boolean; readonly visibility?: string | null; readonly files?: readonly ChatFile[];
  readonly state?: 'sent' | 'sending' | 'failed'; readonly mentions?: readonly PersonRef[] }
interface ChatEvent { readonly id: string; readonly at: string; readonly text: string }
interface ChatVisibilityOption { readonly value: string; readonly label: string }
```

Inputs: `messages`, `events`, `canPost`, `loading`, `visibilities: readonly ChatVisibilityOption[]`
(empty: no switch), `guardVisibility: boolean` (the labels name the readers, a public draft has
a frame, each message starts with the first option), `draftKey`, `placeholder: string | null`,
`canAttach`, `mentionables: readonly PersonRef[]`, `publicMentions`.

Outputs: `send: { body, visibility?, mentions?, fileIds?, files? }`, `edit: { id, body, mentions?, restore? }`,
`delete: { id }`, `retry: { id }`, `discard: { id }`, `refresh`.

Files: the app provides `CHAT_FILES`, a port with the draft files of the composer (`files`,
`pending`, `busy`, `maxFileBytes`, `accept`, `upload`, `remove`, `clear`, `discard`, `fileUrl`,
the thread key and `release`), so the view knows no upload API. Without the port the chat takes
no files. The `send` output carries the ids of the draft files; the app adds its draft token.

Texts: the view reads its texts through `UI_KIT_INTL` (`chat.*`), so an app can map them to its
own catalogue.

Behaviour: every rule of `app-chat` of STUPA-Workflow stays (groups within 5 minutes, day
separators, events in the middle, "N neue", follow at the end, composer up to 6 lines,
Enter sends on a desktop, draft per thread, optimistic send with retry, edit and delete on
hover or a long press on a phone, files by the paperclip, paste and drop, "@" mentions), and:

- The composer has the same gap below as at its side (000602).
- The visibility switch names who reads the message (STUPA-Workflow:001691).

Reason: Every comment thread then looks the same, and the app only maps its API.

Test: The specs of `app-chat` run against the view through the app adapter; unit tests and a
jest-axe test of the view with the fixtures of `/testing`.
