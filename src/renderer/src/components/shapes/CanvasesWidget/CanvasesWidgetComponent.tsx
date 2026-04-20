import React, { useState } from 'react'
import { BaseBoxShapeUtil, HTMLContainer } from 'tldraw'
import { Database, Plus, Search, FolderClosed, LayoutGrid } from 'lucide-react'

export const CanvasesWidgetComponent: React.FC<{ shape: any }> = ({ shape }) => {
  const [search, setSearch] = useState('')

  const mockedCanvases = [
    { id: '1', name: 'Dopomogai Home Base', tags: ['Planning', 'Phase 1'], date: '2 hrs ago' },
    { id: '2', name: 'Agent Ideation', tags: ['Brainstorming'], date: 'yesterday' },
    { id: '3', name: 'API Integrations', tags: ['Backend', 'Technical'], date: '3 days ago' },
    { id: '4', name: 'Supabase Architecture', tags: ['DB', 'Design'], date: 'last week' },
  ]

  const filtered = mockedCanvases.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <HTMLContainer
      id={shape.id}
      className="w-full h-full rounded-[16px] overflow-hidden flex flex-col pointer-events-auto"
      style={{
        backgroundColor: 'rgba(42, 42, 44, 0.7)', // surface-container-high
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
        // @ts-ignore - Electron specific
        WebkitAppRegion: 'no-drag'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
      >
        <div className="flex items-center space-x-2">
          <Database size={18} className="text-primary" />
          <span className="text-white font-medium text-sm">Workspace Canvases</span>
        </div>
        <button className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/40 transition-colors">
          {Plus ? <Plus size={16} /> : '+'}
        </button>
      </div>

      {/* Search & Actions */}
      <div className="p-3">
        <div className="flex items-center bg-surface_container_lowest rounded-lg border border-white/5 py-2 px-3">
          <Search size={14} className="text-on_surface_variant mr-2" />
          <input 
            type="text"
            placeholder="Search workspaces..."
            className="bg-transparent border-none outline-none text-white text-xs w-full font-sans"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Canvas List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 no-scrollbar" onPointerDown={(e) => e.stopPropagation()}>
        {filtered.map(canvas => (
          <div 
            key={canvas.id}
            className="flex items-center justify-between p-3 rounded-xl bg-surface_container_lowest border border-white/5 hover:bg-surface_container_highest hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center">
                 <LayoutGrid size={16} className="text-white/60 group-hover:text-primary transition-colors" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium">{canvas.name}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-on_surface_variant text-[10px]">{canvas.date}</span>
                  {canvas.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-on_surface text-[9px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full opacity-50">
            <FolderClosed className="mb-2" size={24} />
            <p className="text-xs text-white">No canvases found</p>
          </div>
        )}
      </div>
    </HTMLContainer>
  )
}
