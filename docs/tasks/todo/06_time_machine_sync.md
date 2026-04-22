# Implementation Plan: The "Time Machine" Database Sync

## Objective
Migrate the spatial operating system from a volatile "current-state" storage model to an append-only event-driven timeline. This provides indestructible canvas backups, infinite branching undo histories across sessions, and the foundation for visual workspace "playback".

## Phase 1: Database Schema (`dopomogai_spatial`)
Instead of constantly overwriting the JSON state of a workspace, we will store discrete actions. We need to execute the following SQL in Supabase:

### Table: `workspaces`
*The anchor entity for a spatial OS instance.*
- `id` (UUID, Primary Key)
- `name` (String)
- `active_timeline_event_id` (UUID, Foreign Key -> `timeline_events(id)`)
- `created_at` / `updated_at`

### Table: `timeline_events`
*The append-only log of every mutation in the OS.*
- `id` (UUID, Primary Key)
- `workspace_id` (UUID, Foreign Key)
- `parent_event_id` (UUID, Nullable) - Links to previous event to form a tree/branch.
- `event_type` (String) - e.g., `NODE_SPAWN`, `NODE_MOVE`, `NODE_DELETE`, `TEXT_EDIT`, `THEME_CHANGE`.
- `payload` (JSONB) - The exact diff (e.g., `{ id: 'browser_1', position: { x: 500, y: 500 } }`).
- `full_snapshot` (JSONB, Nullable) - Complete dump of the `nodes` and `edges` arrays. We save this every ~50 events to avoid computing history from the beginning of time.
- `created_at` (Timestamp)

## Phase 2: Client-Side Sync Engine (`useCanvasStore.ts`)
We must intercept Zustand mutations and stream them to Supabase without blocking the UI rendering thread.

### 1. The Interceptor & Queue
- Add a new state array `pendingSyncQueue: TimeLineEvent[]`.
- Modify `persistState` or create a wrapper around standard actions: Whenever an action occurs (like `addNode` or `onMoveEnd`), immediately generate a `TimeLineEvent` object.
- Push this object into `pendingSyncQueue`.

### 2. The Debounced Flusher
- Create a `flushSyncQueue()` function.
- Use a `debounce` or `setInterval` (e.g., 1.5 seconds). If `pendingSyncQueue` has items, send a batched `supabase.from('timeline_events').insert(queue)` call.
- On success, clear the local queue and update the `active_timeline_event_id` in the local store.

## Phase 3: Initialization & Playback Loader
When a user opens Dopomogai on a new machine:
1. Fetch the `workspaces` row to find the `active_timeline_event_id`.
2. Trace back the `timeline_events` recursively to find the most recent `full_snapshot`.
3. Apply the initial snapshot to Zustand `nodes` and `edges`.
4. Apply the `payload` diffs iteratively forward until the `active_timeline_event_id` is reached.
5. Render the UI.

## Execution Steps for the Sub-Agent
1. **Supabase Client:** Ensure `src/renderer/src/lib/supabase.ts` is configured and exports the client.
2. **Types:** Define the `TimelineEvent` interface in the store.
3. **Store Modification:** Implement the `pendingSyncQueue` and `flushSyncQueue` logic in `useCanvasStore.ts`.
4. **Action Wiring:** Hook up the interceptors mathematically so nodes ping the queue on drag-stop, spawn, and delete.
5. **Loader:** Implement `loadWorkspaceTimeline(workspaceId)` to handle the initial boot state.