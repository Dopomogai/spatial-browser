---
title: "Center View Action Malfunction"
status: "todo"
priority: "medium"
created_at: "2026-04-20"
---

# Issue
The "Center View" command in the SpatialCanvas context menu currently does nothing. 

# Cause
Likely `editor.zoomToFit()` is not tracking the right bounding box bounds when zero shapes are explicitly grouped, or it's firing without proper animation bounds.

# Fix needed
Rewrite the `Center View` handler to calculate the bounds explicitly via `widgets` or `editor.getCurrentPageBounds()` and pan to the center with `editor.setCameraOptions` or `cameraOnPoint`.