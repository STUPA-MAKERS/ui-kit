---
id: "002212"
title: A reference to a spec of another repository names the repository
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - scripts/check_specs.py
scope:
  - specs
---

# A reference to a spec of another repository names the repository

A reference to a spec in a different repository must put the repository name and a colon before
the rule ID, for example `ui-kit:NF/usability/layout/000192` and `§ui-kit:NF/usability/layout/000192`
in code. A reference without a repository name must point to a spec in the same repository.

Reason: After the move, the old references of the app point to the kit and must still resolve.

Test: `scripts/check_specs.py`: each reference with a repository name resolves in that repository at its default branch.
