---
id: "000492"
title: The template lint has the accessibility rules
kind: non-functional
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - eslint-a11y.cjs
  - eslint.config.js
scope:
  - eslint-a11y.cjs
---

# The template lint has the accessibility rules

The kit must give the template rules of `@angular-eslint/template/accessibility` as the preset
`eslint-a11y.cjs`, each with the level `error`. The ESLint configuration of the kit and of each
app must use this preset for its templates.

Reason: The lint finds a missing label or a click on a `div` before review, and one preset keeps
the rules the same in every app.

Test: `npm run lint` in the kit and in each app.
