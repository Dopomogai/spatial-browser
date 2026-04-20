---
title: "Local-First Database Persistence (IndexedDB / better-sqlite3)"
status: "backlog"
priority: "high"
iteration: "v1"
created_at: "2026-04-20"
---

# Issue
Currently `useCanvasStore` saves state to `localStorage` which has a ~5MB cap and can silently corrupt with large base64 screenshots. The spec calls for a proper local-first database for instant boot times before any network sync.

# Solution
- Integrate `better-sqlite3` (via the main process) or IndexedDB (in renderer) as the primary persistence layer.
- On every `updateWidget` call, write immediately to the local DB. React updates instantly with zero network dependency.
- On app boot, read the local DB and reconstruct the TLDraw canvas before Supabase even connects.
- This local DB becomes the single source of truth; Supabase is a background mirror.

# From Spec
> Feature 4: Local-First State Persistence
> Technical Appendix §7: "Local First — write immediately to local DB"
