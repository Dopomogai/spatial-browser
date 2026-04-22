# Implementation Plan: UI Shell & System Singletons

## Objective
Restore essential OS-level UI controls (Top Bar minimization, Undo/Redo) and fix the crashing Settings widget by decoupling them from localized component state and utilizing a Singleton pattern for system widgets.

## Files to Update

### 1. `src/renderer/src/store/useCanvasStore.ts`
- **Action:** Add UI Shell slice.
- **Code Plan:** 
  - Define `isMinimalHeader: boolean` (default: false or loaded from user prefs).
  - Add `toggleHeaderMode()` action.
  - Add a dedicated history engine: `past: CanvasState[]`, `future: CanvasState[]`.
  - Add `undo()` and `redo()` actions that rollback/forward the `nodes` and `edges` arrays.
  - Modify `addNode` method. If the incoming node `type === 'settingsWidget'`, hardcode the ID to `'system-widget-settings'`.
  - In `addNode`, if `id === 'system-widget-settings'` and it already exists, do NOT add, just `setNodes(nodes => focusNode(nodes, 'system-widget-settings'))`.

### 2. `src/renderer/src/components/TopTabBar.tsx`
- **Action:** Wire to global state.
- **Code Plan:**
  - Consume `isMinimalHeader`, `toggleHeaderMode`, `undo`, `redo`.
  - Re-implement the UI toggle button (V chevron or similar) to switch between the full multi-tab look and the minimal OS header.
  - Ensure Undo/Redo buttons map correctly and appear disabled when `past.length === 0` or `future.length === 0`.
  - Bind hotkeys (Cmd+Z / Cmd+Shift+Z) triggered via `useEffect` event listeners hooked to the store actions.

### 3. `src/renderer/src/components/shapes/SettingsWidget/SettingsWidgetComponent.tsx` (and Util)
- **Action:** Ensure stable ID rendering.
- **Code Plan:**
  - Verify that the component doesn't expect a dynamically generated UUID. 
  - Ensure any internal state checks default cleanly if it's treated as a singleton.
