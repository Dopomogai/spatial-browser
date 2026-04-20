---
title: "Favicon Extraction for Minimized Pills"
status: "backlog"
priority: "medium"
iteration: "v1"
created_at: "2026-04-20"
---

# Issue
The `SpatialWidget` type includes a `faviconUrl` field in the spec, but currently the minimized pill state just uses a generic `<Globe>` icon. Real favicons would make the pills genuinely usable as spatial bookmarks.

# Solution
- On `did-navigate` or `dom-ready`, extract the favicon URL from the webview using `webview.executeJavaScript()` to read `document.querySelector('link[rel*="icon"]')?.href`.
- Fall back to `${origin}/favicon.ico` if no link tag exists.
- Store in `widget.faviconUrl` and render in the minimized pill overlay and the TopTabBar.

# From Spec
> Zustand State Schema — `faviconUrl: string` field
