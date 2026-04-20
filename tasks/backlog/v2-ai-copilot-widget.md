---
title: "V2: AI Copilot Widget"
status: "backlog"
priority: "medium"
created_at: "2026-04-20"
---

# Objective
Build a native TLDraw shape component for the persistent AI chat assistant that acts as the physical embodiment of the agent on the spatial canvas.

# Implementation Details
- Create `CopilotWidgetShapeUtil` and `CopilotWidgetComponent`.
- Ensure it stores context of whatever webviews are spatially positioned adjacent to it.
- Connect its chat input directly to the Python WebSocket backend to dispatch Stagehand automation tasks.
