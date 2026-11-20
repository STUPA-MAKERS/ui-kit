---
id: "000598"
title: Very high contrast highlights the fields black on yellow
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Very high contrast highlights the fields black on yellow

While "Hoher Kontrast" is on (000605), every input field (text, text area, select, date,
time, amount and search field) must have a yellow fill, black text, a black label, a black
placeholder and black icons. A Markdown editor, a chat composer and the check box "Ich bin kein
Roboter" (ALTCHA) are input fields too. In the protocol, the whole rounded pane of the TOP is
the field, without inner boxes: one yellow area with no edge around it and no ring around
the text while the person writes, because the caret shows the focus. Every button with a label and every icon button must have a
yellow fill and black content. This includes the floating action button (FAB), the buttons of the
meeting dock, a tool of the editor and the button in a file drop area. A destructive button
must be dark red on yellow. A toast and the toast bar must be black on yellow. A tag (for
example "NÖ") is a black plate with yellow text. A progress bar is a yellow plate with black
parts. The focused element must have a double ring: 3 px black next to it and 3 px yellow
outside the black. The error edge must stay visible on the yellow.

The rules 000615 to 000620 control a choice, the navigation, a menu, a row, a switch, a
checkbox and a radio button.

Reason: A person with low vision or with a cognitive impairment must find the fields of a
form at a glance.

Test: `frontend/vendor/ui-kit/src/styles/display-settings.spec.ts`.
