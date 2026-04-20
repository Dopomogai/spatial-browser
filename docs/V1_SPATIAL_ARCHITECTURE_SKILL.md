---
name: spatial-browser-architecture
description: Development guidelines, edge cases, and architecture directions for Dopomogai's Spatial Browser prototype.
tags:
  - architecture
  - spatial-os
  - electron
  - tldraw
---

## Crucial V1 Remediation Patterns
These are hard-won lessons from bringing the V1 Spatial Browser prototype to production stability:

### 1. The Electron `<webview>` Lifecycle Crash
**The Problem:** Calling native webview methods like `.getURL()` or `.capturePage()` immediately upon the React component mounting causes Chromium bounds failures because the underlying renderer process hasn't finished booting (`Error: The WebView must be attached to the DOM and the dom-ready event emitted`).
**The Fix:** You MUST maintain a discrete `isReady` state hook inside the `<BrowserWidgetComponent />`. Bind an event listener to `webview.addEventListener('dom-ready', () => setIsReady(true))` and block all capture/poll logic behind `if (!isReady) return`.

### 2. Standard Web Navigation & Ghost UI Modals
**The Rule:** Standard popup menus and sticky headers destroy the infinite canvas illusion.
**The Fix:**
- Wiped the top navigation bar to pure minimal layout (Logo & Search).
- Moved controls into floating `surface_container_lowest` Glassmorphism objects on the TLDraw canvas (e.g., the bottom dock HUD).
- Standard Back/Forward navigation controls were injected via native listeners (`webview.canGoBack()`, `webview.canGoForward()`), updating an internal state object hooked to `did-navigate` and `did-navigate-in-page`. Right-click history requires an IPC bridge to the main process, as Electron explicitly blocks `getWebContents().history` in the renderer.
- Non-URL queries typed into the Omnibar are caught with Regex and encoded into `https://www.google.com/search?q={query}` to preserve natural browser UX.

### 2.1 TLDraw Component Control Overrides
**The Problem:** Default TLDraw tools and UI controls inherently assume a whiteboard application, interfering with spatial window management. Clicking near a webview and typing accidentally spawns text shapes or circles.
**The Fix:** You must strip TLDraw's default logic entirely.
1. Force `allowedShapeTypes` strictly to only our custom application widgets (e.g. `['browser_widget', 'canvases_widget']`).
2. Pass `components={{ KeyboardShortcutsDialog: null, Toolbar: null }}` to the `<Tldraw>` wrapper.
3. On mount, explicitly lock the canvas to the pointer: `editor.setCurrentTool('select')`.

### 2.2 Minimap Coordinate Physics
**The Problem:** Passing `{ constraints: { bounds: null } }` to TLDraw's `setCameraOptions` to allow the Minimap to freely center the camera over widgets crashes the WebGL viewport engine (`TypeError: Cannot read properties of undefined (reading 'y')` inside `getConstrainedCamera`).
**The Fix:** Do not alter the camera constraints. Instead, calculate the exact bounding box of the target widgets, fetch the active viewport bounds (`editor.getViewportPageBounds()`), and use direct math to center it natively:
`editor.setCamera({ x: -centerX + bounds.w / 2, y: -centerY + bounds.h / 2 }, { animation: { duration: 300 } });`

### 3. The "Shift Hack" for Infinite Canvas Panning
**The Problem:** Chromium `webview` tags notoriously swallow scroll and pointer events, trapping the mouse inside the website rather than letting the user pan the TLDraw canvas underneath it.
**The Fix:** We implemented a global `Shift` key intercept in `App.tsx` that dispatches a CustomEvent (`window.dispatchEvent(new CustomEvent('shift-state-change'))`). Active BrowserWidgets listen for this event and dynamically alter their CSS to `style={{ pointerEvents: isShiftHeld ? 'none' : 'auto' }}`. Holding Shift instantly hollows out all webviews, allowing uninterrupted native infinite canvas panning to pierce through heavy interactive sites seamlessly. Release `Shift` to instantly restore control. Make sure you actually dispatch the global keyboard event in the parent provider.

### 4. Native OS Object Dropping (Context Menu)
**The Problem:** Default right-click context menus are swallowed by TLDraw or Electron `<webview>`s. Adding new workspaces defaulted to the exact center of the screen, which disoriented the spatial flow. Chromium also injects its own right-click menu over the `<webview>`, conflicting with our custom UI.
**The Fix:** 
- We intercepted the `onContextMenu` event purely on the overarching TLDraw canvas container. We capture the raw `(x,y)` screen coordinates, pass them through `editor.screenToPage()`, and spawn a Glassmorphic floating menu component rendered natively in React. When a tab is spawned, it drops *exactly* under the cursor.
- We must aggressively capture and prevent the Chromium default menu at the React `<webview>` ref level using `wv.addEventListener('context-menu', (e) => e.preventDefault())`.

