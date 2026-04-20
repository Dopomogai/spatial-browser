---
title: "V4: Multiplayer Canvas (Real-Time Cursors)"
status: "backlog"
priority: "low"
iteration: "v4"
created_at: "2026-04-20"
---

# Objective
Because the OS lives on a server, multiple employees can log into the same Spatial OS. Add real-time collaborative cursors like Figma.

# Implementation Details
- Leverage TLDraw's built-in multiplayer awareness APIs.
- Use WebSocket presence channels (Supabase Realtime or custom) to broadcast cursor positions.
- Each user gets a labeled, colored cursor visible on the shared canvas.
- Implement conflict resolution for simultaneous widget manipulation.
