# Favicons & Sleeping Tabs Architecture
**Issue:** We need architecture to capture web page snapshots, save them, fetch favicons accurately, and transition browser tabs dynamically between "active" and "sleeping" states to minimize RAM.
**Resolution:** Introduce a dedicated task/milestone in V2 or later V1.5 to map `capturePage()` directly to a caching DB or Supabase, manage `did-start-loading` for favicons, and introduce `useCanvasStore.ts` hysteresis logic for when nodes exit the viewport buffer.
