import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { Plus, X, Globe } from 'lucide-react'

export const TopTabBar: React.FC = () => {
    const widgets = useCanvasStore(state => state.widgets)
    const updateWidget = useCanvasStore(state => state.updateWidget)
    const addWidget = useCanvasStore(state => state.addWidget)
    const removeWidget = useCanvasStore(state => state.removeWidget)
    const [updater, setUpdater] = useState(0)

    // Force re-render when store updates specifically for top bar 
    useEffect(() => {
        const unsubscribe = useCanvasStore.subscribe(() => setUpdater(u => u + 1))
        return unsubscribe
    }, [])

    const handleFocus = (id: string, e: React.MouseEvent) => {
        // Find center of current viewport, but since we are outside the tldraw context here,
        // we emit an event that SpatialCanvas can listen to
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
    
    // Convert to array and sort by created to keep tabs stable
    const sortedWidgets = Object.values(widgets)

    return (
        <div className="w-full h-10 bg-surface_container_lowest border-b border-outline_variant/10 flex items-end px-2 pt-2 gap-1 overflow-x-auto overflow-y-hidden no-scrollbar z-50 shadow-md">
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
                            h-8 min-w-[120px] max-w-[240px] flex items-center justify-between px-3 
                            rounded-t-lg border-t border-l border-r border-outline_variant/10
                            cursor-pointer transition-colors group flex-shrink-0
                            ${w.interactionState === 'active' ? 'bg-surface_container_highest border-t-primary/30 text-primary' : 'bg-surface hover:bg-surface_container_high text-on_surface_variant'}
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
                            className="opacity-0 group-hover:opacity-100 hover:bg-white/10 p-0.5 rounded text-on_surface_variant transition-opacity flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )
            })}
            <button 
               onClick={handleAdd}
               className="h-8 w-8 flex-shrink-0 flex flex-col items-center justify-center rounded-t-lg hover:bg-surface_container transition-colors mb-0 text-on_surface_variant"
            >
                <Plus size={16} />
            </button>
        </div>
    )
}
