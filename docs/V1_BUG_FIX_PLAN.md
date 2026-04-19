# V1: Spatial Browser UX Polish and Bug Fix Plan

Based on the manual testing pass for "V1 proper", we have established the following targeted fix-list to stabilize the user experience before moving into V2 architectures.

## 1. Sleeping Logic Consistency
**The Issue:** Opening a tab causes it to enter an endless loop of sleeping and waking up. This is caused by the viewport intersection threshold math conflicting with TLDraw's camera scale and rendering cycles.
**The Fix:**
- In `SpatialCanvas.tsx`, we need to normalize the bounding box checks using `editor.getViewportScreenBounds()` multiplied against `editor.getCamera().z` (scale). 
- Introduce a debounce/hysteresis so that if a tab is repeatedly triggering the 500px boundary threshold rapidly, it defaults to remaining `active`.

## 2. Tab State Persistence (Closing Tabs)
**The Issue:** When a tab is closed, all navigation progress is lost. Reopening it defaults to the system default instead of the historical URL, breaking the "spatial memory" illusion.
**The Fix:**
- In `useCanvasStore.ts`, we must distinguish `interactionState = 'closed'` from a full wipe. 
- Implement a `history_url_stack` array onto the `widget` model so `canGoBack()` states are preserved in Zustand and synced to the new `spatial_os` database schema.

## 3. Chrome-like Tab Bar & Grouping
**The Issue:** Currently, navigation relies almost entirely on physical spatial memory or the Cmd+K `<Omnibar>`. Users need a "list of tabs like in Chrome" that sits at the top UI layer.
**The Fix:**
- Build `<TopTabBar />` in `App.tsx` mapped to the Zustand `widgets` dict.
- Support logical grouping arrays in the store (`group_id: string`). 

## 4. Enhanced Tab Spawning (Right Click)
**The Issue:** The current right-click `Spawn Tab Here` is hard-mapped to center coordinates or requires the Omnibar. 
**The Fix:**
- Intercept the `contextMenuPos.x/y` in `SpatialCanvas.tsx`, convert screen space to page space using `editor.screenToPage(x, y)`, and pass those explicit coordinates to the store's `addWidget()` function.

## 5. UI/UX: Grid, Minimap, and Resizing Grips
**The Issue:** The canvas feels unstructured without a grid, the physical scale requires a minimap to navigate, and the window resizing grips are unstyled default TLDraw handles.
**The Fix:**
- Re-enable the native TLDraw `Grid` but override the CSS to render as a faint dot-grid matching the `is_isometric` theme.
- Re-enable the native TLDraw `Minimap` panel.
- Implement custom CSS for the `.tl-resize-handle`, injecting a dotted/textured UI rather than basic boxes, keeping with the neo-brutalistic/glassmorphism vibe.

## 6. Undo/Redo & History Stack
**The Issue:** Native window creation, movement, and deletion bypasses the TLDraw event stack, meaning `Cmd+Z` does not restore a deleted browser widget.
**The Fix:**
- Map the standard `Undo/Redo` commands to read out of the newly created `spatial_timeline` Postgres table (or the local IDB equivalent), rehydrating the `base_state` payloads automatically.

# V2 - V5: The Definitive Roadmap

## 🚀 V2: The AI "Ghost" & Photographic Memory
**The Goal:** Transition from a manual browser to an Autonomous Workspace.
- **The AI Agent:** Launch a local Python backend that connects to Electron's port 9222. You see a second "Ghost Cursor" on the canvas that clicks and types inside your widgets.
- **Photographic Memory:** Use a local embedding model to scrape the text of every tab. You can now ask: "Find the tab where I was looking at that specific Python library yesterday," and the canvas will auto-pan to that exact widget.
- **Automated Organization:** One button to "Clean Up Workspace"—the AI groups tabs by project and minimizes unused ones into pills.

## 🧩 V3: The Ecosystem & Custom Widgets
**The Goal:** Move beyond just websites into Native Spatial Tools.
- **Widget API:** Allow users to build custom React widgets (Sticky Notes, Calculators, To-Do lists) that live on the canvas.
- **Data Lines:** Users draw lines between a "Gmail Widget" and a "Linear Widget." The AI watches the connection and automatically moves data across the line.
- **App Store:** A marketplace where the community can share "Agentic Widgets" (e.g., a widget that automatically tracks expenses from your open banking tabs).

## ☁️ V4: The Enterprise Droplet (Cloud OS)
**The Goal:** Transition from a personal tool to a Team Productivity Infrastructure.
- **The Droplet Switch:** The app is packaged as a Docker container. Companies deploy it on their own private droplets.
- **Remote Access:** The UI is streamed to any web browser via WebRTC (KasmVNC/Guacamole). You can access your 100-tab spatial workspace from an iPad or a library computer.
- **Multiplayer Canvas:** Colleagues appear as cursors on the same infinite canvas. You can "Follow" someone's view as they pan through a project map.

## 🗺 V5: Gamified Spatial Reality
**The Goal:** Add the "Digital Ashram" layer to make work feel Physical and Alive.
- **The Theme Engine:** Toggle from "Dot Grid" to "Isometric Map." Your widgets now "snap" to desks and buildings in a pixel-art world.
- **Outpainting:** Use a Stable Diffusion bridge to "expand" your office. Drag the canvas edge and type "Add a Zen garden with a waterfall," and the map expands.
- **NPC Agents:** Your AI agents are no longer just cursors; they are small pixel-art characters. You see your "Researcher Agent" walking to the "Library Building" when it's processing your embeddings.
