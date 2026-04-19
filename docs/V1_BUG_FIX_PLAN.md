# V1: Spatial Browser UX Polish and Bug Fix Plan

Based on the manual testing pass for "V1 proper", we have established the following targeted fix-list to stabilize the user experience before moving into V2 architectures.

~~## 1. Sleeping Logic Consistency~~ (COMPLETED)
~~## 3. Chrome-like Tab Bar & Grouping~~ (COMPLETED)
~~## 5. UI/UX: Grid, Minimap, and Resizing Grips~~ (COMPLETED)

---

## 4. Enhanced Tab Spawning (Right Click)
**The Issue:** The current right-click `Spawn Tab Here` drops the tab at raw physical screen coordinates, which breaks if the user is panned far away or zoomed out. 
**The Fix:**
- When the `Spawn Tab Here` button is clicked in `SpatialCanvas.tsx`, we must take `contextMenuPos.x/y`, run it through `editor.screenToPage(x, y)`, and pass those exact converted coordinates to `useCanvasStore.getState().addWidget({ x: page.x, y: page.y })`.

## 6. The "Pan Hack" & Keyboard Traps
**The Issue:** `<webview>` elements intercept all mouse and keyboard events. If a user is looking at a heavy web app, they cannot pan the infinite canvas, and keyboard shortcuts (like `Cmd+K` or `Cmd+Shift+B`) are swallowed by the webpage.
**The Fix:**
- In `BrowserWidgetComponent.tsx`, implement an event listener for the `Shift` key.
- When `Shift` is held down, inject `pointer-events: none` directly onto the `<webview>` container. This allows the user's mouse and keyboard commands to "fall through" the browser tab and hit the TLDraw canvas underneath, allowing seamless panning and shortcut execution.

## 7. Electron IPC & Webview Hardening
**The Issue:** Opening random URLs inside `<webview>` tags without proper sandbox hardening is a major security risk, and external clicks (like `target="_blank"`) currently do nothing or crash the app.
**The Fix:**
- In `main/index.ts`, intercept the `will-attach-webview` and `will-navigate` events.
- Force `contextIsolation: true` and block node integration.
- If a webview tries to open a new window (`window.open`), intercept it and route it back to our React store via an IPC message so we spawn a new Spatial Tab instead of an external Chrome window. 

## 8. Tab Navigation Persistence (canGoBack)
**The Issue:** When a tab goes to sleep and wakes back up, its `webview` is destroyed and recreated, resetting the page state and losing the Back/Forward history.
**The Fix:**
- The `<BrowserWidgetComponent>` needs native `<button>` controls for Back/Forward.
- We must manually query `webview.canGoBack()` on every URL change and store this state locally.

---

# V2 - V5: The Definitive Roadmap

## 🚀 V2: The AI "Ghost" & Photographic Memory
**The Goal:** Transition from a manual browser to an Autonomous Workspace.
- **The AI Agent:** Launch a local Python backend that connects to Electron's port 9222. You see a second "Ghost Cursor" on the canvas that clicks and types inside your widgets.
- **Photographic Memory:** Use a local embedding model to scrape the text of every tab. You can now ask: "Find the tab where I was looking at that specific Python library yesterday," and the canvas will auto-pan to that exact widget.
- **Automated Organization:** One button to "Clean Up Workspace"—the AI groups tabs by project and minimizes unused ones into pills.
