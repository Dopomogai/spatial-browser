import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/src/components/shapes/BrowserWidget/BrowserWidgetComponent.tsx'

with open(file_path, 'r') as f:
    content = f.read()

new_content = content.replace(
    "  // ACTIVE STATE",
    """  // SLEEPING STATE
  if (widget.interactionState === 'sleeping') {
    return (
      <div className="w-full h-full bg-surface-container-high rounded-2xl shadow-xl border border-outline-variant/30 flex flex-col overflow-hidden relative no-drag-region cursor-pointer group">
        <div className="h-12 bg-surface-container-lowest/90 backdrop-blur border-b border-surface/50 flex items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
            <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
            <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
          </div>
          <div className="flex-1 mx-8 flex justify-center opacity-50">
            <div className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-mono text-on-surface-variant flex items-center gap-2 max-w-sm truncate">
              <Moon size={12} />
              <span className="truncate">{widget.title || widget.url}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full bg-surface-container flex items-center justify-center relative overflow-hidden">
          {widget.screenshotBase64 ? (
            <img src={widget.screenshotBase64} className="w-full h-full object-cover opacity-30 blur-[2px] transition-all group-hover:opacity-50" />
          ) : (
            <div className="text-on-surface-variant/30 font-semibold uppercase tracking-widest text-sm flex items-center gap-2">
              <Moon size={16} /> Sleeping
            </div>
          )}
          {/* Overlay to wake up */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary px-4 py-2 rounded-full text-on-primary font-bold shadow-lg pointer-events-auto hover:bg-primary/90 flex items-center gap-2"
                 onClick={() => updateWidget(widget.id, { interactionState: 'active' })}>
              <Globe size={16} /> Wake Tab
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MINIMIZED STATE (Pill)
  if (widget.interactionState === 'minimized') {
    return (
      <div className="w-full h-full bg-surface-container-high rounded-full shadow-lg border border-outline-variant/30 flex items-center px-4 gap-3 relative group no-drag-region cursor-pointer hover:bg-surface-container-highest transition-colors">
        {widget.faviconUrl ? <img src={widget.faviconUrl} className="w-4 h-4" /> : <Globe size={16} className="text-primary" />}
        <span className="text-sm font-semibold text-on-surface truncate flex-1">{widget.title || widget.url}</span>
        
        {/* Restore Button (Hidden until hover) */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            updateWidget(widget.id, { interactionState: 'active' })
            editor.updateShape({ id: shape.id, type: 'browser_widget', props: { w: 800, h: 600 } } as any)
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-container-lowest rounded-full text-on-surface-variant transition-all"
        >
          <Maximize2 size={14} />
        </button>

        {/* Close Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            removeWidget(widget.id)
            editor.deleteShape(shape.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error/20 hover:text-error rounded-full text-on-surface-variant transition-all"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  // ACTIVE STATE"""
)

with open(file_path, 'w') as f:
    f.write(new_content)
