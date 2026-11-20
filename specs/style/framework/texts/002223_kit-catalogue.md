---
id: "002223"
title: The texts of the kit have keys that an admin can override
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
  - shell
---

# The texts of the kit have keys that an admin can override

Each control text of the kit (002208) must have a key in the catalogue of the kit, `kit.*`, with
a DE and an EN text. The kit must export the catalogue, so that an app can list the keys in its
admin page for UI texts and give the overrides to `provideFramework()`.

Reason: An admin of an app changes a kit word in the same place as the words of the app.

Test: The text-language test of the kit, and a unit test that every key has DE and EN.
