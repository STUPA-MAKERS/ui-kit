---
id: "002260"
title: provideFramework takes one FrameworkConfig
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - shell/src/framework/framework.ts
scope:
  - shell
---

# provideFramework takes one FrameworkConfig

`provideFramework()` must take this config and replace `provideUiKit()`:

```ts
interface FrameworkConfig {
  readonly brand: { readonly name: string; readonly home: string; readonly mark: string | { light: string; dark: string };
                     readonly accent?: string; readonly favicon?: string };
  readonly nav: Signal<readonly ShellNavItem[]>;           // the existing ShellNavItem
  readonly account?: { readonly items: Signal<readonly Action[]> };
  readonly help?: { readonly items: Signal<readonly Action[]>; readonly wikiUrl?: string };
  readonly footer?: { readonly links: readonly { label: string; link: RouteLink }[] };
  readonly a11yStatement: RouteLink;                       // STUPA-Workflow:000496
  readonly languages: readonly ShellLanguage[];
  readonly texts?: Signal<Record<string, string>>;         // overrides of kit.* (002223)
  readonly theme: { readonly storageKey: string; readonly manifest?: Record<'light' | 'dark', string> };
  readonly ports: FrameworkPorts;                          // 002261
}
```

An app must call it once in `app.config.ts`. A field that the app leaves out must take the kit
default or hide the part.

Reason: One typed config makes a new app a page of configuration.

Test: A unit test of `provideFramework()` with the minimal and the full config.
