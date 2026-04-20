---
title: "Global Reload Button on Tabs"
status: "todo"
priority: "high"
created_at: "2026-04-20"
---

# Issue
There is no explicit way to reload a stuck or broken tab easily from the spatial UI without using a keyboard shortcut inside the webview trap.

# Requirements
- Add a refresh/reload `<RotateCw>` icon button to the top auto-hiding header of the `BrowserWidgetComponent.tsx` next to the Back/Forward Chevrons.
- Clicking it should execute `webviewRef.current.reload()`.