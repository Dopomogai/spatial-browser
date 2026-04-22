# Implementation Plan: Render Engine Culling (Performance)

## Objective
Implement the 3-Tier Render Culling strategy (Hot, Warm, Cold) using Intersection Observers and image-substitution to allow infinite nodes without crashing Chromium.

## Files to Update

### 1. `src/renderer/src/store/useCanvasStore.ts`
- **Action:** Add Render Engine logic.
- **Code Plan:**
  - Create `viewportBoundingBox` state.
  - Create `activeNodeIds: string[]` state.
  - Create an exported orchestrator function `calculateCulling(viewport, nodes)` that runs on a debounced `onMove` loop.

### 2. `src/renderer/src/components/shapes/BrowserWidget/BrowserWidgetNode.tsx`
- **Action:** Implement HOC Culling & State Isolation.
- **Code Plan:**
  - Wrap the default export in `React.memo(BrowserWidgetNode, customEqualityCheck)`.
  - Isolate the `onDrag` updating. Convert `position` binding to a local `useState` while dragging is active, blocking the Zushand `setNode` dispatch until `onDragStop`.
  - Implement Tier 2 (Warm): Check `activeNodeIds.includes(nodeId)`. If false, trigger Electron IPC to `<webview>` to capture `NativeImage`. Unmount `<webview>`, mount `<img src={screenshotData}>`.
  - Ensure URL routing persistence. When unmounting, save `webview.getURL()` to local node state. When re-mounting to "Hot", use that saved URL.

### 3. `src/renderer/src/components/shapes/TextNode/TextNodeComponent.tsx`
- **Action:** Memoize standard UI nodes.
- **Code Plan:**
  - Wrap in `React.memo()`. UI nodes don't need screenshots, but they do need to stop re-rendering every time the user pans the camera.
