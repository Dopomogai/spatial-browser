# Dopomogai Spatial Browser: Architectural Execution Plan (V1 Hardening)

## Sub-Agent Delegation Tracks
To execute rapidly, we are splitting the V1 hardening into three parallel tracks. Each track will be assigned to a dedicated Hermes sub-agent with isolated context.

### 🔴 Track 1: The Core Engine (State, Webviews & Memory)
**Focus:** Fix the physics of the browser. Tabs must not lose memory, and sleep must be reliable.
*   **The Sleep/Wake Loop Fix:** Strip contradictory `isVisible` vs `isOffScreen` logic between `SpatialCanvas.tsx` and `BrowserWidgetComponent.tsx`. State is managed by Zustand, truth comes from intersection observers.
*   **State Persistence (URL):** Ensure `webview` navigation events update the `initialUrl` or a new `currentUrl` property in the Zustand store so minimized/reopened tabs don't reset to `google.com`.
*   **Screenshot Persistence (The "Freeze" Bug):** When a tab is marked for sleep, await `webviewRef.current.capturePage()`. Convert the Electron `NativeImage` to a base64 Data URI and store it in `widget.thumbnailData`. Render this image instance when the state is `sleeping` instead of just text or a blank void.

### 🔵 Track 2: The Ethereal HUD (UI & Environment)
**Focus:** Implement the visual hierarchy defined in `DESIGN.md` and the provided mockups.
*   **The Spatial Canvas:** Implement the subtle dotted grid background (`surface_container_lowest`) to anchor the user spatially.
*   **The Command Header:** Build the floating Top Navigation Bar (Logo, Tab Links, Search, Settings/Utility Icons).
*   **The Minimap:** Build a top-right minimap component that calculates a scaled view of all `widgets` in the Zustand store against the current `viewport` bounding box.
*   **Design Typography & Colors:** Enforce the `#131315` charcoal background, `#aac7ff` primary accents, and the "no-line" ambient shadow rules (`0px 12px 32px`, 10% opacity). Replace text states with the `#ffb868` Status Orb.

### 🟢 Track 3: Ergonomics & Time (Interactions & History)
**Focus:** Make the app feel like a premium tool, not a prototype.
*   **Frictionless Spawning:** Implement a Canvas Context Menu (Right-click logic). Bypass `Cmd+K` as the only entry point. Allow spawning tabs at exact `(x,y)` cursor coordinates.
*   **Time Machine (Undo/Redo):** Implement a Zustand middleware or history array that tracks widget transformations (move, resize, cluster).
*   **Workspaces (Multi-Canvas):** Build the load/save logic to stream out the Zustand state into distinct JSON profiles mapping to different contexts (e.g., "Developer View" vs "Marketing View").
*   **Tactility:** Upgrade the resize handles with glassmorphic styling (backdrop blur).

---
*Next Phase: Once these tracks merge, we unlock V2 (The Ghost Cursor & Local Embeddings).*