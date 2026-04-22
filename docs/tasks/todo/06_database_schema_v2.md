# Task: Establish Core V2 Spatial Database Schema (Open-Source Ready)

## Context
Dopomogai OS requires a dedicated `spatial_os` namespace rather than cramming generic React Flow state blobs into public schemas. This plan merges the sequence-based `spatial_timeline` (Time Machine) we established on April 19th with the performance-critical rendering demands (snapshot/URL persistence) we discovered building V1.5 today.

## Goal
Provide a complete, copy-pasteable SQL schema that provisions the backend for both our deployed droplet and open-source self-hosters. This schema perfectly isolates workspaces, canvases, persistent OS widgets (tabs/notes), and the un-editable timeline log for V2 agent-handoff and undo/redo mechanics.

## The Definitive Migration Script 

```sql
-- 1. Create the dedicated schema boundary for the OS
CREATE SCHEMA IF NOT EXISTS spatial_os;

-- 2. Workspaces (The Billing/Tenant Anchor)
CREATE TABLE IF NOT EXISTS spatial_os.spatial_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL, -- Links to generic public.workspaces (if applicable)
    profile_name TEXT NOT NULL DEFAULT 'Default Profile',
    theme_engine_state JSONB DEFAULT '{"theme": "dark", "showCanvasGrid": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Canvases (The Infinite Grids)
CREATE TABLE IF NOT EXISTS spatial_os.spatial_canvases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spatial_workspace_id UUID NOT NULL,
    name TEXT NOT NULL DEFAULT 'Untitled Canvas',
    viewport_state JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb, -- Debounced camera persistence
    last_timeline_sequence BIGINT DEFAULT 0, -- The head of the time machine
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_spatial_workspace FOREIGN KEY (spatial_workspace_id) REFERENCES spatial_os.spatial_workspaces(id) ON DELETE CASCADE
);

-- 4. Widgets (The Glass: Browsers, Notes, Terminals)
-- We no longer store generic "JSON blobs" in the canvas. The canvas state is defined by querying its widgets.
CREATE TABLE IF NOT EXISTS spatial_os.spatial_widgets (
    id TEXT PRIMARY KEY, -- Using TEXT because React Flow generates string IDs (e.g., 'browser_widget_123')
    canvas_id UUID NOT NULL,
    widget_type TEXT NOT NULL, -- 'browser_widget', 'text_node', etc.
    url TEXT, -- Null for notes/terminals. Critical for waking up sleeping tabs.
    title TEXT,
    interaction_state TEXT DEFAULT 'active', -- 'active', 'sleeping', 'minimized'
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    width FLOAT NOT NULL DEFAULT 400,
    height FLOAT NOT NULL DEFAULT 300,
    snapshot_url TEXT, -- Raw Base64 or Bucket URL for the Hot/Warm/Cold render culling engine
    deleted_at TIMESTAMPTZ, -- Soft delete required for Undo/Redo recovery
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_canvas_widget FOREIGN KEY (canvas_id) REFERENCES spatial_os.spatial_canvases(id) ON DELETE CASCADE
);

-- 5. Time Machine Log (The Append-Only Sequence)
CREATE TABLE IF NOT EXISTS spatial_os.spatial_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID NOT NULL,
    sequence BIGINT NOT NULL, -- The chronological order of the universe
    action_type TEXT NOT NULL, -- 'WIDGET_SPAWN', 'WIDGET_MOVE', 'WIDGET_DELETE', 'AGENT_CLICK'
    delta_payload JSONB NOT NULL, -- The exact mathematical/data change
    actor_id UUID, -- auth.users.id
    is_agent BOOLEAN DEFAULT FALSE, -- Crucial for V2: "Did the human or the AI move this tab?"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_canvas_timeline FOREIGN KEY (canvas_id) REFERENCES spatial_os.spatial_canvases(id) ON DELETE CASCADE,
    UNIQUE(canvas_id, sequence) -- Guarantees perfect chronological integrity per canvas
);

-- Basic RLS and Grants (Open-Source Ready defaults)
ALTER TABLE spatial_os.spatial_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_os.spatial_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_os.spatial_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_os.spatial_timeline ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA spatial_os TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA spatial_os TO authenticated, service_role;
```