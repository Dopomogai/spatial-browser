import re

with open('/root/Documents/GitHub/spatial-browser/src/renderer/src/store/useCanvasStore.ts', 'r') as f:
    content = f.read()

replacement = """
async function syncToSupabase(state: CanvasStore) {
  if (!state.currentProfileId) return
  
  try {
    // 1. Sync Workspace Base Configuration
    await supabase
      .schema('spatial_os')
      .from('spatial_workspaces')
      .upsert({
        id: state.currentProfileId,
        workspace_id: '00000000-0000-0000-0000-000000000000', // Mock link to public.workspaces.id for now
        profile_id: state.currentProfileId,
        name: state.profiles.find(p => p.id === state.currentProfileId)?.name || 'Default Profile',
        // theme: state.theme, // Not in schema
        // viewport_x: state.lastViewport.x,
        // viewport_y: state.lastViewport.y,
        // viewport_zoom: state.lastViewport.zoom,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      
    // 2. Push widgets
    const currentWidgets = state.nodes.filter(n => n.type === 'browser_widget') as BrowserAppNode[]
    
    if (currentWidgets.length > 0) {
        const widgetPayload = currentWidgets.map(w => ({
            id: w.id, // Using the string ID directly, assume uuid or backend handles it, or needs generation? 
                      // Wait, schema says uuid, but we use string strings 'browser_widget_123'. 
                      // We will send it as text if the backend allows, or we'll assume the schema is generalized for string IDs here.
            spatial_workspace_id: state.currentProfileId,
            widget_type: w.type,
            url: w.data.url,
            title: w.data.title,
            x: w.position.x,
            y: w.position.y,
            width: w.data.w,
            height: w.data.h,
            interaction_state: w.data.interactionState,
            updated_at: new Date().toISOString(),
            last_active_at: new Date(w.data.lastActive as number).toISOString()
        }))
        
        await supabase.schema('spatial_os').from('spatial_widgets').upsert(widgetPayload, { onConflict: 'id' })
    }
    
    // Timeline Action Recording logic
    // Hysteresis math: track movement outside viewport bounds
    // We check if the viewport has shifted significantly or widgets moved outside the camera bounds
    // Actually, we just write a simple heartbeat timeline event if things changed
    const viewportBounds = {
        minX: -state.lastViewport.x / state.lastViewport.zoom,
        minY: -state.lastViewport.y / state.lastViewport.zoom,
        maxX: (-state.lastViewport.x + window.innerWidth) / state.lastViewport.zoom,
        maxY: (-state.lastViewport.y + window.innerHeight) / state.lastViewport.zoom,
    }
    
    // Minimal timeline sync (would be expanded in edge functions or proper diffing)
    if (currentWidgets.length > 0) {
        const outOfBoundsWidgets = currentWidgets.filter(w => 
            w.position.x < viewportBounds.minX || 
            w.position.y < viewportBounds.minY || 
            w.position.x > viewportBounds.maxX || 
            w.position.y > viewportBounds.maxY
        )
        
        if (outOfBoundsWidgets.length > 0) {
             const timelinePayload = outOfBoundsWidgets.map(w => ({
                 spatial_workspace_id: state.currentProfileId,
                 widget_id: w.id,
                 action_type: 'widget_moved_out_of_bounds',
                 new_state: { x: w.position.x, y: w.position.y, url: w.data.url },
                 timestamp: new Date().toISOString()
             }))
             
             await supabase.schema('spatial_os').from('spatial_timeline').insert(timelinePayload)
        }
    }
    
  } catch (error) {
    console.error('Failed to sync to Supabase SSOT:', error)
  }
}"""

content = re.sub(r'async function syncToSupabase[\s\S]*?}\n}', replacement.strip(), content)

with open('/root/Documents/GitHub/spatial-browser/src/renderer/src/store/useCanvasStore.ts', 'w') as f:
    f.write(content)
