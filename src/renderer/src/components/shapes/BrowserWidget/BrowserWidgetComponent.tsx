import React, { useEffect, useRef } from 'react'
import { useCanvasStore } from '../../../store/useCanvasStore'
import { Globe, X, Moon, Maximize2 } from 'lucide-react'
import { useEditor } from 'tldraw'

// Helper to validate base64 strings so React avoids passing garbage to <img> tags
const isValidDataUrl = (str: string | undefined): boolean => {
  if (!str) return false;
  return str.startsWith('data:image/png;base64,') && str.length > 30; // Minimum length check to avoid empty generic data URLs
}

export const BrowserWidgetComponent: React.FC<{ shape: any }> = ({ shape }) => {
  const { widgets, updateWidget, removeWidget, isSpacebarHeld } = useCanvasStore()
  const widget = widgets[shape.props.widgetId]
  const webviewRef = useRef<any>(null)
  const editor = useEditor()
  const isHoldingSpace = isSpacebarHeld

  // Capture screenshot before sleeping
  useEffect(() => {
    if (!widget) return
    if (widget.interactionState === 'active' && webviewRef.current) {
      const captureInterval = setInterval(async () => {
        try {
          if (webviewRef.current.capturePage) {
            const image = await webviewRef.current.capturePage()
            if (!image || (image.isEmpty && image.isEmpty())) return
            const dataUrl = image.toDataURL()
            if (!dataUrl || dataUrl === 'data:image/png;base64,') return
            
            updateWidget(widget.id, { screenshotBase64: dataUrl })
          }
        } catch (e) {
          console.error('Failed to capture page', e)
        }
      }, 60000) // Every 60s while active
      return () => clearInterval(captureInterval)
    }
    return () => {}
  }, [widget?.interactionState, widget?.id, updateWidget])

  // Sleeping state intersection logic
  useEffect(() => {
    if (!widget) return
    if (widget.interactionState === 'minimized') return

    const checkIntersection = () => {
      const bounds = editor.getViewportPageBounds()
      const shapeBounds = editor.getShapePageBounds(shape.id)
      if (!shapeBounds) return

      // 500px Buffer Zone
      const buffer = 500
      const isOffScreen = 
        shapeBounds.maxX < bounds.minX - buffer ||
        shapeBounds.minX > bounds.maxX + buffer ||
        shapeBounds.maxY < bounds.minY - buffer ||
        shapeBounds.minY > bounds.maxY + buffer
      // Automatic sleeping tab logic
      if (isOffScreen && widget.interactionState === 'active') {
        // Try capture before sleep
        if (webviewRef.current?.capturePage) {
          try {
            webviewRef.current.capturePage().then(async (image: any) => {
              if (!image || (image.isEmpty && image.isEmpty())) throw new Error('Empty image')
              const dataUrl = image.toDataURL()
              if (!dataUrl || dataUrl === 'data:image/png;base64,') throw new Error('Empty image')
              
              updateWidget(widget.id, { 
                interactionState: 'sleeping',
                screenshotBase64: dataUrl
              })
            }).catch((err: any) => {
               console.warn('capturePage error:', err)
               updateWidget(widget.id, { interactionState: 'sleeping' })
            })
          } catch (e) {
             console.error('Failed to trigger capturePage:', e)
             updateWidget(widget.id, { interactionState: 'sleeping' })
          }
        } else {
           updateWidget(widget.id, { interactionState: 'sleeping' })
        }
      } else if (!isOffScreen && widget.interactionState === 'sleeping') {
        updateWidget(widget.id, { interactionState: 'active' })
      }
      
    }

    // Checking on camera change
    const unsubscribe = editor.store.listen(() => {
      checkIntersection()
    })
    
    return () => unsubscribe()
  }, [editor, widget?.interactionState, shape.id, updateWidget, widget?.id])

  if (!widget) return null

  // Stop pointer events reaching TLDraw when interacting with the widget
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
  }

  // MINIMIZED STATE
  if (widget.interactionState === 'minimized') {
    return (
      <div 
        className="w-full h-full bg-surface-container-highest/80 backdrop-blur-xl border border-outline-variant/30 rounded-full flex items-center px-4 gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:bg-surface-container-highest transition-colors cursor-pointer group no-drag-region"
        onPointerDown={handlePointerDown}
        onClick={() => {
          updateWidget(widget.id, { interactionState: 'active' })
          // Restore original shape size if we had logic for it, assuming standard 800x600 for now
          editor.updateShape({ id: shape.id, type: 'browser_widget', props: { w: 800, h: 600 } } as any)
        }}
      >
        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
          {isValidDataUrl(widget.faviconUrl) ? <img src={widget.faviconUrl} className="w-4 h-4" /> : <Globe size={14} />}
        </div>
        <span className="text-sm font-medium text-on-surface truncate flex-1">{widget.title || new URL(widget.url).hostname}</span>
        <button 
          className="opacity-0 group-hover:opacity-100 hover:bg-error/20 hover:text-error p-1 rounded-full transition-all"
          onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); editor.deleteShape(shape.id) }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  // SLEEPING STATE
  if (widget.interactionState === 'sleeping') {
    return (
      <div className="w-full h-full bg-surface-container-high rounded-2xl border border-outline-variant/20 shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden relative group">
        <div className="absolute inset-0 bg-surface-container-lowest/70 backdrop-blur-md z-10 flex flex-col items-center justify-center transition-opacity">
          <Moon className="w-12 h-12 text-on-surface-variant/60 mb-4" />
          <span className="text-sm font-medium text-on-surface-variant">Sleeping</span>
          <button 
            className="mt-6 px-6 py-2 bg-surface-container-highest rounded-full text-xs font-semibold uppercase tracking-widest text-primary border border-outline-variant/20 hover:bg-primary-container/20 transition-colors pointer-events-auto"
            onPointerDown={handlePointerDown}
            onClick={() => updateWidget(widget.id, { interactionState: 'active' })}
          >
            Wake
          </button>
        </div>
        {isValidDataUrl(widget.screenshotBase64) && (
          <img src={widget.screenshotBase64} className="w-full h-full object-cover blur-[2px] opacity-30 absolute inset-0" />
        )}
      </div>
    )
  }

  // SLEEPING STATE
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
          {isValidDataUrl(widget.screenshotBase64) ? (
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
        {isValidDataUrl(widget.faviconUrl) ? <img src={widget.faviconUrl} className="w-4 h-4" /> : <Globe size={16} className="text-primary" />}
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

  // ACTIVE STATE
  return (
    <div className="w-full h-full bg-surface-container-high rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-outline-variant/30 flex flex-col overflow-hidden relative group no-drag-region">
      {/* Auto-hiding Top Bar */}
      <div 
        className="h-12 bg-surface-container-lowest/90 backdrop-blur border-b border-surface/50 flex items-center px-4 justify-between transition-transform duration-300 transform translate-y-0 opacity-100 z-20 group-hover:translate-y-0 group-hover:opacity-100 absolute top-0 w-full"
        onPointerDown={handlePointerDown}
      >
        <div className="flex items-center gap-2">
          {/* Mac window controls */}
          <button onClick={() => { removeWidget(widget.id); editor.deleteShape(shape.id) }} className="w-3 h-3 rounded-full bg-error hover:opacity-80"></button>
          <button 
            onClick={() => {
              updateWidget(widget.id, { interactionState: 'minimized' })
              editor.updateShape({ id: shape.id, type: 'browser_widget', props: { w: 250, h: 48 } } as any)
            }} 
            className="w-3 h-3 rounded-full bg-tertiary hover:opacity-80"
          ></button>
          <button className="w-3 h-3 rounded-full bg-[#34c759] hover:opacity-80"></button>
        </div>
        
        <div className="flex-1 mx-8 flex justify-center">
          <div className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-mono text-on-surface-variant/80 border border-outline-variant/20 flex items-center gap-2 max-w-sm w-full truncate">
            {isValidDataUrl(widget.faviconUrl) ? <img src={widget.faviconUrl} className="w-3 h-3" /> : <Globe size={12} />}
            <span className="truncate">{widget.url}</span>
          </div>
        </div>

        <div className="w-14"></div> {/* Spacer */}
      </div>

      {/* Webview Area */}
      <div className="flex-1 w-full bg-white relative mt-12">
        {/* Pan Hack Overlay */}
        <div 
          className={`absolute inset-0 z-10 ${isSpacebarHeld ? 'pointer-events-auto' : 'pointer-events-none'}`}
        />
        
        <webview
          ref={webviewRef}
          src={widget.url}
          className="w-full h-full border-none"
          partition="persist:main"
          preload={`file://${(window as any).api?.getPreloadPath?.() || '../preload/index.js'}`}
        />
      </div>
    </div>
  )
}