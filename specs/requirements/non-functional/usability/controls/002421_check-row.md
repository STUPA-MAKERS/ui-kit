---
id: "002421"
title: A check box in a row group is a row with an inset
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - src/styles/rowgroup.scss
scope:
  - src/lib
---

# A check box in a row group is a row with an inset

A check box (`app-checkbox`) that is a direct child of a row group (`.rowgroup`,
`app-field-group`) must be one row of the group. The row must be at least 48 px high. The
box must start 16 px from the left edge of the row, and the text must end 16 px before the
right edge. The box and its state layer must stay inside the row. A page must not set the
inset or the height of such a row in its own stylesheet.

Reason: The box of the kit check box sits on the start edge of its host. Without the inset
of the row, the box touches the edge of the row and its state layer reaches past the row. In
"Sehr hoher Kontrast" the edge of the row then cuts through the box.

Test: A screenshot shows a row group of check boxes in the light look, the dark look and
"Sehr hoher Kontrast".
