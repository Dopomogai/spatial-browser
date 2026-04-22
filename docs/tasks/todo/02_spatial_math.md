# Implementation Plan: Spatial Mechanics & Persistence

## Objective
Fix the math behind spawning nodes so they don't stack blindly at 0,0, and decouple the camera persistence saving from React Flow's thrashing `onMove` to a debounced safe-state so coordinates survive reloads.

## Files to Update

### 1. `src/renderer/src/store/useCanvasStore.ts`
- **Action:** Fix Spawning Math.
- **Code Plan:**
  - Locate `duplicateNode(id)`. 
  - Find the source node by ID. Instead of copying X/Y exactly, output X = `source.position.x + 50`, Y = `source.position.y + 50`.
  - Locate `addNode()`. If no coordinates are passed natively, calculate the center of the current `viewport` state holding X/Y/Zoom, and translate that to canvas coordinates.

### 2. `src/renderer/src/components/canvas/SpatialCanvas.tsx`
- **Action:** Debounce Camera save.
- **Code Plan:**
  - Locate `onMove` or `onMoveEnd` from the `<ReactFlow>` props.
  - Remove any logic that tries to save the viewport to DB/localStorage during active `onMove`.
  - Implement a `useDebounce` hook (or `setTimeout`) on `onMoveEnd` (e.g., 500ms).
  - Only when debounced, dispatch the `{x, y, zoom}` to the persistence layer (Zustand persist or Supabase `spatial_workspaces` table).

### 3. `src/renderer/src/components/shapes/BrowserWidget/BrowserWidgetNode.tsx`
- **Action:** Fix Fullscreen Zoom blowout.
- **Code Plan:**
  - Determine how fullscreen is currently triggered (likely setting a native bounds via Electron IPC rather than a React state).
  - If it is handled in React by setting CSS width/height to 100vw/vh, the node is still subjected to the `<ReactFlow>` parent zoom matrix.
  - *Fix:* When a node goes fullscreen, we must either `useReactFlow().setViewport({ x:0, y:0, zoom: 1 })` temporarily, OR use a React Portal to unmount the `<webview>` from the Node and mount it directly to `document.body` to escape the transform matrix.
