# Local Cache and Password Management
**Issue:** No persistent cache or password manager currently controls logged-in states across webviews (persisted partitions are isolated per tab/schema).
**Resolution:** Introduce a dedicated task/milestone in V2 to integrate a secure store (`safeStorage` API in Electron) to manage logins, sync persistence schemas with `partition`, and implement a unified UI for local cache/cookie operations.
