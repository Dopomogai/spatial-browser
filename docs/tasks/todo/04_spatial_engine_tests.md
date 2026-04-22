# Implementation Plan: Spatial Engine Testing Architecture

## Objective
Establish a defensive testing perimeter around the React Flow spatial engine. We must guarantee that zoom matrices, coordinate math, rendering cululling, and state history (undo/redo) never silently regress.

## Testing Paradigm

Given the DOM-first React Flow architecture inside an Electron shell, we will split testing into two distinct layers: **Zero-Overhead Unit Tests** for the Zustand math, and **Headless E2E Tests** for the Chromium IPC and render culling.

### Layer 1: Unit Tests (Math & State History)
**Target:** `src/renderer/src/store/useCanvasStore.test.ts`
**Framework:** Vitest + React Testing Library (Headless Node environment)
**Coverage Goals:**
1. **History Engine (Undo/Redo):**
   - *Test:* Trigger `addNode()`. Assert `past.length === 1`. 
   - *Test:* Trigger `undo()`. Assert node is removed, and `future.length === 1`.
   - *Test:* Trigger `redo()`. Assert node returns, `past.length === 1`, `future.length === 0`.
2. **Spawn Math:**
   - *Test:* Call `duplicateNode(id)`. Assert new node coordinates are exactly `[sourceX + 50, sourceY + 50]`.
   - *Test:* Call `addNode()` without coordinates. Assert output coordinates mathematically match the exact center of the mocked `lastViewport` state.
3. **Culling Orchestrator:**
   - *Test:* Mock a viewport bounding box `x: 0, y: 0, w: 1000, h: 1000`. Mock 3 nodes (one inside, one on edge, one at `x: 5000`). 
   - *Test:* Call `calculateCulling()`. Assert `activeNodeIds` strictly contains only the first two nodes.

### Layer 2: E2E React Flow DOM Tests (Integration)
**Target:** `src/renderer/src/e2e/canvas.spec.ts`
**Framework:** Playwright (Electron Environment)
**Coverage Goals:**
1. **The Culling Swap (Hot/Warm):**
   - *Action:* Spawn a Webview Node. Assert `<webview>` tag exists in DOM.
   - *Action:* Simulate mouse-wheel scroll to zoom out beyond `0.6` matrix.
   - *Assert:* Wait for IPC unmount. Assert `<webview>` is destroyed and `<img className="cached-screenshot">` exists in its place.
   - *Action:* Zoom back in. Assert webview remounts with identical `src`.
2. **Fullscreen Matrix Escape:**
   - *Action:* Click the fullscreen button on a node.
   - *Assert:* The node is removed from the `.react-flow__nodes` wrapper and exists directly under `document.body` (React Portal check), filling 100vw/100vh regardless of flow zoom.

### Execution Plan (Next Steps)
1. Install Vitest if missing, configure `vite.config.ts` for testing.
2. Build the `useCanvasStore.test.ts` suite to lock the state math.
3. Configure Playwright for Electron to test the React Flow panning/zooming mechanics.
