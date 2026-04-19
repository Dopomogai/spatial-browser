# V1: Spatial Browser UX Polish and Bug Fix Plan

Based on the manual testing pass for "V1 proper", we have established the following targeted fix-list to stabilize the user experience before moving into V2 architectures.

~~## 1. Sleeping Logic Consistency~~ (COMPLETED)
~~## 3. Chrome-like Tab Bar & Grouping~~ (COMPLETED)
~~## 4. Enhanced Tab Spawning (Right Click)~~ (COMPLETED)
~~## 5. UI/UX: Grid, Minimap, and Resizing Grips~~ (COMPLETED)
~~## 6. The "Pan Hack" & Keyboard Traps~~ (COMPLETED)
~~## 7. Electron IPC & Webview Hardening~~ (COMPLETED)

---

## 8. Tab Navigation Persistence (canGoBack)
**The Issue:** When a tab goes to sleep and wakes back up, its `webview` is destroyed and recreated, resetting the page state and losing the Back/Forward history.
**The Fix:**
- The `<BrowserWidgetComponent>` natively controls Back/Forward locally inside the React state (`canGoBack`, `canGoForward`). 
- When the `webview` fires `did-navigate`, we must persist the current active URL into the `spatial_widgets` store so we wake up on the *last navigated URL*, not the original base URL. (Note: True chromium history stack serialization `savePage()` over IPC is too heavy for V1 and will be addressed in V2 state blobs).

# V2 - V5: The Definitive Roadmap

## 🚀 V2: The AI "Ghost" & Photographic Memory
**The Goal:** Transition from a manual browser to an Autonomous Workspace.
- **The AI Agent:** Launch a local Python backend that connects to Electron's port 9222. You see a second "Ghost Cursor" on the canvas that clicks and types inside your widgets.
- **Photographic Memory:** Use a local embedding model to scrape the text of every tab. You can now ask: "Find the tab where I was looking at that specific Python library yesterday," and the canvas will auto-pan to that exact widget.
- **Automated Organization:** One button to "Clean Up Workspace"—the AI groups tabs by project and minimizes unused ones into pills.
