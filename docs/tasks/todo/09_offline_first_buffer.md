# Task 09: Offline-First Timeline Buffer

## Architecture Context
Protecting the user's spatial history from network drops or API 401/500 errors. By moving the `pendingSpatialEvents` holding pen from ephemeral RAM to persistent disk storage, the OS becomes resilient to offline conditions.

## Implementation Steps
1. **IndexedDB Integration:** Utilize `idb-keyval` (or similar) to capture every spatial event locally the millisecond it occurs, bypassing the volatile Zustand array for queue retention.
2. **Persistent Flusher:** Update the chron-based sync flusher to pull the payload batch directly from IndexedDB.
3. **Graceful Network Handling:** Implement network failure/retry logic: if the API request fails (due to being offline or experiencing an auth anomaly), abort the flush cycle cleanly and retain the IndexedDB queue completely un-mutated until connectivity is restored.
