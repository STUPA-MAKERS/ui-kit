---
id: "002277"
title: The flow editor views take the inspectors, the transition lists and the guard editor
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-23
implementation:
  - views/flow-editor/src/state-inspector-view.component.ts
  - views/flow-editor/src/group-inspector-view.component.ts
  - views/flow-editor/src/transition-inspector-view.component.ts
  - views/flow-editor/src/transition-lists-view.component.ts
  - views/flow-editor/src/guard-editor-view.component.ts
  - views/flow-editor/src/flow-color-view.component.ts
  - src/lib/content-lang/i18n-input.component.ts
  - src/lib/content-lang/content-lang-switch.component.ts
  - src/lib/content-lang/content-lang.ts
scope:
  - views/flow-editor
  - src/lib/content-lang
---

# The flow editor views take the inspectors, the transition lists and the guard editor

`/views/flow-editor` must export copies of these parts of the Ablauf editor of STUPA-Workflow,
with the same behaviour:

| Kit view | Copy of | Shows |
|---|---|---|
| `app-state-inspector-view` | `app-state-inspector` | the fields of a state: key, name, colour, kind, Gremium, the flags, the order of the guards |
| `app-group-inspector-view` | `app-group-inspector` | the name and the colour of a group, and "Auflösen" |
| `app-transition-inspector-view` | `app-transition-inspector` | the fields of a transition: from, to, name, colour, automatic, action, branch |
| `app-transition-lists-view` | `app-transition-lists` | the incoming and the outgoing transitions of a state as rows |
| `app-guard-editor-view` | `app-guard-editor` | the conditions of a transition: groups, operators, values |
| `app-flow-color-view` | `app-flow-color` | the colour row of a state, a group or a transition |

The library entry `@stupa-makers/ui-kit` must also export the multilingual text field
(`app-i18n-input`), the content language switch (`app-content-lang-switch`) and the content
language state (`ContentLangState`, `fallbackChain`, `langFieldLabel`, `setI18n`). The token
`CONTENT_LANGUAGES` gives the languages, the current language and the name of a language; its
default is German and English. The app provides its own languages.

View models: the flow types of STUPA-Workflow (`StateDef`, `TransitionDef`, `FlowGroup`, `Guard`,
`I18nMap`), with the same fields, so the app passes its API objects as they are. The guard helpers
(`flow-guard.util`) move with them. The inputs and outputs are those of the app components.

The canvas, the page, the toolbar, the save, the version list and the transition detail stay in
the app. The transition detail uses the kit guard editor and the kit inspector styles.

App parts: the views know no route, no permission and no server. The app gives the options
(states, kinds, Gremien, roles) as inputs and applies each output to its draft.

Texts: the views read their texts through `UI_KIT_INTL` (`admin.flow.*`, `admin.common.label`),
so an app can map them to its own catalogue.

Behaviour: every rule of the app components stays (000571).

Reason: The Ablauf editor then needs only data, and another app gets the same inspectors and the
same multilingual field.

Test: The specs of the app components run against the views; unit tests and a jest-axe test of
each view with the fixtures of `/testing`.
