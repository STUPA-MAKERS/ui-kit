---
id: "002261"
title: The ports have fixed types
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - shell/src/framework/framework.ts
scope:
  - shell
---

# The ports have fixed types

`FrameworkPorts` (002225) must have this type:

```ts
interface FrameworkPorts {
  readonly session: { readonly frame: Signal<'rail' | 'public' | 'pending'>; readonly person: Signal<PersonRef | null>; logout(): void };
  readonly search?: (q: string) => Observable<readonly SearchHit[]>;    // 2 characters and more (STUPA-Workflow:000329)
  readonly avatar?: (person: PersonRef) => string | null;
  readonly navMarks?: Signal<Record<string, 'new' | 'warn' | null>>;    // never a count
  readonly report?: (r: { kind: 'barrier' | 'problem'; text: string; page: string }) => Promise<void>;
  readonly upload?: (file: File) => Promise<{ readonly url: string; readonly name: string }>;
  readonly live?: Signal<'online' | 'reconnecting' | 'offline'>;        // 000678
  readonly display?: { load(): Promise<DisplayPrefs | null>; save(p: DisplayPrefs): Promise<void> };
}
interface SearchHit { readonly kind: string; readonly title: string; readonly sub?: string; readonly icon: IconName; readonly link: RouteLink }
```

A port that the app leaves out must hide the part that needs it.

Reason: Fixed port types keep the shell free of app code.

Test: A unit test of the shell with the fake ports of `/testing`.
