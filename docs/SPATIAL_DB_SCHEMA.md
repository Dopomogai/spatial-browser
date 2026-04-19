# Dopomogai OS: Spatial Browser Schema (V1/V2)

## Goal
A dedicated database schema strictly for the Spatial Browser and Gamified Desktop Layer. 

We are not jamming generic `state_json` blobs into CRM tables. We need a purpose-built architectural foundation that records the exact X/Y coordinates of tabs, their screenshot snapshots, time-based canvas history, and their link to specific dopomogai agent sessions for the V2 Handoff.

## Table Architecture

### Schema: `spatial_os`

#### `spatial_workspaces`
**Purpose:** Defines a physical overarching infinite canvas.
- `id` (uuid, pk)
- `workspace_id` (uuid, fk -> public.workspaces.id) // Links this canvas to a broader Dopomogai billing/CRM workspace
- `profile_id` (text) // Maps directly to `currentProfileId` from Zustand
- `name` (text) // "Agent Ideation Canvas", "Marketing Dashboard"
- `created_by` (uuid, fk -> auth.users.id)
- `created_at` (timestampz)
- `updated_at` (timestampz)

#### `spatial_widgets`
**Purpose:** The physical objects (tabs, browsers, sticky notes, tools) dropped onto the canvas.
- `id` (uuid, pk) // The TLDraw shape ID (`browser_widget_123512`)
- `spatial_workspace_id` (uuid, fk -> spatial_workspaces.id)
- `widget_type` (text) // e.g. "browser_widget", "note_widget", "app_widget"
- `url` (text, nullable) // e.g. "https://github.com", null if sticky note
- `title` (text)
- `interaction_state` (enum: 'active', 'sleeping', 'minimized')
- `x` (float)
- `y` (float)
- `width` (float)
- `height` (float)
- `created_at` (timestampz)
- `updated_at` (timestampz)
- `last_active_at` (timestampz)

#### `spatial_snapshots` (The "Photographic Memory" Log)
**Purpose:** This stores the heavy Base64 (or ideally, bucket-stored S3 URLs) of slept tabs. 
- `id` (uuid, pk)
- `widget_id` (uuid, fk -> spatial_widgets.id)
- `captured_at` (timestampz)
- `snapshot_url` (text) // A link to the Supabase Storage Bucket item, rather than pure Base64 in db
- `is_current` (boolean) // True if this is the active sleeping image

#### `spatial_timeline` (The Time Machine)
**Purpose:** An append-only log storing every action performed on a widget (moved, opened, closed, scraped). Allows the user to "rewind" the canvas to standard points in time.
- `id` (uuid, pk)
- `spatial_workspace_id` (uuid, fk)
- `widget_id` (uuid, fk)
- `agent_id` (uuid, fk -> public.agents.id, nullable) // Null if user took the action, populated if Agent drove the mouse
- `action_type` (text) // "widget_created", "widget_moved", "widget_navigated", "agent_scraped", "agent_clicked"
- `old_state` (jsonb)
- `new_state` (jsonb)
- `timestamp` (timestampz)

## Migration Strategy
1. Create the `spatial_os` schema in `supa.dopomogai.com`.
2. Write Postgres Row-Level Security (RLS) policies ensuring `auth.uid()` matches `spatial_workspaces.created_by`.
3. In Electron (`useCanvasStore.ts`), replace the `state_json` monolith heartbeat with precise `pg` table mutations via `@supabase/supabase-js`.
