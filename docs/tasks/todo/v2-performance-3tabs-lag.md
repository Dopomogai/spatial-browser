# Performance Lag with Multiple Webviews
**Issue:** Even simply having 3+ websites open introduces noticeable system lag and canvas sluggishness. We need to implement a sweeping performance profile and look into Electron/Chromium render partitioning or disabling hardware acceleration flags if GPU contexts are clashing.
**Hypothesis:** WebGL contexts from active `<webview>` sources and React Flow canvas rendering are conflicting over GPU resources, or Zustand state bindings are thrashing React re-renders globally.
**Actionable Fix 1:** Identify if `hardware-acceleration` in `main/index.ts` should be modified or if specific webview `webpreferences` flags (e.g. `disableBlinkFeatures`) can optimize multi-frame Chromium offscreen rendering.
**Actionable Fix 2:** Combine with hysteresis tracking in `v2-favicons-and-sleeping-tabs.md` to aggressively unload DOM memory from Chromium instances not currently visible on the active 2D grid.
