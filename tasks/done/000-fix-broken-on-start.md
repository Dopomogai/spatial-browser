---
id: 000
title: Fix broken-on-start regression
type: bug
scope: renderer-startup
status: done
fan-out: 1
needs-architect: false
plan-approved: true
result-approved: true
trivial: false
depends-on: []
created: 2026-05-09T08:28:26Z
created-by: human
updated: 2026-05-09T10:37:21Z
workflow: fix-bug
---

# Task 000: Fix broken-on-start regression

## Objective

Restore the renderer's ability to launch without runtime exceptions, so subsequent feature work (Phase A Isha demo: RemoteAgentWidget + GoogleSheetWidget) can resume on a working baseline.

## User story

As a developer working on CanvasOS, I want `npm run dev` to start the spatial-browser cleanly so that I can iterate on canvas widgets without first patching boot-path bugs.

## Acceptance criteria

- AC1: `npm run dev` launches the Electron window without throwing in the renderer process.
- AC2: The canvas renders (xyflow grid visible, viewport interactive) within 5 seconds of window-ready.
- AC3: No `TypeError`, `ReferenceError`, or `not a function` errors in the renderer console during the first 10 seconds after launch.
- AC4: Existing unit tests (`npm run test` for `useCanvasStore.test.ts`) still pass — no new failures introduced.
- AC5: No source files added or modified outside the `files-to-touch` list the Planner produces.

## Context (for the Librarian's relevance scoring)

The file headers added during budai onboarding (commit `de76134`) flagged several likely culprits, in `@gotchas` of these files:

- `src/renderer/src/App.tsx` — calls `useCanvasStore.getState().flushSyncQueue()` on a 1500ms interval, but the store method is named `flushSpatialEvents`. This raises `TypeError: flushSyncQueue is not a function` every tick. Probable primary cause.
- `src/renderer/src/App.tsx` — duplicate `Space` keydown handler at lines 31 and 46 (one is dead).
- `src/renderer/src/components/canvas/SpatialCanvas.tsx` — calls `setTopTabBarVisible` via `(state: any)` cast; existence on the store is unverified. Possible secondary cause.
- `src/renderer/src/components/canvas/SpatialCanvas.tsx` — runs its own 1500ms `flushSpatialEvents` interval; combined with App.tsx's, the canvas may double-flush even after rename.
- `src/renderer/src/store/useCanvasStore.ts` — must be checked for `setTopTabBarVisible` and for the `flushSpatialEvents` (vs `flushSyncQueue`) name parity.
- `src/main/index.ts` — `BrowserWidgetNode` sends ipc `'toggle-maximize'` with no `ipcMain` handler. Likely NOT a startup blocker (only fires on user click), but spin out as a follow-up task if the Planner agrees.

The Planner is free to confirm, expand, or reject this hypothesis after reading the bundle.

## Plan

### Approach

