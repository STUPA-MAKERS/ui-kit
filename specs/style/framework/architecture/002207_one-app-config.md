---
id: "002207"
title: An app configures the kit in one provider
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - shell
---

# An app configures the kit in one provider

An app must give its app-wide settings to the kit in one call of `provideFramework()`: the
navigation items, the account menu, the help menu, the footer links, the branding (name, logos,
accent colour), the UI languages and the text overrides. The kit must own the light and dark
themes and the accessibility modes. An app must not set a colour other than the accent colour.

Reason: One entry point makes a new app a page of configuration, and keeps the themes in the kit.

Test: A unit test of `provideFramework()` and the no-style check of 002205.
