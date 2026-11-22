---
id: "002273"
title: The protocol views take the TOP sheet and the protocol bar
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-22
implementation: null
scope:
  - views/protocol
---

# The protocol views take the TOP sheet and the protocol bar

`/views/protocol` must export copies of these protocol components of STUPA-Workflow, with the
same behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-top-sheet-view` | `app-top-sheet` | the open TOP: kind line, title with rename, keeper line, format bar, "Erledigt", the switch formatted/Markdown, the save state, the notes (public, open blackout) and the editor or the Markdown source |
| `app-protocol-bar-view` | `app-protocol-bar` | the protocol action of the meeting head ("Finalisieren & senden" or "PDF"), the "Protokoll" section of the session menu and its confirmations |

View models: the meeting types of STUPA-Workflow (`Meeting`, `AgendaItem`, `Protocol`), with the
same fields, so the app passes its API objects as they are. The inputs and outputs are those of
the app components.

The meeting page, the follow view, the autosave, the finalize dialog, the approval dialog, the
to-do rows and the PDF viewer stay in the app.

App parts: the views know no route, no permission and no server.

- The TOP sheet asks for the alt texts, uploads images and PDFs, reads the page count of a PDF
  and reads the known names through the `PROTOCOL_API` port (`imageAlts`, `uploadImage`,
  `uploadDocument`, `documentInfo`, `knownNames`). The app shows the alt dialog and the upload
  errors in its port.
- The TOP sheet takes the vote cards of the text (`voteInfo`) and the keeper line of a closed
  meeting (`keepers`) as inputs, and the linked rows below the title as a template
  (`linkedList`). It emits `documentOpen`, and the app opens its PDF viewer.
- The protocol bar takes `hasSession` (the meeting page holds the session) and
  `approvalSaving` as inputs. It emits `sendDraft`, `reopen`, `approve` (the meeting id, or
  null to remove the mark), `publish` (true to publish, false to hold back), `approvalRequest`
  (the app opens its approval dialog) and `pdfOpen` (the file and the click), and the app runs
  them.

Texts: the views read their texts through `UI_KIT_INTL` (`meetings.*`, `participant.*`,
`markdown.*`), so an app can map them to its own catalogue.

Behaviour: every rule of the app components stays, and:

- The format bar has the blackout tool (000690) and the time-note tool (000873); the tools are
  connected button groups (001354).
- An embedded PDF shows as a file badge (000863); a marked segment shows as marked (000689) and
  a black bar has one width and the text colour (000688).
- A known name gets its blackout as the person types (000969).
- The head action is a segment of the button group of the meeting head (001354).

Reason: The meeting page then needs only data, and another app gets the same protocol editor.

Test: The specs of the app components run against the views; unit tests and a jest-axe test of
each view with the fixtures of `/testing`.
