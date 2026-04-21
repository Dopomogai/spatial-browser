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
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      
    // 2. Push widgets
    const currentWidgets = state.nodes.filter(n => n.type === 'browser_widget') as BrowserAppNode[]
    
    if (currentWidgets.length > 0) {
        const widgetPayload = currentWidgets.map(w => ({
            id: w.id, // String IDs supported if schema altered or backend coerces
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
        
        // 3. Action Timeline
        // Record actions if physically moved outside view bounds (hysteresis logic)
        const vZoom = state.lastViewport.zoom || 1;
        const viewMinX = -state.lastViewport.x / vZoom;
        const viewMinY = -state.lastViewport.y / vZoom;
        const viewMaxX = viewMinX + window.innerWidth / vZoom;
        const viewMaxY = viewMinY + window.innerHeight / vZoom;
        
        const timelinePayload = [];
        
        for (const w of currentWidgets) {
            // Very simple out of bounds logic just for demonstration 
            const isOutside = w.position.x < viewMinX || w.position.y < viewMinY || w.position.x > viewMaxX || w.position.y > viewMaxY;
            if (isOutside) {
                 timelinePayload.push({
                     spatial_workspace_id: state.currentProfileId,
                     widget_id: w.id,
                     action_type: 'widget_moved_out_of_bounds',
                     new_state: { x: w.position.x, y: w.position.y, url: w.data.url },
                     timestamp: new Date().toISOString()
                 });
            }
        }
        
        if (timelinePayload.length > 0) {
            await supabase.schema('spatial_os').from('spatial_timeline').insert(timelinePayload)
        }
    }
  } catch (error) {
    console.error('Failed to sync to Supabase SSOT:', error)
  }
}
"""

content = re.sub(r'async function syncToSupabase[\s\S]*?}\n}', replacement.strip() + "\n", content)

with open('/root/Documents/GitHub/spatial-browser/src/renderer/src/store/useCanvasStore.ts', 'w') as f:
    f.write(content)
