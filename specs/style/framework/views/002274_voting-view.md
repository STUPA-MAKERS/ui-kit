---
id: "002274"
title: The voting view takes a VoteCard and a Ballot
kind: style
status: draft
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# The voting view takes a VoteCard and a Ballot

`/views/voting` must export the view and these view models:

```ts
interface VoteCard { readonly id: string; readonly question: string; readonly rule: string;
  readonly state: 'draft' | 'open' | 'closed' | 'cancelled'; readonly result?: { readonly label: string; readonly kind: StatusKind;
  readonly counts: readonly { label: string; value: number }[] }; readonly actions: readonly Action[] }
interface Ballot { readonly options: readonly { value: string; label: string }[]; readonly multi?: boolean;
  readonly max?: number; readonly cast?: boolean; readonly weight?: number }
```

Outputs: `cast: readonly string[]`, `action: { key }`.

Behaviour:

- The card states the result once (001006) and has one main action and a ⋮ menu (001007).
- A chosen option is a filled control; in very high contrast it is yellow (000615).
- The live changes are announced (000518).

Reason: Every vote and poll then looks the same.

Test: Unit tests and a jest-axe test of the view with the fixtures of `/testing`.
