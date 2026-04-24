# Task: V2 Render Scaling - Replacing Chromium Webviews with Native Culling

## Current Regression & Issues
When more than 3 Chromium `<webview>` tags are concurrently mounted on the endless React Flow grid, framerates plummet well beneath target thresholds. Input lag spikes on drag, and CPU overhead climbs significantly. Our current bottleneck isn't server-side polling speeds—it's Chromium `<webview>` RAM allocation inside the Spatial map. Migrating to Rust does not solve the fundamental constraint that rendering 15 browser tabs concurrently consumes enormous GPU/RAM overhead on the end-user's device. We must solve the spatial 'Culling' logic locally first.

## Solution & Component Migration
What are the alternatives to the Chromium `<webview>`? 
We will shift towards rendering custom Dopomogai mini-apps natively directly onto the React Flow canvas as React components, bypassing the multi-process Chromium rendering overhead entirely.

## Action Plan
1. **Implement Spatial Snapshot Culling:** Map `viewport.zoom` and `viewport.x/y` to calculate which `<webview>` Nodes are visually on-screen vs off-screen.
2. **Sleeping States:** Introduce `interactionState: 'active' | 'sleeping'` to `BrowserWidgetData`. When sleeping, destroy the `<webview>` DOM node and replace it with a cached screenshot (`<img>`).
3. **Phase 1 (The Native Widget Engine):** Prove we can render Dopomogai apps directly on the canvas without RAM-heavy `<webviews>`. We will compile a FE-Monorepo app (e.g. Command Center or Chat) into an NPM package, import it into the Desktop OS, and build a native React Flow `<WidgetNode>` to mount it.
4. **Phase 2 (The AI Orchestration):** Build the UI hook (orb or sidebar) that talks to `ultimate-widget`. Wire up the SSE streaming connection to receive LLM text responses. When the AI agent executes a tool, `ultimate-widget` hits `api.dopomogai.com` and physically manifests the action cleanly on the canvas without heavy Electron overhead.
