---
title: "Relational Database Sync"
status: "backlog"
priority: "high"
created_at: "2026-04-20"
---

# Objective
Migrate `useCanvasStore.ts` from exporting full monolithic JSONB payloads for state sync to a granular event-driven pipeline written incrementally to the `spatial_timeline` table.

# Implementation Details
- Update the Zustand store to dispatch single-action events (e.g., `tab_moved`, `tab_opened`, `url_changed`).
- Sync these events to the Supabase backend in the `spatial_os` schema using the timeline table.
- Rebuild local state incrementally from the timeline when initializing a workspace to allow for robust rollback and Time Machine functionality.
