---
title: "V3: Event Bus & Visual Node Connections"
status: "backlog"
priority: "low"
iteration: "v3"
created_at: "2026-04-20"
---

# Objective
Allow users to draw visual lines between widgets to create data pipelines. The AI monitors these connections and passes data between nodes automatically.

# Example
Draw a line from "Gmail Tab" → "Custom To-Do Widget." The AI monitors emails arriving, extracts action items, and populates the to-do list automatically.

# Implementation Details
- Use TLDraw's native arrow/connector shapes to visually link widgets.
- Store connections in the Zustand store as an adjacency list.
- The AI backend watches the connection graph and triggers automation when data changes in a source node.

# Depends On
- `v2-dom-scraping-preload-bridge.md`
- `v2-python-websocket-controller.md`
- `v3-native-custom-widgets.md`
