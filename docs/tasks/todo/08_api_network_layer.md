# Task 08: API Network Layer Wiring (BE Proxy)

## Architecture Context
The Frontend must never talk directly to the Database. To ensure security, enforce Row Level Security, and enable multi-agent timeline orchestration, all local spatial events must route through the Dopomogai Backend API.

## Implementation Steps
1. **Deprecate Direct DB Calls:** Strip out the direct `supabase.from('spatial_timeline').insert()` code currently residing in `useCanvasStore.ts`.
2. **API Wrapper:** Create a generic networking wrapper (using `fetch` or Axios) configured to target the Dopomogai Backend (`api.dopomogai.com`).
3. **Auth Header Injection:** Automatically inject the active JWT (or Visitor Token) into the `Authorization: Bearer` header of every payload.
4. **Queue Flusher Relocation:** Re-route the 1.5-second flush loop to `POST` the serialized timeline queue specifically to the BE `/spatial/sync` endpoint.
