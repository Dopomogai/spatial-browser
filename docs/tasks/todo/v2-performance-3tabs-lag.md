# V2 Render Scaling: 3+ Webview Performance Collapse & NPM Injection

## Current Regression & Issues
When more than 3 Chromium `<webview>` tags are concurrently mounted on the endless React Flow grid, framerates plummet well beneath target thresholds. Input lag spikes on drag, and CPU overhead climbs significantly. 

## The Architectural Shift (Alternatives to Webview)
Our current bottleneck isn't server-side polling speeds—it's Chromium `<webview>` RAM allocation inside the Spatial map. Migrating to Rust does not solve the fundamental constraint that rendering 15 browser tabs concurrently consumes enormous GPU/RAM overhead on the end-user's device. We must solve the spatial 'Culling' logic locally first.

We cannot continue relying on `<webview>` for internal tools. The alternative is to **render Dopomogai mini-apps directly onto the canvas as native React components**, completely bypassing the Chromium multi-process rendering overhead. 

## Action Plan

### Phase 1: The Widget Engine (NPM Injection)
*   **The Goal:** Prove we can render Dopomogai mini-apps directly on the canvas without using RAM-heavy `<webviews>`.
*   **The Execution:** Take an existing app from the FE-Monorepo (e.g., Command Center, Chat Interface), compile it into an NPM package (like the Auth package), and import it into the Desktop OS. Build a native React Flow `<WidgetNode>` that mounts it seamlessly onto the glass.
*   **Why?** This guarantees we can build complex tools that run at 60fps and natively share the exact same Auth JWT and Database connection as the background OS, skipping the complex Electron IPC memory-bridge.

### Phase 2: The AI Orchestration (Wiring ultimate-widget)
*   **The Goal:** Bring the Dopomogai AI Agent into the visual layer.
*   **The Execution:** Build the UI hook (an orb or a sidebar) that talks to the `ultimate-widget` backend. Wire up the SSE streaming connection to receive LLM text responses.
*   **The Magic:** When the AI agent decides to execute a tool (like "Rearrange the user's workspace"), `ultimate-widget` hits `api.dopomogai.com`. Natively connected nodes mean the AI's actions will physically manifest on the React Flow screen in real-time via the Websocket.

### Phase 3: Sleeping Tabs & The Spatial Snapshot Cache (External Web)
*   **The Goal:** Prevent Chrome from eating 16GB of RAM when we *must* use a webview (e.g., browsing Google Docs, Wikipedia).
*   **The Execution:** Implement strict off-screen rendering 'Culling'. When a user pans/zooms so an external webview is heavily out of frame, we destroy the `<webview>` DOM element and instantiate a cached `<img>` screenshot instead. State transitions to `interactionState: 'sleeping'`.
