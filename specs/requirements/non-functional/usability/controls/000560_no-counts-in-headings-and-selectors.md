---
id: "000560"
title: Headings and selectors show no counts
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Headings and selectors show no counts

A heading must not show a count. This applies to a page title, a section title, a list group
header, a column header and the text beside them. A selector must not show a count. This
applies to a segment, a tab, a chip and an option of a picker. A heading or a selector shows
only its name.

Reason: A count beside a name makes the name harder to read, and it changes while the user
works. The list itself shows how many items it holds.

Test: The segmented control and the tabs of the ui-kit have no `count` input. The specs of the
two components check that a segment and a tab show only the label.
