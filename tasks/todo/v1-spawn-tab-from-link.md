---
title: "Spawn New Tab From Link Click Inside Webview"
status: "backlog"
priority: "high"
iteration: "v1"
created_at: "2026-04-20"
---

# Issue
When a user clicks a link inside a webview that would normally open in a new window (target="_blank"), the main process intercepts it via `setWindowOpenHandler` and sends `spawn-tab-from-link` IPC to the renderer. But the renderer currently has no listener for this event — the new tab never spawns.

# Solution
- In `App.tsx` or `SpatialCanvas.tsx`, add an `ipcRenderer.on('spawn-tab-from-link')` listener.
- When received, call `addWidget(url, x, y)` at the viewport center or offset from the source widget.
- Ensure the new widget is immediately set to `active` state.

# From Spec
> main.ts: `mainWindow.webContents.send('spawn-tab-from-link', url)`
