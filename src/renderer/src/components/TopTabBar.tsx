import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { Settings, History, Search, Plus } from 'lucide-react'

export const TopTabBar: React.FC = () => {
    // Only subscribe to the specific parts of the store we need
    const isTopTabBarVisible = useCanvasStore(state => state.isTopTabBarVisible)
    const [updater, setUpdater] = useState(0)

    // Force re-render when store updates specifically for top bar 
    useEffect(() => {
        const unsubscribe = useCanvasStore.subscribe(() => setUpdater(u => u + 1))
        return unsubscribe
    }, [])

    if (!isTopTabBarVisible) return null;

    return (
        <div className="absolute top-4 right-4 h-12 bg-surface/70 backdrop-blur-md rounded-full border border-outline_variant/20 flex items-center px-4 z-50 shadow-md">
            
            <div className="flex items-center gap-2 h-6">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('spawn-tab-center'))}
                  className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest"
                  title="Add Tab / Spawn"
                >
                    <Plus size={18} />
                </button>
                
                <div className="w-[1px] h-4 bg-outline_variant/30 mx-1"></div>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-omni-search'))}
                  className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest"
                  title="Search (Cmd+K)"
                >
                    <Search size={18} />
                </button>
                
                <button
                  onClick={() => {
                      const rect = document.querySelector('.react-flow__pane')?.getBoundingClientRect();
                      if (rect) {
                          // Quick hack: Use the canvas store addTextNode logic with standard middle-screen coordinates
                          // React Flow screenToFlowPosition isn't directly available here, but the canvas has logic to jump to nodes anyway.
                          // A better way is dispatching an event that SpatialCanvas catches to use screenToFlowPosition.
                          window.dispatchEvent(new CustomEvent('spawn-text-node-center'));
                      }
                  }}
                  className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest"
                  title="Add Text Note"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="4 7 4 4 20 4 20 7"></polyline>
                        <line x1="9" y1="20" x2="15" y2="20"></line>
                        <line x1="12" y1="4" x2="12" y2="20"></line>
                    </svg>
                </button>
                
                <div className="w-[1px] h-4 bg-outline_variant/30 mx-1"></div>

                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('spawn-canvases-widget'))}
                  className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest" 
                  title="Workspaces / History"
                >
                    <History size={18} />
                </button>
                
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('spawn-settings-widget'))}
                  className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest" 
                  title="Settings"
                >
                    <Settings size={18} />
                </button>
            </div>

        </div>
    )
}
