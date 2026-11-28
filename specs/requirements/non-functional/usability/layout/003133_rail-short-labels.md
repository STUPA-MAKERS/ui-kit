---
id: "003133"
title: A rail label never breaks inside a word, and a long one has a short rail name
kind: non-functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-28
tests:
  - "shell/src/nav-rail/nav-rail.component.spec.ts:NavRailComponent"
implementation:
  - shell/src/shell.types.ts
  - shell/src/nav-rail/nav-rail.component.html
  - src/styles/_nav-items.scss
scope:
  - shell
  - src/styles
---

# A rail label never breaks inside a word, and a long one has a short rail name

A label of the navigation rail must not break inside a word with a hyphen. A label may break
between two words. An entry of the navigation may give a short rail label (`railLabel`). The
rail must show the short label when the entry has one, and must keep the full label as the
tooltip of the entry. The phone bar and the sheet "More" must show the full label. The app must
give a short rail label to each entry whose full label is wider than the label space of the
rail (001441) in one line. A single word that is still too wide, for example under a user text
spacing (WCAG 1.4.12), must break without a hyphen and must not be cut. This replaces the
sentence on long labels in 001441.

Reason: A word that breaks with a hyphen ("Rechnun-gen") is hard to read and looks broken. The
rail stays 72 px wide (001441), so a long German word needs a shorter name there (decided
2026-11-28).

Test: A unit test gives an entry the rail label `Events` and reads `Events` in the rail with
the full label as its title.
