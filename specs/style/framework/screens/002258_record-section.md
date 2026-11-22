---
id: "002258"
title: The record section has a fixed interface
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
implementation:
  - screens/src/record-section/record-section.component.ts
scope:
  - shell
  - src/lib
---

# The record section has a fixed interface

`app-record-section` is one headed row group of records with its own load state, for a page
with more than one list or a list beside other blocks (the three lists of Gruppen-Zuordnung, the
list of Backups) and for a list inside an editor (the Versionsverlauf of the form and flow
editors). It must have this interface:

```ts
heading: string
level?: 2 | 3                        // default 2
rows: LoadState<readonly ListRow[]>  // empty and error come with the rows
actions?: readonly Action[]          // buttons at the end of the heading row
listLabel?: string | null            // the name of the list for screen readers; default the heading
variant?: 'rows' | 'records'         // records: the denser row group of record tables
ordered?: boolean                    // the rows have an order (versions): the list is an ol
keepOnError?: boolean                // default true: a load error keeps the rows shown before
skeleton?: number                    // grey rows on the first load, default 3
```

Slots: `screenRecord` (optional, the content of a record as one whole list item, as in the
records screen, 002257; context: the row) and `screenListFoot` (optional, a block under the rows).

Outputs: `action: { key }`, `rowAction: { id, key }` (an item of the row menu of a default row).

Behaviour:

- The section is a kit section (`app-section`) with the heading; the actions are small tonal
  buttons at the end of the heading row, and the heading is the hidden end of their accessible
  name ("Zuordnung anlegen: Globale Rollen"). An action with a route navigates.
- The rows are one row group, a list named by `listLabel`, else by the heading; a row without the
  slot is a list item with the title, the status text of the row beside it, the meta parts joined
  by " · " on wrapping lines, the link of the row, and the actions of the row as a row menu (a
  danger action in red, a disabled one with its reason). So a page whose records need nothing more
  (Backups) writes no row markup and no row styles.
- The first load shows `skeleton` grey rows. An empty state comes from the rows and shows the
  small face, not the centred one of a whole page, because the section shares the page with other
  blocks. A load error without rows shows the small face with the error text (002405), and a
  toast with "Erneut versuchen".

Reason: Every list of a section page and of an editor then has the same heading, rows and
states, and the app writes only the content of a record.

Test: Unit tests and a jest-axe test of `app-record-section`.
