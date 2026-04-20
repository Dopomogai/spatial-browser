---
title: "Debounced Supabase Background Sync"
status: "backlog"
priority: "medium"
iteration: "v1"
created_at: "2026-04-20"
---

# Issue
The spec explicitly warns: "Do NOT fire a Supabase network request on every single X/Y pixel movement." Currently there's no throttled cloud sync — state is either all-local or a full JSONB push.

# Solution
- Implement a debounced sync function (e.g., 2 seconds of inactivity after the last widget movement).
- Batch all dirty widget changes and push a single upsert to `spatial_canvases` or the `spatial_timeline` table.
- Show a subtle "Synced ✓" / "Syncing..." indicator in the TopTabBar or title bar.

# Depends On
- `v1-local-first-persistence.md` (local DB must exist first)
- `relational-database-sync.md` (defines the target schema)

# From Spec
> Technical Appendix §7: "Debounced Cloud Sync — wait 2 seconds after the user stops dragging"
