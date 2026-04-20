---
title: "Keyboard Trap Fix (Global Shortcuts Inside Webview)"
status: "backlog"
priority: "high"
iteration: "v1"
created_at: "2026-04-20"
---

# Issue
When a user clicks inside a `<webview>` (e.g., typing in Notion), the Chromium engine steals keyboard focus from the React app. Global shortcuts like `Cmd+K` stop working because React never receives the keydown event.

# Solution
- Expand `preload/index.ts` to inject a global `keydown` listener inside every `<webview>`.
- When it detects `Cmd+K` (or other reserved OS shortcuts), use `ipcRenderer.sendToHost('toggle-omnibar')` to pass the event back up to the React renderer.
- The `BrowserWidgetComponent` must listen for `ipc-message` on the webview element and dispatch the appropriate Zustand action.

# From Spec
> "The Keyboard Trap Problem (CRITICAL)" — Technical Appendix §1
