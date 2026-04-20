---
title: "V2: Spatial Time Machine (Canvas Rewind)"
status: "backlog"
priority: "low"
created_at: "2026-04-20"
---

# Objective
Leverage the incremental `spatial_timeline` sync architecture to allow users to visually rewind their workspace and revive closed tabs exactly where they were located.

# Implementation Details
- Build a timeline slider component in the main OS UI.
- Use relational sync data to fetch the exact X/Y arrangement of widgets from a specific timestamp.
- Render missing widgets as translucent "Ghost Widgets" with the option to instantly re-hydrate them into active or sleeping states.
