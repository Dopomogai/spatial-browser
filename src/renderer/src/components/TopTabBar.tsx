import React, { useEffect, useState } from 'react'
import { useCanvasStore } from '../store/useCanvasStore'
import { Plus, X, Globe, Undo, Redo, LayoutGrid, Settings } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

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
    
    // Sort by created to keep tabs stable. We'll use order prop if it exists, otherwise fallback to object keys.
    const [sortedWidgets, setSortedWidgets] = useState(Object.values(widgets));
    
    useEffect(() => {
        const ws = Object.values(widgets);
        // Simple stable sort based on an implied order index, falling back to ID to keep it stable
        ws.sort((a,b) => (a.order || 0) - (b.order || 0));
        setSortedWidgets(ws);
    }, [widgets]);

    const onDragEnd = (result: any) => {
        if (!result.destination) return;
        const items = Array.from(sortedWidgets);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setSortedWidgets(items);
        // We could also loop and update the `order` property in Zustand here for persistence
    };

    return (
        <div className="absolute top-0 left-0 right-0 h-12 bg-surface_container_lowest border-b border-outline_variant/10 flex items-center px-4 z-50 shadow-md">
            
            {/* Left Controls: Settings & Layout Tools */}
        <div className="flex items-center gap-2 pr-4 mr-4 border-r border-white/5 h-6">
                
                {/* Profile Selector (Integrated from hidden panel) */}
                <select 
                   value={useCanvasStore(state => state.currentProfileId)} 
                   onChange={(e) => useCanvasStore.getState().loadProfile(e.target.value)}
                   className="bg-transparent text-xs font-semibold text-on_surface_variant hover:text-white transition-colors cursor-pointer outline-none appearance-none pr-4"
                   title="Switch Canvas Profile"
                   style={{
                       backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                       backgroundRepeat: "no-repeat",
                       backgroundPosition: "right 0 top 50%",
                       backgroundSize: "8px auto"
                   }}
                >
                    {useCanvasStore(state => state.profiles).map(p => (
                        <option key={p.id} value={p.id} className="bg-surface_container_highest">{p.name || 'Untitled Canvas'}</option>
                    ))}
                </select>

                <button 
                  onClick={() => {
                    // Use a custom modal state/event instead of blocking prompt() in renderer
                    window.dispatchEvent(new CustomEvent('open-new-profile-modal'))
                  }}
                  className="text-on_surface_variant hover:text-white transition-colors ml-2" 
                  title="Save Canvas As New Profile"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Middle: Tab List with Drag and Drop */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tabs" direction="horizontal">
                    {(provided: any) => (
                        <div 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex flex-1 items-end h-full gap-1 overflow-x-auto overflow-y-hidden no-scrollbar pt-2"
                        >
                            {sortedWidgets.map((w, index) => {
                                let urlDisplay = 'New Tab'
                                try {
                                    if (w.url && w.url !== 'about:blank') {
                                        urlDisplay = new URL(w.url).hostname.replace('www.', '')
                                    }
                                } catch(e) {}
                                
                                const titleDisplay = w.title || urlDisplay

                                return (
                                    <Draggable key={w.id} draggableId={w.id} index={index}>
                                        {(provided: any, snapshot: any) => (
                                            <div 
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                onClick={(e) => handleFocus(w.id, e)}
                                                className={`
                                                    h-9 min-w-[140px] max-w-[240px] flex items-center justify-between px-3 
                                                    rounded-t-lg border-t border-l border-r border-outline_variant/10
                                                    cursor-pointer transition-colors group flex-shrink-0
                                                    ${w.interactionState === 'active' ? 'bg-surface_container_highest border-t-primary/30 text-primary shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-10' : 'bg-surface hover:bg-surface_container_high text-on_surface_variant z-0'}
                                                    ${snapshot.isDragging ? 'shadow-2xl opacity-90 z-50 ring-2 ring-primary scale-105' : ''}
                                                `}
                                                style={provided.draggableProps.style}
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
                                        )}
                                    </Draggable>
                                )
                            })}
                            {provided.placeholder}
                            <button 
                                onClick={handleAdd}
                                className="h-8 w-8 flex-shrink-0 flex flex-col items-center justify-center rounded-t-lg hover:bg-surface_container transition-colors mb-0 mx-1 text-on_surface_variant hover:text-white"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

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
