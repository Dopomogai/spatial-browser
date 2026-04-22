# Task: Wire Authentication and Supabase Schema Access

## Current State & Issues
1. **The 406 Error:** The frontend is throwing a `406 Not Acceptable` when trying to talk to the backend.
2. **Missing Schema Config:** We created the `spatial_os` postgres schema, but the Supabase Javascript client defaults to the `public` schema. If we don't explicitly pass `{ schema: 'spatial_os' }` in our queries, or configure the client globally, it will fail to find the tables.
3. **No Auth / RLS Blocking:** We enabled Row Level Security (RLS) on all `spatial_os` tables, meaning unauthenticated requests are silently rejected or return empty arrays. We have no login screen or session token handling.

## Forward Architecture Plan (CTO View)

### Step 1: Global Supabase Client Configuration
In `src/renderer/src/lib/supabase.ts`, we must configure the singleton client to default to the new schema:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'spatial_os'
  }
})
```

### Step 2: Temporary Auth Bypass for V1.5 Testing
Since we don't have a login UI yet, we need to bypass the RLS policies so we can actually see the Timeline sync working locally. 
We will execute a SQL script on the droplet to temporarily disable RLS on the `spatial_os` tables until the Auth UI is built.

### Step 3: Implement Headless Local Auth (Phase 2 Prep)
We don't want a heavy login screen every time you open the OS.
We need to implement an "Auto-Login" or "Machine Key" system in `App.tsx`:
- On boot, check if a Supabase session exists.
- If not, auto-authenticate using a pre-defined development email/password stored in `import.meta.env` or local storage to instantly grant a valid JWT.
