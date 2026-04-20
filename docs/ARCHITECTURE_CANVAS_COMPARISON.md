# TLDraw vs Custom Canvas Architecture Analysis

## The TLDraw Problem
TLDraw is a whiteboard engine. It expects to own all pointer events, keyboard events, and gestures so it can draw shapes. We are putting heavy, interactive Chromium `<webview>` elements *inside* of it, which forces us to write constant hacks to prevent TLDraw from stealing clicks, scrolling, and typing.

### Pros of TLDraw
1. **Multiplayer Sync**: TLDraw's `store` architecture is built for CRDT-style multiplayer out of the box (via Yjs or Liveblocks). If we want multiple humans (or humans + AI cursors) seeing the same canvas in real-time, TLDraw handles the state reconciliation perfectly.
2. **Infinite Canvas Math**: Panning, zooming, momentum, bounds calculation, relative coordinate mapping (`screenToPage`) — this is thousands of lines of complex math that TLDraw provides for free.
3. **Free License**: The source-available license allows free use for 100 days, after which commercial licensing applies if we don't open-source our specific implementation.

### Cons of TLDraw
1. **Event Blackhole**: The core engine captures `pointerdown`, `pointermove`, `wheel`, and `keydown` events before anything else. The `<webview>` tags constantly fight it.
2. **Whiteboard DNA**: It inherently wants users to draw shapes, arrows, and text. Double-clicking spawns text fields. Pressing `v` switches to a select tool. We have to violently disable 90% of its features just to make it act like a spatial OS.

## Alternatives for the Base Layer

### 1. React Flow
* **Overview**: A node-based UI library built specifically for interactive, spatial diagrams (not drawing).
* **Why it fits Dopomogai**: It natively expects complex HTML/React components (like our webviews) to be placed on a zoomable, pannable canvas. It does *not* try to be a whiteboard. It handles panning, zooming, and mini-maps perfectly while letting native DOM events pass through to the nodes.
* **Cost**: MIT License (Free forever).
* **Multiplayer**: Requires manual sync (Zustand + WebSockets), but it's built to store state cleanly allowing for Yjs integration.

### 2. PixiJS (via React-Pixi)
* **Overview**: A high-performance 2D WebGL rendering engine.
* **Why it fits Dopomogai**: If the V5 goal is a literal "WorldBox" style isometric map engine with agents walking around between buildings, PixiJS can render 10,000+ sprites at 60FPS.
* **The Catch for Webviews**: WebGL cannot render live Chromium webviews inside the canvas. We would have to build a hybrid system where PixiJS renders the world and handles the camera math, while a React DOM overlay absolutely positions `<div>` containers matching the WebGL camera coordinates to hold the webviews. 

### 3. Pure Custom React/CSS Engine (The Figma/Miro Approach)
* **Overview**: We own the math. A giant `<div>` with `transform: translate(x, y) scale(z)`.
* **Why it fits Dopomogai**: Absolute, total control. Zero fighting with third-party libraries over who owns a mouse click. We map the coordinates to our `spatial_widgets` database schema perfectly.
* **Cost**: We have to write our own panning momentum, minimap scaling, and pinch-to-zoom math.

## Architectural Decision

Given that Dopomogai requires a highly customized, database-backed `spatial_timeline` (Time Machine) and V2 AI Copilot interactions, fighting a whiteboard engine to act like a window manager is technical debt we will eventually have to pay down. 

### Recommendation: The Hybrid DOM Overlay (Short-Term TLDraw Fix)
Before ripping out TLDraw, we should extract the `<webview>` elements from *inside* the TLDraw structure. 

We can keep TLDraw as an invisible background layer that solely handles panning, zooming, and the minimap math. The webviews then render in a standard React `<div>` overlay on top of the canvas, listening to TLDraw's camera coordinates (`x, y, z`) to update their CSS `transform` values. 

This instantly solves 100% of the click interception, drawing, and keyboard trap bugs, while keeping TLDraw's camera engine intact while we prove out the V1 spatial concepts.