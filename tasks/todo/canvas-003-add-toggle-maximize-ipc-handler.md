---
id: canvas-003
title: Add ipcMain handler for toggle-maximize channel
type: bug
scope: main-ipc
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

# Task canvas-003: Add toggle-maximize IPC handler

## Objective

`BrowserWidgetNode` sends an IPC message on the `'toggle-maximize'` channel,
but `src/main/index.ts` has no `ipcMain.on('toggle-maximize', ...)` handler.
The message is silently dropped, so clicking the maximize control does
nothing. Add the handler so the maximize action behaves as intended.

## User story

As a user of CanvasOS, I want clicking the maximize control on a browser
widget to actually toggle maximize state, so that I can focus on a single
widget when I need to.

## Acceptance criteria

- AC1: `ipcMain.on('toggle-maximize', ...)` (or `ipcMain.handle` if
  request/response is appropriate) is registered in `src/main/index.ts` with
  channel typing declared in `src/preload/index.d.ts` per local conventions.
- AC2: The handler toggles the maximize state for the targeted widget
  (canvas-side state via the existing store action, or window-level if
  that's the intended semantic — clarify in plan).
- AC3: At runtime, clicking the maximize control on a `BrowserWidgetNode`
  toggles the widget between maximized and normal state.
- AC4: No regression in existing tests; new test (renderer-side) covers the
  IPC send path if feasible.
- AC5: Files modified: `src/main/index.ts` and `src/preload/index.d.ts`
  only; no scope creep into the renderer's widget code unless strictly
  necessary.
