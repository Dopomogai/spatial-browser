---
title: "Screenshot Storage Pipeline"
status: "backlog"
priority: "medium"
created_at: "2026-04-20"
---

# Objective
Refactor the sleep-state screenshot captures to automatically upload to a Supabase Storage bucket rather than saving massive base64 data URLs in the canvas state.

# Implementation Details
- Periodically upload captured webview screenshots to the bucket.
- Store the resulting public/signed URL in the `spatial_canvases` state tree.
- Update `BrowserWidgetComponent` to render the sleeping tab overlay using the remote URL rather than parsing a massive string, improving React diffing performance.
