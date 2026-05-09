---
id: canvas-001
title: Fix top tab bar visibility — declare setTopTabBarVisible on CanvasStore
type: bug
scope: renderer-store
status: open
fan-out: 1
needs-architect: false
plan-approved: false
result-approved: false
trivial: false
depends-on: []
created: 2026-05-09T11:45:00Z
created-by: judge-task-000
updated: 2026-05-09T11:45:00Z
workflow: fix-bug
---

# Task canvas-001: Fix top tab bar visibility

## Objective

Declare `isTopTabBarVisible` and `setTopTabBarVisible` on the `CanvasStore`
interface (and implement them in the Zustand store) so that the top tab bar
actually appears and toggles correctly. Currently both are referenced via
`(state: any)` casts in `App.tsx` and `SpatialCanvas.tsx`, but neither is on
the store interface, so visibility never flips and the top tab bar never
renders.

## User story

As a developer working on CanvasOS, I want the top tab bar to render and
respond to fullscreen-toggle so that I can use the browser-tab UI on the
canvas.

## Acceptance criteria

- AC1: `isTopTabBarVisible: boolean` and `setTopTabBarVisible(v: boolean): void`
  are declared on the `CanvasStore` interface in
  `src/renderer/src/store/useCanvasStore.ts`.
- AC2: Both are implemented in the store's create function with a sensible
  default for `isTopTabBarVisible` (recommend `true`).
- AC3: All `(state: any)` casts on these two members in `App.tsx` and
  `SpatialCanvas.tsx` are removed in favor of the typed selectors.
- AC4: Existing `useCanvasStore.test.ts` tests still pass; new tests cover
  the default and the setter.
- AC5: At runtime, the top tab bar renders by default and toggles when
  `setTopTabBarVisible` is called (smoke test).
