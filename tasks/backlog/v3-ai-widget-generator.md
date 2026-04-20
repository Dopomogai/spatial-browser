---
title: "V3: AI Widget Generator"
status: "backlog"
priority: "low"
iteration: "v3"
created_at: "2026-04-20"
---

# Objective
Allow users to describe a widget in natural language and have the AI generate the React/JS code on the fly, dropping it onto the canvas as a live, functional mini-app.

# Example
User types: "I need a widget that tracks the live price of Bitcoin and turns red if it drops below $60k."
→ AI writes the React component, renders it inside a sandboxed TLDraw shape, live on the canvas.

# Implementation Details
- The AI Copilot generates a self-contained React component string.
- A `DynamicWidgetShapeUtil` renders the generated code inside a sandboxed `<iframe>` or `eval`-safe container.
- Generated widgets are saved to the local DB so they persist across restarts.
