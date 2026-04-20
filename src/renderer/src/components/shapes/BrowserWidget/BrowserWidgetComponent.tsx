import React, { useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '../../../store/useCanvasStore'
import { Globe, X, Maximize2, ChevronLeft, ChevronRight, History, RotateCw } from 'lucide-react'
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
    
    // Natively intercept context-menu on the webview so it doesn't spawn Chromium's default UI
    const handleContextMenu = (e: any) => {
        e.preventDefault()
    }

    const handleDidNavigate = (e: any) => {
      // Always store the current active URL into the layout store so when this widget goes to sleep,
      // it wakes up exactly where it was left.
      if (e.url !== widget.url) {
        updateWidget(widget.id, { url: e.url })
      }
      setCanGoBack(webviewRef.current?.canGoBack() || false)
      setCanGoForward(webviewRef.current?.canGoForward() || false)
    }
    
    const handleDidNavigateInPage = (e: any) => {
      // For hash changes and history.pushState
      if (e.url !== widget.url && e.isMainFrame) {
        updateWidget(widget.id, { url: e.url })
      }
      setCanGoBack(webviewRef.current?.canGoBack() || false)
      setCanGoForward(webviewRef.current?.canGoForward() || false)
    }

    const handlePageTitleUpdated = (e: any) => {
      if (e.title !== widget.title) {
        updateWidget(widget.id, { title: e.title })
      }
    }

    webview.addEventListener('did-start-loading', () => {
         setCanGoBack(webviewRef.current?.canGoBack() || false)
         setCanGoForward(webviewRef.current?.canGoForward() || false)
    })
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    webview.addEventListener('page-title-updated', handlePageTitleUpdated)
    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('context-menu', handleContextMenu)

    return () => {
      webview.removeEventListener('did-navigate', handleDidNavigate)
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated)
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('context-menu', handleContextMenu)
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
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (widget?.interactionState === 'active' && webviewRef.current && isReady) {
      if (webviewRef.current.getURL) {
        timeout = setTimeout(() => {
          if (!webviewRef.current) return;
          try {
            const currentWebviewUrl = webviewRef.current.getURL();
            if (currentWebviewUrl && currentWebviewUrl !== widget.url && currentWebviewUrl !== '') {
                webviewRef.current.loadURL(widget.url);
            }
          } catch(e) {}
        }, 100);
      }
    }
    return () => { if(timeout) clearTimeout(timeout) }
  }, [widget?.interactionState, widget?.url, isReady])

  if (!widget) return null

  // Stop pointer events reaching TLDraw when interacting with the widget
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
  }

  // We handle sleep/minimized states via CSS injection to prevent `<webview>` context destruction.
  // MINIMIZED AND SLEEPING STATES ARE NOW INTEGRATED VIA CSS OVERLAYS IN THE MAIN RENDER 

  return (
    <div className="w-full h-full bg-surface-container-high rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-outline-variant/30 flex flex-col overflow-hidden relative group">
      
      {/* Auto-hiding Top Bar */}
      <div 
        className={`h-12 bg-surface-container-lowest/90 backdrop-blur border-b border-surface/50 flex items-center px-4 justify-between transition-transform duration-300 transform z-20 absolute top-0 w-full
        ${widget.interactionState === 'active' ? 'translate-y-0 opacity-100 group-hover:translate-y-0 group-hover:opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-2" onPointerDown={handlePointerDown}>
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
        
        {/* Back and Forward Controls */}
        <div className="flex gap-2 ml-4 text-on-surface-variant flex-shrink-0 border-l border-white/5 pl-4" onPointerDown={handlePointerDown}>
          <button onClick={() => { if(canGoBack) webviewRef.current?.goBack() }} disabled={!canGoBack} className={`hover:text-white transition-colors p-1 rounded hover:bg-white/10 ${!canGoBack && 'opacity-30 cursor-not-allowed'}`}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => { if(canGoForward) webviewRef.current?.goForward() }} disabled={!canGoForward} className={`hover:text-white transition-colors p-1 rounded hover:bg-white/10 ${!canGoForward && 'opacity-30 cursor-not-allowed'}`}>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { webviewRef.current?.reload() }} className="hover:text-white transition-colors p-1 rounded hover:bg-white/10 ml-1">
            <RotateCw size={14} />
          </button>
        </div>

        <div className="flex-1 mx-6 flex justify-center" onPointerDown={handlePointerDown}>
          <div className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-mono text-on-surface-variant/80 border border-outline-variant/20 flex items-center gap-2 max-w-sm w-full truncate shadow-inner">
            <Globe size={12} className="opacity-50" />
            <span className="truncate">{widget.url}</span>
          </div>
        </div>

        <div className="w-20"></div> {/* Spacer */}
      </div>

      {/* Webview Area */}
      <div className={`flex-1 w-full bg-white relative ${widget.interactionState === 'active' ? 'mt-12 opacity-100' : 'hidden'}`}
           style={{ pointerEvents: widget.interactionState === 'active' ? 'auto' : 'none' }}
      >
        
        {/* Pan Hack Overlay */}
        <div className={`absolute inset-0 top-0 h-10 ${widget.interactionState === 'active' ? 'cursor-move pointer-events-auto' : 'pointer-events-none'}`} />
        
        <webview
          ref={webviewRef}
          src={widget.url}
          className={`w-full h-full border-none ${isSpacebarHeld || isShiftHeld ? 'pointer-events-none' : 'pointer-events-auto'}`}
          partition="persist:main"
          preload={`file://${(window as any).api?.getPreloadPath?.() || '../preload/index.js'}`}
        />
      </div>

      {/* SLEEPING OVERLAY (Mounted on top of blurred webview to avoid unmounting it) */}
      {widget.interactionState === 'sleeping' && (
        <div className="absolute inset-0 z-30 bg-[#131315] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-outline-variant/30 flex flex-col overflow-hidden group pointer-events-none">
          <div className="h-12 bg-surface-container-lowest/90 backdrop-blur border-b border-surface/50 flex items-center px-4 z-10 pointer-events-auto">
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
            <div className="w-14"></div>
          </div>
          <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden pointer-events-auto">
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
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
              <div className="bg-[#aac7ff] text-[#131315] px-6 py-2.5 rounded-full font-bold shadow-lg pointer-events-auto hover:bg-[#aac7ff]/90 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                   onClick={(e) => { e.stopPropagation(); updateWidget(widget.id, { interactionState: 'active' }); }}>
                <Globe size={16} /> Wake Tab
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINIMIZED PILL OVERLAY */}
      {widget.interactionState === 'minimized' && (
        <div className="absolute inset-0 z-40 bg-surface-container-high rounded-full shadow-lg border border-outline-variant/30 flex items-center px-4 gap-3 group pointer-events-auto cursor-pointer hover:bg-surface-container-highest transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            updateWidget(widget.id, { interactionState: 'active' })
            editor.updateShape({ id: shape.id, type: 'browser_widget', props: { w: 800, h: 600 } } as any)
          }}
        >
          <Globe size={16} className="text-primary" />
          <span className="text-sm font-semibold text-on-surface truncate flex-1">{widget.title || widget.url}</span>
          
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
      )}

    </div>
  )
}