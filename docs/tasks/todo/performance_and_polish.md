# TASK: Performance Optimization and Core Polish (React Flow + Electron)

**Phase:** V1.5 Stabilization

## Current Regressions & Issues

1. **Top Bar & Navigation UI:**
   - Tabs are always visible; the top bar toggle (Minimal vs. Full) is missing.
   - Settings window does not open.
   - Undo/Redo buttons to revert spatial actions are missing from the top bar (and hotkeys Cmd+Z don't trigger).

2. **Spatial Mechanics:**
   - Saved camera position fails to restore exact viewport scale/coords.
   - Newly spawned or duplicated tabs stack exactly on top of each other (missing the geometric +X/Y scatter offet).
   - "Fullscreen mode" inside webviews triggers a hyper-level zoom-out instead of just filling viewport bounds.

3. **Performance (Urgent):**
   - General slowness and lag when dealing with multiple webviews/nodes. React Flow re-renders need severe throttling.

## Implementation Plan

### Part 1: Top Bar & Settings
- Re-add the `isMinimalTopBar` toggle.
- Hook up the Undo/Redo calls to the `useCanvasStore.ts` history engine.
- Fix null/undefined ID errors blocking the Settings widget from spawning.

### Part 2: Spatial Fixes
- Fix `<webview>.setZoomLevel` or React Flow transform resets during full-screen transitions.
- Re-implement the `x+50, y+50` duplication scatter logic in the `useCanvasStore.ts` spawn methods.
- Debug IndexedDB/localStorage payload for `viewport` to ensure camera state tracks correctly.

### Part 3: Performance Hardening
- Audit `BrowserWidgetNode.tsx` and text nodes for missing `React.memo()`. 
- Ensure drag handlers utilize internal state (`useState`) during drag, only committing to Zustand `onNodeDragStop`. 
- Silence excessive React Flow updates.
