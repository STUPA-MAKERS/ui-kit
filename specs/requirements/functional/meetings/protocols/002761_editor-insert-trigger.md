---
id: "002761"
title: A typed trigger text asks the consumer of the editor for an insert
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-23
tests:
  - "markdown-editor/src/markdown-editor.insert-trigger.spec.ts:MarkdownEditorInsertTrigger"
implementation:
  - markdown-editor/src/markdown-editor.component.ts
scope:
  - markdown-editor
---

# A typed trigger text asks the consumer of the editor for an insert

The Markdown editor must take the input `insertTrigger` (a text, for example `::`). When a person
types that text at the start of a word, the editor must remove the text and emit `insertRequest`.
The cursor must stay at the place of the text, so `insertDocument` puts the insert there. Inside
a word, in code and without the input, the text must stay plain text.

Reason: An app opens a picker of its own from the text, for example the search of a document
archive (STUPA-Workflow:002527). The editor does not know the picker.

Test: A unit test types the trigger at the start of a word, inside a word, in a code block and
without the input.
