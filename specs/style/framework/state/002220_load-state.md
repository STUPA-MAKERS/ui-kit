---
id: "002220"
title: A load state is one type for every view
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation:
  - src/lib/screen/load-state.ts
scope:
  - src/lib
---

# A load state is one type for every view

Each screen and each view must take its state as `LoadState<T>`: `loading`, `ready` with the
data, `empty`, or `error` with a retry action. The kit must show the skeleton for `loading`, the
empty state for `empty`, and the error toast with the retry for `error` (000576), with the face and the error text when no
data shows (002405). The kit must
provide `toLoadState()`, which turns an Angular resource or an observable into a `LoadState`
signal.

Reason: One state type gives every view the same skeleton, empty state and error behaviour.

Test: Unit tests of `toLoadState()` and of each screen with each state.
