import re

with open('/root/Documents/GitHub/spatial-browser/src/renderer/src/store/useCanvasStore.ts', 'r') as f:
    content = f.read()

content = content.replace('declare const supabase: any;', "import { supabase } from '../lib/supabase'")

replacement = """        // Extract the user UUID somehow or assume anon for tracking
        syncToSupabase(state)
    }
  }, 1000)
}

async function syncToSupabase(state: CanvasStore) {
  if (!state.currentProfileId) return
  
  try {
    // 1. Sync Workspace Base Configuration
    await supabase
      .schema('spatial_os')
      .from('spatial_workspaces')
      .upsert({
        id: state.currentProfileId,
        name: state.profiles.find(p => p.id === state.currentProfileId)?.name || 'Default Profile',
        theme: state.theme,
        viewport_x: state.lastViewport.x,
        viewport_y: state.lastViewport.y,
        viewport_zoom: state.lastViewport.zoom,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      
    // 2. Push widgets
    const currentWidgets = state.nodes.filter(n => n.type === 'browser_widget') as BrowserAppNode[]
    
    if (currentWidgets.length > 0) {
        const widgetPayload = currentWidgets.map(w => ({
            id: w.id,
            workspace_id: state.currentProfileId,
            url: w.data.url,
            title: w.data.title,
            x: w.position.x,
            y: w.position.y,
            width: w.data.w,
            height: w.data.h,
            interaction_state: w.data.interactionState,
            updated_at: new Date().toISOString()
        }))
        
        await supabase.schema('spatial_os').from('spatial_widgets').upsert(widgetPayload, { onConflict: 'id' })
    }
    
    // Timeline Action Recording logic would go here if deltas or view adjustments pass a hysteresis threshold.
    
  } catch (error) {
    console.error('Failed to sync to Supabase SSOT:', error)
  }
}"""

content = content.replace("        // Sync spatial_workspaces...\n    }\n  }, 1000)\n}", replacement)

with open('/root/Documents/GitHub/spatial-browser/src/renderer/src/store/useCanvasStore.ts', 'w') as f:
    f.write(content)
