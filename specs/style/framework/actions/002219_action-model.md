---
id: "002219"
title: An action is data, and the screen places it
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# An action is data, and the screen places it

Every action of a screen, a head, a row, a card or a dialog must be an `Action`: `key`, `label`,
`icon`, `kind` (`main`, `normal` or `danger`), `priority` (`head`, `menu` or `fab`), `disabled`,
an optional `route` or `href`, and an optional `confirm` (title, text and the label of the
confirm button). The kit must place an action from its priority and the width: in the button
group of the head, in the ⋮ menu, as a FAB, or in the phone menu. The kit must ask the confirm
question before it emits the `action` output with the key.

Reason: The app says what an action is and how important it is, and the kit applies the rules for buttons, menus and FABs in one place.

Test: Unit tests of the action placement for phone, narrow and wide.
