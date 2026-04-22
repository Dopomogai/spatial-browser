import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { Settings, History, Search, Plus, Undo, Redo } from 'lucide-react'

export const TopTabBar: React.FC = () => {
    // Only subscribe to the specific parts of the store we need
    const isMinimalHeader = useCanvasStore(state => state.isMinimalHeader)
    const toggleHeaderMode = useCanvasStore(state => state.toggleHeaderMode)
    const undo = useCanvasStore(state => state.undo)
    const redo = useCanvasStore(state => state.redo)
    const undoStack = useCanvasStore(state => state.undoStack)
    const redoStack = useCanvasStore(state => state.redoStack)
    const [updater, setUpdater] = useState(0)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // Force re-render when store updates specifically for top bar 
    useEffect(() => {
        const unsubscribe = useCanvasStore.subscribe(() => setUpdater(u => u + 1))
        return unsubscribe
    }, [])

    return (
        <div className={`absolute top-4 right-4 bg-surface/70 backdrop-blur-md rounded-full border border-outline_variant/20 flex items-center px-4 z-50 shadow-md no-drag-region transition-all overflow-hidden ${isMinimalHeader ? 'w-12 h-12 justify-center px-0' : 'h-12 w-auto'}`}
            onPointerDown={(e) => { e.stopPropagation(); }}>
            
            <div className={`flex items-center gap-2 h-6 ${isMinimalHeader ? 'hidden' : 'opacity-100'}`}>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('spawn-tab-center'))}
                  className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest"
                  title="Add Tab / Spawn"
                >
                    <Plus size={18} />
                </button>
                
                <div className="w-[1px] h-4 bg-outline_variant/30 mx-1"></div>

                <button
                    onClick={() => undo()}
                    disabled={undoStack.length === 0}
                    className={`text-on_surface_variant transition-colors p-2 rounded-full ${undoStack.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white hover:bg-surface_container_highest'}`}
                    title="Undo (Cmd+Z)"
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={() => redo()}
                    disabled={redoStack.length === 0}
                    className={`text-on_surface_variant transition-colors p-2 rounded-full ${redoStack.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white hover:bg-surface_container_highest'}`}
                    title="Redo (Cmd+Shift+Z)"
                >
                    <Redo size={18} />
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

                <div className="w-[1px] h-4 bg-outline_variant/30 mx-1"></div>
            </div>

            <button
                onClick={toggleHeaderMode}
                className="text-on_surface_variant hover:text-white transition-colors p-2 rounded-full hover:bg-surface_container_highest"
                title={isMinimalHeader ? "Expand Top Bar" : "Minimize Top Bar"}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`transform transition-transform ${isMinimalHeader ? 'rotate-180' : ''}`}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
    )
}
