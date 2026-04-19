import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { Plus, X, Globe, Undo, Redo, LayoutGrid, Settings } from 'lucide-react'

export const TopTabBar: React.FC = () => {
    // Only subscribe to the specific parts of the store we need
    const widgets = useCanvasStore(state => state.widgets)
    const updateWidget = useCanvasStore(state => state.updateWidget)
    const addWidget = useCanvasStore(state => state.addWidget)
    const removeWidget = useCanvasStore(state => state.removeWidget)
    const undo = useCanvasStore(state => state.undo)
    const redo = useCanvasStore(state => state.redo)
    const [updater, setUpdater] = useState(0)

    // Force re-render when store updates specifically for top bar 
    useEffect(() => {
        const unsubscribe = useCanvasStore.subscribe(() => setUpdater(u => u + 1))
        return unsubscribe
    }, [])

    const handleFocus = (id: string, e: React.MouseEvent) => {
        try {
            window.dispatchEvent(new CustomEvent('pan-to-widget', { detail: { id } }))
            updateWidget(id, { interactionState: 'active' })
        } catch (err) {
            console.error('Failed to dispatch pan event', err)
        }
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        removeWidget(id)
    }

    const handleAdd = () => {
        window.dispatchEvent(new CustomEvent('spawn-tab-center'))
    }
    
    // Sort by created to keep tabs stable
    const sortedWidgets = Object.values(widgets)

    return (
        <div className="absolute top-0 left-0 right-0 h-12 bg-surface_container_lowest border-b border-outline_variant/10 flex items-center px-4 z-50 shadow-md">
            
            {/* Left Controls: Settings & Layout Tools */}
            <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/5 h-6">
                <button className="text-on_surface_variant hover:text-white transition-colors" title="Settings (Coming Soon)">
                    <Settings size={16} />
                </button>
                <button className="text-on_surface_variant hover:text-white transition-colors" title="Group Tabs (Coming Soon)">
                    <LayoutGrid size={16} />
                </button>
            </div>

            {/* Middle: Tab List */}
            <div className="flex flex-1 items-end h-full gap-1 overflow-x-auto overflow-y-hidden no-scrollbar pt-2">
                {sortedWidgets.map(w => {
                    let urlDisplay = 'New Tab'
                    try {
                        if (w.url && w.url !== 'about:blank') {
                            urlDisplay = new URL(w.url).hostname.replace('www.', '')
                        }
                    } catch(e) {}
                    
                    const titleDisplay = w.title || urlDisplay

                    return (
                        <div 
                            key={w.id}
                            onClick={(e) => handleFocus(w.id, e)}
                            className={`
                                h-9 min-w-[140px] max-w-[240px] flex items-center justify-between px-3 
                                rounded-t-lg border-t border-l border-r border-outline_variant/10
                                cursor-pointer transition-colors group flex-shrink-0
                                ${w.interactionState === 'active' ? 'bg-surface_container_highest border-t-primary/30 text-primary shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-10' : 'bg-surface hover:bg-surface_container_high text-on_surface_variant z-0'}
                            `}
                        >
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <Globe size={12} className="flex-shrink-0 opacity-70" />
                                <span className="text-xs truncate font-medium">
                                    {titleDisplay}
                                </span>
                            </div>
                        
                            <button 
                                onClick={(e) => handleDelete(e, w.id)}
                                className="opacity-0 group-hover:opacity-100 hover:bg-white/10 p-1 rounded text-on_surface_variant hover:text-white transition-all flex-shrink-0"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>
                    )
                })}
                <button 
                onClick={handleAdd}
                className="h-8 w-8 flex-shrink-0 flex flex-col items-center justify-center rounded-t-lg hover:bg-surface_container transition-colors mb-0 mx-1 text-on_surface_variant hover:text-white"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
            </div>

            {/* Right Controls: Undo / Redo */}
            <div className="flex items-center gap-2 pl-4 ml-4 border-l border-white/5 h-6">
                <button onClick={undo} className="text-on_surface_variant hover:text-white transition-colors" title="Undo Canvas Action">
                    <Undo size={16} />
                </button>
                <button onClick={redo} className="text-on_surface_variant hover:text-white transition-colors" title="Redo Canvas Action">
                    <Redo size={16} />
                </button>
            </div>

        </div>
    )
}
