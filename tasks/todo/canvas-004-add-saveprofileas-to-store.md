---
id: canvas-004
title: Add saveProfileAs to CanvasStore — currently called from App.tsx but missing from interface
type: bug
scope: renderer-store
status: open
fan-out: 1
needs-architect: false
plan-approved: false
result-approved: false
trivial: false
depends-on: []
created: 2026-05-09T10:37:21Z
created-by: human-task-000-followup
updated: 2026-05-09T10:37:21Z
workflow: fix-bug
---

# Task canvas-004: Add saveProfileAs to CanvasStore

## Objective

Add `saveProfileAs(name: string)` to the `CanvasStore` interface and implement it in the Zustand store, so that App.tsx's "Save New Profile" modal flow doesn't crash with `TypeError: saveProfileAs is not a function` when a user tries to save a workspace profile.

Currently `useCanvasStore.getState().saveProfileAs(...)` is called from App.tsx (the new-profile modal handler) but the method is not declared on the `CanvasStore` interface and not implemented. This is a latent crash gated behind user interaction (only fires when the user opens the New Profile modal and clicks Save), so it didn't block startup — but it will break the workspace-profile feature the moment a user tries to use it.

## User story

As a CanvasOS user, when I open the "Save New Profile" modal and confirm, I want my current workspace state persisted under the new profile name without the renderer crashing.

## Acceptance criteria

- AC1: `saveProfileAs(name: string): Promise<void>` is declared on the `CanvasStore` interface in `src/renderer/src/store/useCanvasStore.ts`.
- AC2: It's implemented in the store's `create` function. Behavior: snapshots the current canvas state (nodes, edges, viewport, panels) into a new `WorkspaceProfile` row keyed by `name`, persists to Supabase + IndexedDB, and switches the active profile pointer to the new one. Match the patterns of the existing profile-management actions in the store.
- AC3: The "Save New Profile" modal flow in `App.tsx` works end-to-end without throwing — verified via smoke test (open modal, type a name, click Save, see the new profile in the profile selector).
- AC4: Existing `useCanvasStore.test.ts` tests still pass; a new test covers the happy-path of `saveProfileAs` (creates a row, switches active pointer).
- AC5: No source files modified outside the Planner's files-to-touch list.

## Context

This was surfaced during task 000 (broken-on-start fix) by the Librarian, then deferred to follow-up because it's user-interaction-gated rather than a startup blocker. See `tasks/done/000-fix-broken-on-start.bundle.21k.md` Librarian-notes section for the original observation.

Sibling follow-ups from the same task: canvas-001 (topbar visibility), canvas-002 (minimap), canvas-003 (toggle-maximize IPC handler). All four follow the same pattern: things broken or missing that the broken-on-start TypeError was masking.

## Plan

<!-- Filled in by the Planner -->

## Verdict

<!-- Filled in by the Librarian sweep at archival -->
