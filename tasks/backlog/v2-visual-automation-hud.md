---
title: "V2: Visual Automation HUD (Ghost Cursor)"
status: "backlog"
priority: "medium"
created_at: "2026-04-20"
---

# Objective
Build the client-side visuals for the automation experience to build user trust, rendering exactly what the AI is analyzing and manipulating.

# Implementation Details
- Add an overlay layer in `BrowserWidgetComponent` capable of receiving Stagehand bounding boxes and highlighting them (Terminator HUD effect).
- Render a visually distinct secondary cursor (e.g., glowing purple) on the TLDraw canvas mapped to the backend automation coordinates.
- Implement the "Thought Bubble" notification system anchored to the Ghost Cursor to display the AI's internal monologue in real-time.
