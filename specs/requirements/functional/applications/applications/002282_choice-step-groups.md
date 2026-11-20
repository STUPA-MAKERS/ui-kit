---
id: "002282"
title: A choice step shows its options by group with the group text
kind: functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - screens
---

# A choice step shows its options by group with the group text

A choice step of a wizard must show each group of its input that holds at least one option as
one block. The block must show the name of the group as a heading, then the text of the group,
then the options of the group. The text must always be visible. A group without an option must
not be shown.

Reason: The text helps the person choose, so it must be readable before the choice.

Test: The tests of the wizard screen check the heading, the text and the options of each group,
and that an empty group is not shown.
