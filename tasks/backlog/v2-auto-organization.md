---
title: "V2: AI Auto-Organization"
status: "backlog"
priority: "medium"
iteration: "v2"
created_at: "2026-04-20"
---

# Objective
Allow the user to tell the AI "Organize my canvas" and have it intelligently sort 100+ tabs into semantic Canvas Groups, minimize them into pills, and arrange them beautifully on the spatial plane.

# Implementation Details
- Requires the Vector Embedding Engine to understand the content/topic of each tab.
- The AI reads all widget metadata + embeddings, clusters them (Work, Personal, Research, etc.), and dispatches batch `updateWidget` events to rearrange X/Y positions.
- New "Canvas Group" concept: a visual bounding container on the TLDraw canvas that labels the cluster.

# Depends On
- `v2-local-vector-embedding-engine.md`
- `v2-dom-scraping-preload-bridge.md`
