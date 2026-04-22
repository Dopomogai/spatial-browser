import psycopg2
import sys

DB_URL = "postgresql://postgres:fofJrc9wR4SM-JTXk1YRG8ElelSZGAJhwEklcEABlvZUOjZf9u09wXhIBzIFxJ6T@supa.dopomogai.com:5432/postgres"

MIGRATION_SQL = """
-- 1. Create the dedicated schema boundary for the OS
CREATE SCHEMA IF NOT EXISTS spatial_os;

-- 2. Workspaces (The Billing/Tenant Anchor)
CREATE TABLE IF NOT EXISTS spatial_os.spatial_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL, 
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
    viewport_state JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
    last_timeline_sequence BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_spatial_workspace FOREIGN KEY (spatial_workspace_id) REFERENCES spatial_os.spatial_workspaces(id) ON DELETE CASCADE
);

-- 4. Widgets (The Glass: Browsers, Notes, Terminals)
CREATE TABLE IF NOT EXISTS spatial_os.spatial_widgets (
    id TEXT PRIMARY KEY,
    canvas_id UUID NOT NULL,
    widget_type TEXT NOT NULL, 
    url TEXT, 
    title TEXT,
    interaction_state TEXT DEFAULT 'active',
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    width FLOAT NOT NULL DEFAULT 400,
    height FLOAT NOT NULL DEFAULT 300,
    snapshot_url TEXT, 
    deleted_at TIMESTAMPTZ, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_canvas_widget FOREIGN KEY (canvas_id) REFERENCES spatial_os.spatial_canvases(id) ON DELETE CASCADE
);

-- 5. Time Machine Log (The Append-Only Sequence)
CREATE TABLE IF NOT EXISTS spatial_os.spatial_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID NOT NULL,
    sequence BIGINT NOT NULL, 
    action_type TEXT NOT NULL, 
    delta_payload JSONB NOT NULL, 
    actor_id UUID, 
    is_agent BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_canvas_timeline FOREIGN KEY (canvas_id) REFERENCES spatial_os.spatial_canvases(id) ON DELETE CASCADE,
    UNIQUE(canvas_id, sequence) 
);

ALTER TABLE spatial_os.spatial_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_os.spatial_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_os.spatial_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_os.spatial_timeline ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA spatial_os TO authenticated;
GRANT USAGE ON SCHEMA spatial_os TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA spatial_os TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA spatial_os TO service_role;
"""

try:
    print(f"Connecting to {DB_URL.split('@')[-1]}...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()
    print("Executing V2 Migration Script to build spatial_os namespace...")
    cur.execute(MIGRATION_SQL)
    print("SUCCESS: V2 `spatial_os` schema applied to supa.dopomogai.com.")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Migration Failed: {e}")
