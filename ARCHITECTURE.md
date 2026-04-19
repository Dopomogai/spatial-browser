# Architecture Overview

## Design Patterns

### 1. Spatial Canvas Engine (tldraw)
The application is wrapped in a `tldraw` infinite canvas. Every browser tab is represented as a custom shape (`BrowserWidget`).
- **File:** `src/renderer/src/components/canvas/SpatialCanvas.tsx`
- **Logic:** Synchronizes the UI state (Zustand) with the TLDraw document. When a user pans or zooms, the canvas handles the transformation of the widgets.

### 2. The 3-State Lifecycle (Memory Management)
This is the core optimization strategy to allow a heavy Electron app to survive 100+ tabs.
- **Active:** Live `<webview>` tag.
- **Sleeping:** Replaced by a `canvas` or `img` snapshot captured via `capturePage()`. The actual `<webview>` is destroyed.
- **Minimized:** Scaled down version for high-density spatial clustering.
- **Implementation:** `src/renderer/src/components/shapes/BrowserWidget/BrowserWidgetComponent.tsx` using `URL.createObjectURL(blob)` for RAM-efficient image caching.

### 3. Zustand Global Event Bus
Acts as the single source of truth for both human and AI interactions.
- **File:** `src/renderer/src/store/useCanvasStore.ts`
- **Role:** Handles widget CRUD, state toggles (Omnibar, Spacebar), and persistence.

### 4. AI Control Bridge (V2 Ready)
The application exposes a WebSocket server in the main process and an IPC bridge to the renderer.
- **Main Process:** `src/main/index.ts` opens a WS server on `8080`.
- **Preload Script:** `src/preload/index.ts` listens for keyboard traps and AI events.
- **Renderer:** `App.tsx` listens for the `ai-event` IPC channel and dispatches actions to the Zustand store.

## Security & Interop

- **webSecurity:** Set to `false` in V1 to allow cross-origin requests for spatial scraping.
- **webviewTag:** Enabled for isolated browser environments.
- **IPC Safety:** All external inputs are routed through a strictly defined `contextBridge` API.

## Preload Mechanism
To solve the production `.asar` path issue, the absolute path to the preload script is dynamically determined in the `preload` script itself and exposed via `window.api.getPreloadPath()`. This ensures the `<webview>` always find its "Keyboard Trap" logic regardless of where the app is installed.
