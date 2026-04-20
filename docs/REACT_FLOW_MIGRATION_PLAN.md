# React Flow Migration Blueprint (V1 -> V1.5)

## Objective
Surgically rip out `tldraw` and replace it with `@xyflow/react` (React Flow). This transitions the Dopomogai Spatial Browser from a "Whiteboard-First" engine to a "DOM-Node-First" engine, permanently resolving click-interception bugs, preventing accidental drawing modes, and aligning our frontend perfectly with the `spatial_widgets` Postgres schema.

---

## Phase 1: Dependency & State Restructuring

### 1. Swap Dependencies
- **Remove**: `tldraw`
- **Add**: `@xyflow/react`

### 2. Overhaul Zustand Store (`useCanvasStore.ts`)
Currently, TLDraw acts as a shadow-state, forcing us to sync `editor.store.listen()` back to Zustand. With React Flow, Zustand becomes the absolute Single Source of Truth (SSoT).
- Define `nodes` and `edges` arrays natively in Zustand.
- Implement React Flow's `onNodesChange` and `onEdgesChange` directly in the store to handle drag-and-drop coordinate math automatically.
- Map our existing `Widget` type onto React Flow's `Node` interface:
  ```typescript
  {
    id: 'widget-1',
    type: 'browserWidget',
    position: { x: 100, y: 200 },
    data: { url: 'https://...', interactionState: 'active', w: 800, h: 600 }
  }
  ```

---

## Phase 2: Component Conversion (Shapes to Nodes)

TLDraw required wrapping all HTML inside complex `ShapeUtil` class extensions. React Flow just uses standard React Components.

### 1. Convert `BrowserWidgetComponent`
- **From**: Handled via `BrowserWidgetShapeUtil`.
- **To**: `BrowserNode.tsx` (A standard React component receiving `data` and `id` props).
- **Benefit**: No more HTML portal wrapping. Clicks, drags, and right-clicks behave exactly like normal web development. 

### 2. Convert System Widgets
- Refactor `CanvasesWidget` to `CanvasesNode.tsx`.
- Refactor `SettingsWidget` to `SettingsNode.tsx`.
- The `<webview>` `context-menu` and sleep mechanics remain identical, but they no longer fight the canvas library for DOM focus.

---

## Phase 3: The Canvas Implementation

### 1. Rewrite `SpatialCanvas.tsx`
- Replace `<Tldraw>` with `<ReactFlow>`.
- Inject the custom node types: `nodeTypes={{ browserWidget: BrowserNode, ... }}`.
- Drop in React Flow's native `<Background>` component (configure it to our infinite grid layout).
- Drop in React Flow's native `<MiniMap>` component. We can style it to look exactly like our floating glass minimap, entirely deleting our manual scale/math logic in `Minimap.tsx`.

### 2. Pointer Event & Pan Handling
- `<webview>` elements *still* consume mouse events (because they are separate Chromium instances). We must keep the Spacebar/Shift Global Hotkey.
- When Spacebar/Shift is held, we toggle a `pointer-events-none` overlay over the webviews, allowing the React Flow `<Background>` underneath to instantly catch the mouse and pan the canvas.

---

## Phase 4: UI & Coordinate Wiring

### 1. Omnibar & Context Menus
- Replace TLDraw's `editor.screenToPage(point)` with React Flow's `useReactFlow().screenToFlowPosition(point)`.
- Re-wire the Right Click "Spawn Tab Here" to utilize the clean screen-to-flow mapping.

### 2. Full-Screen Focus Mode & Centering 
- Replace `editor.setCamera` with React Flow's `fitView` or `setCenter` API.
- Wiring up the green macOS window button to call `fitView({ nodes: [{ id: targetNodeId }], duration: 500 })`. React Flow has native, smooth CSS transitions for zooming in on a specific node.

---

## Estimated Execution Time
- **DOM/State Porting**: 1 Day
- **UI Refining & Pan testing**: 1 Day
- **Net Result**: 100x cleaner SSoT, 0 click-eating bugs, ready for Oragai sub-agents to draw visible connection lines (edges) between tabs.