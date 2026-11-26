---
id: "003120"
title: A link with only an icon is drawn as an icon button
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-26
implementation: null
scope:
  - src/lib/button
---

# A link with only an icon is drawn as an icon button

A link in the look of a button (`a[appButton]`) that shows only an icon must have the shape
of an icon button (`[iconOnly]="true"`): a square pill without padding, the icon in its
centre, and the icon size of an icon button. In a button group it must have the same width
as the icon buttons beside it. The link must have its text as accessible name.

Reason: The link "Bestellung anlegen" in the section "Verknüpft" of an Antrag had the
padding of a text button. Its icon sat off the centre, and the link was wider than the
buttons "Verknüpfen" and "To-Do anlegen" beside it.

Test: The spec of `ButtonLinkComponent` expects the class `btn--icon` on the pill of a link
with `iconOnly` and not on a link with text. Screenshot of the section "Verknüpft" of an
Antrag with money: the three icons have their centre in the centre of their buttons, and the
three buttons have one width.
