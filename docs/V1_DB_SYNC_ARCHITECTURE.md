# V1 -> V2 Database Synchronization Architecture

## Current State (V1 MVP)
Currently, the Spatial Browser uses a brute-force JSONB heartbeat. 
In `useCanvasStore.ts`, the `persistState` function runs every 1000ms. It dumps the entire Zustand state (including all widgets, their coordinates, and their base64 screenshots) into the `state_json` column of the `spatial_workspaces` table.

**Problems with V1 State:**
1. **Opaque History:** We overwrite the current state. We cannot rewind, undo, or replay an agent's actions across multiple sessions.
2. **Payload Size:** Shoving Base64 strings into a high-frequency JSONB column will bloat the database and cause severe performance degradation on load.
3. **Ghost Agent Incompatibility:** V2 requires the AI "Ghost Cursor" to independently read and write to specific tabs database-side. A single JSON monolith creates massive race conditions between the Human client and the Agent backend.

---

## Future State (V2 Time Machine)

To support the V2 "Photographic Memory" and "Multiplayer Canvas", we are migrating from the JSONB monolith to an event-driven, relational architecture natively inside `useCanvasStore.ts`.

### 1. Initialization (App Load)
When the React App mounts and calls `loadInitialState()`:
1. It requests the `spatial_workspace` base configuration (theme, grid settings).
2. It queries all `spatial_widgets` belonging to that workspace to reconstruct the canvas tabs.
3. *Crucially:* It does NOT pull Base64 images directly from Postgres. The DB only holds `snapshot_url` references to Supabase Storage.

### 2. Action Logging (The Undo/Redo Engine)
Every time a user (or AI Ghost) moves a tab, opens a URL, or closes a widget:
1. Zustand updates the local UI immediately (Optimistic UI).
2. Instead of saving the whole canvas, the discrete action is sent via an RPC/Edge function to `spatial_timeline`.
   - `action_type: "WIDGET_MOVED"`
   - `delta_payload: { x: 400, y: 500 }`
3. This append-only log becomes the absolute source of truth for the `Undo` and `Redo` buttons in the Top Tab Bar.

### 3. The Screenshot Pipeline (Background Cron alternative)
Since we disabled the hourly cron job, screenshots are handled purely via React lifecycle hooks:
1. When a tab state changes from `active` -> `sleeping`, `capturePage()` runs in Electron.
2. The Base64 string is uploaded asynchronously to a Supabase S3 Bucket.
3. The resulting URL is patched to the `spatial_widgets` row via `updateWidget()`.

## Implementation Path
We will build this in three distinct PRs:
1. **PR 1 (Storage):** Wire `useCanvasStore` to upload sleeping Base64 blobs to Supabase Storage and strip them out of the `state_json` monolith.
2. **PR 2 (Relational Mapping):** Route widget creation/deletion explicitly to the `spatial_widgets` table, breaking the JSONB monolith.
3. **PR 3 (Time Machine):** Route all `Undo/Redo` stack arrays natively into the `spatial_timeline` append-only log.
