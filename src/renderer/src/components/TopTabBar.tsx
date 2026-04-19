import React from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { Plus, X } from 'lucide-react'
import { createShapeId, useEditor } from 'tldraw'

export const TopTabBar: React.FC = () => {
    const widgets = useCanvasStore(state => state.widgets)
    const updateWidget = useCanvasStore(state => state.updateWidget)
    const addWidget = useCanvasStore(state => state.addWidget)
    const removeWidget = useCanvasStore(state => state.removeWidget)

    const handleFocus = (id: string) => {
        // Pan the canvas to the widget
        try {
            // Need to pass this through a custom event or store state, as TopTabBar is outside TLDraw context
            window.dispatchEvent(new CustomEvent('pan-to-widget', { detail: { id } }))
        } catch (e) {
            console.error('Failed to dispatch pan event', e)
        }
    }

    const handeDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeWidget(id);
    }

    const handleAdd = () => {
        // Find center of current viewport, but since we are outside the tldraw context here,
        // we just spawn at 0,0 and let the user drag it
        addWidget({ x: 0, y: 0 })
    }

    return (
        <div className="w-full h-10 bg-surface_container_lowest border-b border-white/5 flex items-end px-2 gap-1 overflow-x-auto no-scrollbar">
            {Object.values(widgets).map(w => (
                <div 
                    key={w.id}
                    onClick={() => handleFocus(w.id)}
                    className={`
                        h-8 min-w-[120px] max-w-[200px] flex items-center justify-between px-3 
                        rounded-t-lg border-t border-l border-r border-white/10
                        cursor-pointer transition-colors group
                        ${w.interactionState === 'active' ? 'bg-surface_container_highest' : 'bg-surface_container hover:bg-surface_container_high'}
                    `}
                >
                    <span className="text-xs truncate text-on_surface flex-1 pr-2">
                        {w.title || new URL(w.url).hostname.replace('www.', '') || 'New Tab'}
                    </span>
                    <button 
                        onClick={(e) => handeDelete(e, w.id)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-white/10 p-0.5 rounded transition-opacity"
                    >
                        <X size={12} className="text-on_surface_variant" />
                    </button>
                </div>
            ))}
            <button 
               onClick={handleAdd}
               className="h-8 w-8 flex items-center justify-center rounded-t-lg hover:bg-surface_container transition-colors mb-0 ml-1 text-on_surface_variant"
            >
                <Plus size={16} />
            </button>
        </div>
    )
}
