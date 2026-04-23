# Task 10: Multiplayer Sync (Supabase Realtime)

## Architecture Context
Achieving true real-time synchronization natively across clients and establishing the foundation for Human-Agent collaboration. 
Instead of building custom SSE streams on the `dopomogai-be-monorepo` to broadcast window coordinates, we will leverage Supabase's native PostgreSQL Realtime Websocket subscriptions. 

**The Data Flow:**
1. Browser moves a tab -> `POST api.dopomogai.com/spatial/sync` (The SSOT API).
2. `be-monorepo` validates Auth and inserts the row into Postgres `spatial_timeline`.
3. Supabase Realtime detects the `INSERT` and instantly broadcasts the payload over WebSockets to all subscribed Browsers in that Workspace.
4. If an AI Agent (via `ultimate-widget`) decides to move a tab, it hits the same SSOT API, and the Browser receives the update seamlessly.

## Implementation Steps
1. **Initialize Channel:** In `useCanvasStore.ts` (or a dedicated sync hook), initialize a `supabase.channel('public:spatial_timeline')` subscription when the workspace loads.
2. **Listen for Inserts:** Bind to the `postgres_changes` event for `INSERT` operations on the `spatial_timeline` table.
3. **Filter Echoes:** When an event arrives, check if its `actor_id` matches the current local user/visitor ID. If it does, ignore it (we already optimistically rendered it). 
4. **State Reconciliation:** If it's a new event from an Agent or another user, dispatch the exact Zustand action (e.g., `setNodes`) to reflect the change visually on the canvas.
