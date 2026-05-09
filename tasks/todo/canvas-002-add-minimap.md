---
id: canvas-002
title: Render xyflow MiniMap inside ReactFlow in SpatialCanvas
type: bug
scope: renderer-canvas
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

# Task canvas-002: Add xyflow minimap

## Objective

`<MiniMap>` is imported in `src/renderer/src/components/canvas/SpatialCanvas.tsx`
but never rendered as a child of `<ReactFlow>`, so the minimap is absent at
runtime. Render it (with sensible defaults) so users can see a viewport
overview of the canvas.

## User story

As a user of CanvasOS, I want to see a minimap of my canvas so that I can
navigate large workspaces and find off-viewport widgets.

## Acceptance criteria

- AC1: `<MiniMap />` is rendered as a child of `<ReactFlow>` in
  `SpatialCanvas.tsx` with sensible default props (e.g. position
  `bottom-right`, pannable, zoomable).
- AC2: The unused `MiniMap` import is no longer dead code (lint clean).
- AC3: At runtime, the minimap is visible at the chosen position and
  reflects the current set of nodes and viewport.
- AC4: Existing tests still pass; no regression in `useCanvasStore.test.ts`.
- AC5: Only `SpatialCanvas.tsx` is modified (no scope creep into other files).