The startup crash has a single proximate cause: `App.tsx`'s 1500 ms flusher calls `useCanvasStore.getState().flushSyncQueue()`, which does not exist on the store (the method is `flushSpatialEvents`). This raises `TypeError: flushSyncQueue is not a function` every tick, beginning immediately on mount, which is why the app appears broken-on-start. The fix is to delete App.tsx's flusher entirely (SpatialCanvas.tsx already runs the canonical `flushSpatialEvents` interval — see Librarian note #2) and clean up the small co-located dead code (duplicate Space keydown/keyup branches) so AC3 (no console errors in first 10 s) is unambiguously satisfied. Other latent issues surfaced in the bundle (`setTopTabBarVisible`/`isTopTabBarVisible` not declared on the store; `saveProfileAs` missing; `toggle-maximize` IPC gap) are NOT startup blockers — they only fire on user interaction — and are flagged as out-of-scope follow-ups to keep this fix surgical (per AC5).

### Decomposition

Single task — one Implementer.

### File-level changes

#### Files to create

(none)

#### Files to modify

- `src/renderer/src/App.tsx`
  - **Remove the App-level flusher entirely** (the `setInterval(() => useCanvasStore.getState().flushSyncQueue(), 1500)` block at the top of the `useEffect` body, plus its `clearInterval(flusher)` in the cleanup return). Rationale: SpatialCanvas.tsx already runs an equivalent `flushSpatialEvents` interval and is the canonical owner per the canvas-domain convention; removing App.tsx's interval is preferable to renaming it (avoids the double-flush problem the bundle calls out as a secondary defect, and keeps the diff focused on AC1/AC3).
  - **Remove the duplicate `Space` branches** in the `handleKeyDown` body (the second `if (e.code === 'Space') setSpacebarHeld(true)` after the Cmd+K branch) and in `handleKeyUp` (the second `if (e.code === 'Space') setSpacebarHeld(false)`). Keep one occurrence each. Rationale: dead code, listed in @gotchas; cleaning up here costs nothing and tightens AC3 ("no errors/warnings" hygiene).
  - **Do NOT touch** `setTopTabBarVisible(...)` or `useCanvasStore.getState().saveProfileAs(...)` calls. Both are user-interaction-gated, not startup blockers, and modifying them widens scope past AC5. They are tracked as follow-ups (see Risks).
  - **Do NOT touch** the `(state: any)` casts on `isTopTabBarVisible` / `setTopTabBarVisible` selectors. Re-typing the store is its own task.
  - **Header @gotchas update**: after the edit, remove the two stale items now resolved ("flusher setInterval(1500ms) here" and "calls flushSyncQueue() but store method is named flushSpatialEvents"). Leave the `setTopTabBarVisible` cast and the duplicate-Space note replaced/trimmed to reflect the new state. The `flushSyncQueue`-mismatch line in `useCanvasStore.ts`'s @gotchas should also be removed (see below).

- `src/renderer/src/store/useCanvasStore.ts`
  - **Header @gotchas update only.** Remove the trailing `flushSyncQueue referenced in App.tsx but the method is named flushSpatialEvents — mismatch is the broken-on-start culprit` clause from the `@gotchas` line. Keep the other two clauses (singleton `saveTimeout`, hardcoded UUID). No code changes in this file.
  - Rationale: keeping headers honest is part of the file-headers convention; leaving the stale gotcha would mislead the next agent that reads it.

- `src/renderer/src/components/canvas/SpatialCanvas.tsx`
  - **Header @gotchas update only.** Remove the leading `Duplicate flushSpatialEvents setInterval(1500ms) — App.tsx also has one;` clause. Keep the rest (the `setTopTabBarVisible` cast note, the canvases-widget hardcode note). No code changes in this file — its `flushSpatialEvents` interval is the surviving canonical one.

### Risks and escalations

- **Risk**: The Implementer renames `flushSyncQueue` → `flushSpatialEvents` in App.tsx instead of deleting the interval, which leaves the double-flush in place. Mitigation: the plan is explicit — delete the block and its cleanup line; do not rename. SpatialCanvas.tsx is the canonical owner.
- **Risk**: The Implementer is tempted to also fix `setTopTabBarVisible` / `saveProfileAs` / `toggle-maximize` while in the file. Mitigation: AC5 forbids it; flag the three out-of-scope items as follow-up tasks (see below) but do not touch them in this diff.
- **Risk**: AC2 ("canvas renders within 5 s") might fail for an unrelated reason (e.g., missing `.env`, Supabase init throw) that this plan does not address. Mitigation: if the boot still throws after the flusher fix, the Implementer escalates to Planner with the new error rather than expanding the diff. The bundle's Librarian note #1 frames the `flushSyncQueue` TypeError as the only confirmed startup throw; everything else in the bundle is gated on user interaction or post-boot conditions.
- **Risk**: `useCanvasStore.test.ts` (AC4) currently passes only because nothing it tests touches the flusher path; deleting App.tsx's interval doesn't change store behaviour, so the test should remain green. If it fails, the Implementer escalates rather than editing the test.
- **Follow-ups (out-of-scope, do NOT fix here)** — file as separate tasks after this lands:
  - `setTopTabBarVisible` and `isTopTabBarVisible` are referenced via `(state: any)` cast but neither is declared in the `CanvasStore` interface (Librarian #3). Add to store with proper types.
  - `saveProfileAs(name)` is called from App.tsx's "Save New Profile" modal but is not on the store interface (Librarian #7). Add to store.
  - `toggle-maximize` IPC has no `ipcMain` handler (Librarian #5, task body §Context bullet 6). Add handler in `src/main/index.ts`.
- (none requiring human escalation)

### Acceptance criteria mapping

- AC1 (renderer launches without throwing) → covered by removing the App.tsx flusher that calls non-existent `flushSyncQueue` (the every-1500 ms `TypeError`).
- AC2 (canvas renders within 5 s of window-ready) → covered by the same change: with the recurring TypeError gone, the React tree commits without interruption and SpatialCanvas mounts xyflow on its first render. No other change is needed.
- AC3 (no `TypeError` / `ReferenceError` / `not a function` in first 10 s) → covered by removing the App.tsx flusher (kills the recurring TypeError) and removing the duplicate `Space` branches in `handleKeyDown`/`handleKeyUp` (eliminates dead-code noise during smoke test).
- AC4 (existing `useCanvasStore.test.ts` still passes) → covered by NOT touching `useCanvasStore.ts`'s code (only the `@gotchas` header text changes; tests do not assert on header comments).
- AC5 (no source files modified outside the files-to-touch list) → the files-to-touch list for this task is exactly: `src/renderer/src/App.tsx`, `src/renderer/src/store/useCanvasStore.ts` (header only), `src/renderer/src/components/canvas/SpatialCanvas.tsx` (header only). Implementer must not touch any other source file.

### Recommended fan-out

1 — mechanical fix with a single concrete change site; fan-out adds cost without diversifying outcomes. The plan removes choice from the Implementer (delete, do not rename), so two parallel attempts would converge on the same diff.

### Confidence level

high — the bundle's Librarian explicitly confirmed the primary bug (`flushSyncQueue` vs `flushSpatialEvents`), the fix is a delete-three-lines change, the canonical replacement already exists in SpatialCanvas.tsx, and all secondary issues in the bundle were verified to be user-interaction-gated and therefore safely out-of-scope for AC1–AC3.

## Verdict

<!-- Filled in by the Librarian sweep at archival -->
