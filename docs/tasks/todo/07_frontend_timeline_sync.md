# Task: Frontend Sync for V2 Database Schema (Time Machine)

## Objective
Wire the local React Flow spatial engine (`useCanvasStore.ts`) to the definitive `spatial_os` Postgres schema. Every UI action must be logged as an append-only event to `spatial_timeline` and the current state representation must upsert to `spatial_widgets`.

## Architecture & Requirements

### 1. Types & State Prep (`src/renderer/src/store/useCanvasStore.ts`)
- Add `currentCanvasId: string` to the store (for now, use a static UUID or 'default-canvas-uuid' until multi-canvas routing is built).
- Add `currentSequence: number` (default 0) to track local chronological order.
- Add `pendingSpatialEvents: any[]` to queue the timeline logs securely before network transmission.

### 2. Action Interceptors (The Event Traps)
Modify the existing store actions to intercept user interactions:
- **Actions to intercept:** `addWidget`, `addTextNode`, `removeWidget`, `duplicateNode`, and `updateWidgetData` (especially on drag stops/resizes).
- **Behavior:** When an action occurs:
  1. Increment `currentSequence`.
  2. Construct a timeline object: 
     `{ canvas_id: currentCanvasId, sequence: currentSequence, action_type: '[ACTION_NAME]', delta_payload: { ... }, is_agent: false }`
  3. Push to `pendingSpatialEvents`.

### 3. The Asynchronous Flusher (`src/renderer/src/App.tsx` or `SpatialCanvas.tsx`)
We must decouple the database network calls from the 60fps React Flow rendering loop.
- Implement a `useEffect` loop running on a `1500ms` interval.
- **Flushing Logic:** If `pendingSpatialEvents.length > 0`:
  1. Splice/copy the queue and clear it from the local Zustand state so it isn't double-sent.
  2. Send the batch to Supabase: `supabase.schema('spatial_os').from('spatial_timeline').insert(batch)`.
  3. *Bonus context:* Ensure the Supabase client handles the `spatial_os` schema correctly.

### 4. Current State Upserts (`spatial_widgets`)
Because the timeline only logs *deltas*, we also need to keep the "present reality" updated so fresh reloads don't have to calculate 10,000 events immediately.
- Inside the same 1500ms flusher, extract the *current* `x, y, width, height, url` of any nodes that were modified in that batch.
- Run an upsert against `spatial_os.spatial_widgets` to keep the SSOT (Single Source of Truth) snapshot fresh.

## Execution Directives
- **Do not hallucinate table names.** Use exactly `spatial_timeline` and `spatial_widgets`.
- **Do not break React Flow performance.** Ensure the queue pushing is O(1) and the flusher runs completely disconnected from `onNodeDrag`.