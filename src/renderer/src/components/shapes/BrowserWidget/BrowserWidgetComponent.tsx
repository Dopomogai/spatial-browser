import React, { useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '../../../store/useCanvasStore'
import { Globe, X, Maximize2, ChevronLeft, ChevronRight, History } from 'lucide-react'
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
  const [isReady, setIsReady] = useState(false)
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [showHistory, setShowHistory] = useState(false)


  useEffect(() => {
    const handleShiftChange = (e: any) => setIsShiftHeld(e.detail.held)
    // Need to strictly cast to any to bypass TS event mapping constraints
    window.addEventListener('shift-state-change' as any, handleShiftChange)
    return () => {
      window.removeEventListener('shift-state-change' as any, handleShiftChange)
    }
  }, [])


  // Listen for navigation events to update URL
  useEffect(() => {
    if (!webviewRef.current) return
    const webview = webviewRef.current

    const handleDomReady = () => {
      setIsReady(true)
    }

    const handleDidNavigate = (e: any) => {
      if (e.url !== widget.url) {
        updateWidget(widget.id, { url: e.url })
      }
    }
    
    const handleDidNavigateInPage = (e: any) => {
      // For hash changes and history.pushState
      if (e.url !== widget.url && e.isMainFrame) {
        updateWidget(widget.id, { url: e.url })
      }
    }

    const handlePageTitleUpdated = (e: any) => {
      if (e.title !== widget.title) {
        updateWidget(widget.id, { title: e.title })
      }
    }

    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    webview.addEventListener('page-title-updated', handlePageTitleUpdated)
    webview.addEventListener('dom-ready', handleDomReady)

    return () => {
      webview.removeEventListener('did-navigate', handleDidNavigate)
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated)
      webview.removeEventListener('dom-ready', handleDomReady)
    }
  }, [widget?.id, widget?.url, widget?.title, updateWidget])

  // Capture screenshot when moving to non-active state
  useEffect(() => {
    if (!widget) return
    
    // Check if transition is from active to sleeping/minimized
    if (widget.interactionState !== 'active' && webviewRef.current && isReady) {
      try {
        if (webviewRef.current && webviewRef.current.capturePage) {
          webviewRef.current.capturePage().then((image: any) => {
            const dataUrl = image.toDataURL();
            if (isValidDataUrl(dataUrl)) {
              updateWidget(widget.id, { screenshotBase64: dataUrl });
            }
          }).catch((err: any) => console.error('Failed to capture on sleep', err))
        }
      } catch (e) {
          console.error(e)
      }
    }

  }, [widget?.interactionState, widget?.id, updateWidget, widget?.screenshotBase64, isReady])

  // Also capture screenshot periodically while active
  useEffect(() => {
    if (!widget) return
    if (widget.interactionState === 'active' && webviewRef.current && isReady) {
      const captureInterval = setInterval(async () => {
        try {
          if (webviewRef.current && webviewRef.current.capturePage) {
            const image = await webviewRef.current.capturePage();
            const dataUrl = image.toDataURL();
            if (isValidDataUrl(dataUrl)) {
              updateWidget(widget.id, { screenshotBase64: dataUrl });
            }
          }
        } catch (e) {
          console.error('Failed to capture page', e)
        }
      }, 60000) // Every 60s while active
      return () => clearInterval(captureInterval)
    }
    return () => {}
  }, [widget?.interactionState, widget?.id, updateWidget, widget?.screenshotBase64, isReady])

  // Sleeping state intersection logic is removed from here to prevent fighting with SpatialCanvas

  // When waking from sleep, URL might not be properly populated when restoring, so update webview
  useEffect(() => {
    if (widget?.interactionState === 'active' && webviewRef.current && isReady) {
      if (webviewRef.current.getURL) {
        // Only load if the current webview URL does not match actual expected widget URL
        const currentWebviewUrl = webviewRef.current.getURL();
        if (currentWebviewUrl && currentWebviewUrl !== widget.url && currentWebviewUrl !== '') {
            webviewRef.current.loadURL(widget.url);
        }
      }
    }
  }, [widget?.interactionState, widget?.url, isReady])

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
          <Globe size={14} />
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
      <div className="w-full h-full bg-[#131315] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-outline-variant/30 flex flex-col overflow-hidden relative no-drag-region cursor-pointer group">
        <div className="h-12 bg-surface-container-lowest/90 backdrop-blur border-b border-surface/50 flex items-center px-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
            <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
            <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
          </div>
          <div className="flex-1 mx-8 flex justify-center text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors">
            <div className="bg-surface-container-highest/60 px-4 py-1.5 rounded-full text-xs font-mono border border-outline-variant/20 flex items-center gap-2 max-w-sm w-full truncate">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb868] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffb868]"></span>
              </span>
              <span className="truncate ml-1">{widget.url}</span>
            </div>
          </div>
          <div className="w-14"></div> {/* Spacer to balance flex-1 */}
        </div>
        <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden">
          {widget.screenshotBase64 ? (
            <img src={widget.screenshotBase64} alt="site screenshot" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale-[20%]" />
          ) : (
            <div className="relative flex items-center justify-center flex-col gap-3 opacity-30">
               <span className="relative flex h-6 w-6 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb868] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-[#ffb868]"></span>
                </span>
            </div>
          )}
          {/* Overlay to wake up */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
            <div className="bg-[#aac7ff] text-[#131315] px-6 py-2.5 rounded-full font-bold shadow-lg pointer-events-auto hover:bg-[#aac7ff]/90 flex items-center gap-2 transition-transform hover:scale-105"
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
        <Globe size={16} className="text-primary" />
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
            <Globe size={12} />
            <span className="truncate">{widget.url}</span>
          </div>
        </div>

        <div className="w-14"></div> {/* Spacer */}
      </div>

      {/* Webview Area */}
      <div className="flex-1 w-full bg-white relative mt-12">
        {/* Pan Hack Overlay */}
        <div 
          className={`absolute inset-0 z-10 ${isSpacebarHeld || isShiftHeld ? 'pointer-events-auto' : 'pointer-events-none'}`}
        />
        
        <webview
          ref={webviewRef}
          src={widget.url}
          className={`w-full h-full border-none ${isSpacebarHeld || isShiftHeld ? 'pointer-events-none' : 'pointer-events-auto'}`}
          partition="persist:main"
          preload={`file://${(window as any).api?.getPreloadPath?.() || '../preload/index.js'}`}
        />
      </div>
    </div>
  )
}