### 5. Synchronous Key-Value Cloud Sync (Zustand -> IDB -> Supabase)
**The Problem:** Native canvas positioning, UI sleep states, and base64 snapshot caches must survive native macOS app crashes, but must also eventually be available to the V4 Cloud OS.
**The Fix:** The master `useCanvasStore.ts` utilizes a multi-tiered persist pattern:
1. Every component movement triggers a 1000ms debounced auto-save.
2. The resulting `state_json` blob is dumped instantly into local `idb-keyval` for sub-millisecond local survival.
3. A synchronous `.upsert()` call is fired via `@supabase/supabase-js` targeting the `https://supa.dopomogai.com` postgres instance to back up the spatial layout cloud-side.
**Critical Schema Note:** Do NOT dump raw JSON states into existing structured tables (like the CRM `workspaces` table). Always create a dedicated structured table (e.g., `spatial_workspaces` with `id`, `name`, `state_json`, `updated_at`) to prevent PostgreSQL 500 column errors and schema contamination.

### 6. The Webview 'Plus' Rendering Crash & Native Prompts
**The Problem:** Unintended variables imported from external React libraries (e.g., Lucide React icons like `Plus` or `Menu` inside spatial components like `SpatialCanvas.tsx`) that aren't defined properly cause hard `ReferenceError` crashes taking down the entire Electron renderer. Additionally, using native `window.prompt()` in Electron (e.g., for saving canvases) strictly crashes the renderer when security policies are enforced.
**The Fix:** Always verify destructured imports for UI icons. Never use `window.prompt()`; instead, use a strictly controlled React modal state or auto-generate fallback names (e.g., `Canvas_${Date.now()}`) to avoid crashing the Chromium process.

### 6.1 Webview Session Persistence
**The Problem:** When users log into external webviews (GitHub, Figma) or when a spatial tab goes to sleep to save RAM, they lose their session cookies when the tab wakes back up or the app restarts.
**The Fix:** You MUST supply a persistent partition to the `<webview>` tag attribute: `<webview partition="persist:main" />`. This binds the embedded Chromium to the native macOS `~/Library/Application Support/...` cookie jar, keeping the user logged into their tools permanently across the Spatial OS.

### 7. Dragging Frameless Windows (macOS)
**The Problem:** To make the frameless Electron window draggable on macOS, developers often apply `-webkit-app-region: drag` globally. This makes the entire application draggable but breaks interaction with child elements (like the TLDraw canvas or individual widgets) which inherit the drag region, preventing normal click-and-drag panning or widget movement.
**The Fix:** You must apply `-webkit-app-region: no-drag` explicitly to all interactive areas, specifically the TLDraw container and the draggable handles of individual widgets, to punch a hole in the OS-level drag region. `e.stopPropagation()` must also be applied to widget container events so that dragging a widget doesn't accidentally pan the entire TLDraw canvas underneath it.

## V2 Ghost Node Architecture (The AI Handoff)
Instead of the LLM spinning up hidden Playwright instances, Dopomogai visually integrates the AI into the UI.
- Open Electron with `--remote-debugging-port=9222`.
- A Python FastAPI server connects to this port using a tool like `browser-use` or `playwright`, targeting the specific `<webview>` attached to the active shape.
- When the LLM decides to click X:450, Y:200, the Python server emits a WebSocket payload to the React frontend BEFORE firing the CDP click command.
- React catches the payload and animates a custom SVG "Ghost Cursor" floating over the canvas to the requested coordinates, ensuring total visual observability and trust of agent actions.
- **Native Mac Apps (V3 territory):** Interacting with macOS natively outside of the web view requires `desktopCapturer` to stream the application window as a `<video>` element, paired with `robotjs` / `nut.js` IPC macros to simulate physical mouse hits.

## Data Persistence Architecture

### Three-Tier Spatial Sync
Browser widget states (X/Y coordinates, base64 slept images, URLs) sync via `useCanvasStore.ts` using three tiers:
1. **In-Memory (Zustand)**: Fast, transient UI reactions.
2. **Local IDB (idb-keyval)**: Hardened survival across app restarts. Fired on a 1-second debounce.
3. **Cloud Backup (Supabase PostgREST)**: *Mandatory V2 architectural rule.* Do not store spatial coordinate blob arrays into the CRM `workspaces` table. Always execute an `.upsert` into a strictly dedicated table (`spatial_workspaces` inside the `spatial_os` schema) tracking `state_json` blocks per session to prevent 500 column scaling errors.

### V2 Dedicated Database Schema (`spatial_os`)
Do **not** use monolith JSON blobs inside standard CRM tables for spatial state. V2 requires the "Time Machine" playback tracking. The required schema across 4 tables:
1. `spatial_workspaces`: Links physical canvas map back to `public.workspaces`.
2. `spatial_widgets`: Each tab gets a row (x, y, w, h, state).
3. `spatial_snapshots`: Maps standard Chromium screenshot outputs to Supabase Storage bucket URLs (stops inline DB bloat).
4. `spatial_timeline`: The append-only action log tracking incremental coordinate deltas, `action_type`, and `agent_id` (AI vs Human) to replay entire sessions sequentially.
