---
title: "V3: Native Custom Widgets (Mini-Apps)"
status: "backlog"
priority: "medium"
iteration: "v3"
created_at: "2026-04-20"
---

# Objective
A true OS doesn't just run web browsers — it runs native apps. Build lightweight, custom mini-apps that live on the canvas alongside the browser widgets.

# Planned Widgets
- Sticky Notes
- Local Calculator
- Kanban Board
- Pomodoro Timer
- Media Player

# Implementation Details
- Each widget gets its own `ShapeUtil` + React component, sharing the same lifecycle patterns as `BrowserWidgetShapeUtil`.
- Widgets store their state in Zustand alongside browser widgets.
- Must support drag, resize, minimize (pill), and sleep states just like browser widgets.
