---
title: "Tab Right-Click Context Menu"
status: "todo"
priority: "high"
created_at: "2026-04-20"
---

# Issue
Right-clicking inside a `.webview` tab does nothing.

# Requirements
- We must mimic basic browser functionality on right-click over a webpage.
- Provide a native Electron `Menu` or React context menu overlay that triggers when right-clicking the `<webview>`.
- Essential actions required: "Copy", "Paste", "Open Link in New Tab", "Reload".
- **Note:** Capturing right-clicks inside an isolated webview requires intercepting IPC events or using `webview.getWebContents().on('context-menu')` passing the coordinates out to the main process or renderer.