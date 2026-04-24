# V2 Render Scaling: 3+ Webview Performance Collapse

## Current Regression & Issues
When more than 3 Chromium `<webview>` tags are concurrently mounted on the endless React Flow grid, framerates plummet well beneath target thresholds. Input lag spikes on drag, and CPU overhead climbs significantly.

## Cause & Hypothesis
Standard DOM logic keeps all `<webview>` processes (and their isolated guest GPU contexts) actively rendering full frames regardless of whether they exist visually within the 1080p 'viewport' camera.
Electron/Chromium handles 2-3 tabs fine, but endless spatial canvases require aggressive "Culling" — destroying the DOM node and replacing it with a cached screenshot `<img>` when it drifts offscreen.

## Action Plan
1. Implement Spatial Culling bounds in `useCanvasStore.ts`. Map `viewport.zoom` and `viewport.x/y` to calculate which Nodes are strictly visually on-screen vs off-screen.
2. Introduce `interactionState: 'active' | 'sleeping'` to `BrowserWidgetData`.
3. When `sleeping`, `BrowserWidgetNode.tsx` must conditionally render an `<img>` of its last known state, and completely nullify the `<webview src={url} />` DOM node to free its VRAM/Electron process thread.
4. If clicked, or panned back into view, transition state back to `active`.
