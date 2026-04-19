# Spatial Browser (CanvasOS)

Spatial Browser is an experimental macOS-native desktop application showcasing a "Spatial Operating System" built on an infinite canvas. Instead of standard browser tabs, elements live as floating, interactable widgets on a 2D canvas, optimized for managing 100+ tabs using dynamic memory states. 

It is designed to be the foundational UI layer for a future Python-based AI controller (V2).

## Tech Stack
- **Framework:** Electron + Vite
- **Frontend:** React 18, TypeScript, TailwindCSS
- **Canvas Engine:** tldraw (v2)
- **State Management:** Zustand (Global Event Bus for UI & AI)
- **Local DB:** IndexedDB (via `idb-keyval`)

## Architectural Principles (CTO Directives)

1. **The Thin Wrapper:** `main.ts` is strictly for node execution, window instancing, and CORS bypassing. Heavy computation is intended to be passed to a V2 AI backend via WebSockets.
2. **Event-Driven UI:** Everything that happens on the canvas executes through the `zustand` store (`useCanvasStore.ts`). In V2, the AI will trigger these identical events to ghost-control the canvas.
3. **The "Pan Hack":** Normally, `<webview>` tags intercept all mouse events, making an infinite canvas un-pannable. This is bypassed using a Spacebar overlay (`isSpacebarHeld`) to shield the webviews and re-enable global dragging.
4. **The "Keyboard Trap":** Webviews steal React's keyboard focus. A preload script intercepts global commands (like `Cmd+K` for the Omnibar) and passes them back up to the renderer via IPC (`ipcRenderer.sendToHost`).

## The 3-State Lifecycle (Memory Management)

To allow the Mac to sustain hundreds of browser tabs smoothly, Spatial Browser employs a 3-State Widget Lifecycle for RAM optimization:

1. **Active (On-Screen):** The live Chromium `<webview>` instance. Uses full system resources.
2. **Sleeping (Off-Screen):** Automatically triggered via `tldraw` intersection observers when a widget leaves the viewport. The system captures the page to a lightweight Blob URL, destroys the Chromium instance, and replaces it with a blurred screenshot placeholder. Wakes up smoothly when panned back to.
3. **Minimized (The Pill):** Triggered by minimizing the window. Destroys the webview and scales the canvas shape down to a lightweight 250x48px "pill" containing only the title and favicon. Ideal for spatial bookmark clustering.

## Setup & Development

```bash
# Install dependencies
npm install

# Run application locally
npm run dev

# Run E2E and State tests
npm run test

# Build for Mac production
npm run build
```

## AI Control (WebSockets)

The Node process initializes a WebSocket server listening to accept remote instructions.
- Port: `8080` (or configured via `process.env.PORT`)
- Events forwarded through standard `ipcRenderer` and executed functionally on the `zustand` state store.
