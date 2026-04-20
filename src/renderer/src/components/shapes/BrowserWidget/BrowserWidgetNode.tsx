import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '../../../store/useCanvasStore'
import { Globe, X, Maximize2, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { NodeResizer, useReactFlow } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

// Helper to validate Base64 string bounds
const isValidDataUrl = (str: string | undefined): boolean => {
  if (!str) return false;
  return str.startsWith('data:image/png;base64,') && str.length > 30; 
}

export const BrowserWidgetNode: React.FC<NodeProps> = ({ id, data }) => {
  const { updateWidgetData, removeWidget, isSpacebarHeld } = useCanvasStore()
  const widget = data as any // data mapped via AppNode in store
  const webviewRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [isReady, setIsReady] = useState(false)
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [editingUrl, setEditingUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { setNodes } = useReactFlow() // Natively resize nodes

  // Hardware controls listening
  useEffect(() => {
    const handleShiftChange = (e: any) => setIsShiftHeld(e.detail.held)
    // Keep spacebar/shift listener purely to disable pointer-events so ReactFlow can pan the container
    window.addEventListener('shift-state-change' as any, handleShiftChange)
    return () => window.removeEventListener('shift-state-change' as any, handleShiftChange)
  }, [])

  // Webview lifecycle and URL resolution logic
  useEffect(() => {
    if (!webviewRef.current) return
    const webview = webviewRef.current

    let isMounted = true;

    const handleDomReady = () => {
      if (!isMounted) return;
      setIsReady(true)
    }

    const checkHistoryStates = () => {
       if (!isMounted || !webviewRef.current?.getWebContentsId) return;
       // Safety catch: Electron throws an error if Webview isn't attached to DOM yet
       try {
           setCanGoBack(webviewRef.current.canGoBack() || false)
           setCanGoForward(webviewRef.current.canGoForward() || false)
       } catch(err) { }
    }

    const handleContextMenu = (e: any) => {
        // Prevent default double menu, but let us send IPC signal to main window menu if needed later.
        e.preventDefault() 
    }

    const handleDidNavigate = (e: any) => {
      if (!isMounted) return;
      if (e.url !== widget.url) {
          updateWidgetData(id, { url: e.url })
          if (!isEditing) setEditingUrl(e.url)
      }
      checkHistoryStates()
    }
    
    const handleDidNavigateInPage = (e: any) => {
      if (!isMounted) return;
      if (e.url !== widget.url && e.isMainFrame) {
          updateWidgetData(id, { url: e.url })
          if (!isEditing) setEditingUrl(e.url)
      }
      checkHistoryStates()
    }

    const handlePageTitleUpdated = (e: any) => {
      if (!isMounted) return;
      if (e.title !== widget.title) updateWidgetData(id, { title: e.title })
    }

    webview.addEventListener('did-start-loading', checkHistoryStates)
    webview.addEventListener('did-navigate', handleDidNavigate)
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    webview.addEventListener('page-title-updated', handlePageTitleUpdated)
    // Inject window.ipcRenderer hook for context menu forwarding properly
    const handleDomReadyExecution = () => {
      handleDomReady()
      webview.executeJavaScript(`
        window.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          
          let href = '';
          let src = '';
          let text = window.getSelection().toString();
          
          // Traverse up to find a link if we didn't click directly on the <a>
          let el = e.target;
          while (el && el !== document.body) {
            if (el.tagName === 'A' && el.href) {
                href = el.href;
                break;
            }
            if (el.tagName === 'IMG' && el.src) {
                src = el.src;
            }
            el = el.parentElement;
          }

          window.ipcRenderer.send('webview-context-menu', {
             x: e.x, 
             y: e.y, 
             linkURL: href, 
             srcURL: src,
             selectionText: text
          });
        });
      `)
    }

    webview.addEventListener('dom-ready', handleDomReadyExecution)
    webview.addEventListener('context-menu', handleContextMenu)

    return () => {
      isMounted = false;
      webview.removeEventListener('did-start-loading', checkHistoryStates)
      webview.removeEventListener('did-navigate', handleDidNavigate)
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated)
      webview.removeEventListener('dom-ready', handleDomReadyExecution)
      webview.removeEventListener('context-menu', handleContextMenu)
    }
  }, [id, widget.url])
  // Screenshot logic remains identical, caching visuals to DB/Store
  useEffect(() => {
    if (widget.interactionState !== 'active' && webviewRef.current && isReady) {
      if (webviewRef.current.capturePage) {
        webviewRef.current.capturePage().then((image: any) => {
            const dataUrl = image.toDataURL();
            if (isValidDataUrl(dataUrl)) updateWidgetData(id, { screenshotBase64: dataUrl });
        }).catch(console.error)
      }
    }
  }, [widget?.interactionState, id, updateWidgetData, isReady])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (widget?.interactionState === 'active' && webviewRef.current && isReady) {
      if (webviewRef.current.getURL) {
        timeout = setTimeout(() => {
          if (!webviewRef.current) return;
          try {
            const currentUrl = webviewRef.current.getURL();
            if (currentUrl && currentUrl !== widget.url && currentUrl !== '') {
                webviewRef.current.loadURL(widget.url);
            }
          } catch(e) {}
        }, 100);
      }
    }
    return () => { if(timeout) clearTimeout(timeout) }
  }, [widget?.interactionState, widget?.url, isReady])

  if (!widget) return null

  // Resize helper that updates React Flow's native internal dimension trackers
  const expandWidget = () => {
      updateWidgetData(id, { interactionState: 'active' });
      // In React Flow, we resize simply by updating our custom store node width/height 
      // or letting the CSS dictate the node's dimensions. Here we enforce it via w/h in state.
      updateWidgetData(id, { w: 800, h: 600 });
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUrl) return;
      
      let finalUrl = editingUrl.trim();
      const domainRegex = /^(https?:\/\/)?((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|(localhost)|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:\d+)?(\/.*)?$/;
      
      if (domainRegex.test(finalUrl)) {
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = `https://${finalUrl}`
        }
      } else {
          finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
      }

      setEditingUrl(finalUrl)
      setIsEditing(false);
      updateWidgetData(id, { url: finalUrl })
      if (webviewRef.current) webviewRef.current.loadURL(finalUrl);
  }

  return (
    <>
    <NodeResizer 
        isVisible={widget.interactionState === 'active' && isHovered} 
        minWidth={300} 
        minHeight={200}
        handleStyle={{ width: 12, height: 12, borderRadius: 0, background: 'transparent', border: 'none' }} 
        handleClassName="custom-resizer-handle"
        lineStyle={{ borderWidth: 6, borderColor: 'transparent' }} 
        onResize={(e, params) => {
            updateWidgetData(id, { w: params.width, h: params.height })
        }} 
    />
    <div className="bg-surface-container-high rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-outline-variant/30 flex flex-col overflow-hidden relative group"
         style={{ width: widget.w, height: widget.h }}
         onClick={(e) => e.stopPropagation()} // Prevents clicking the node from passing into the canvas background
         onPointerDown={(e) => e.stopPropagation()}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
    >
      
      <div className={`h-12 bg-surface-container-lowest/90 backdrop-blur border-b border-surface/50 flex items-center px-4 justify-between transition-transform duration-300 transform z-20 absolute top-0 w-full custom-drag-handle
        ${widget.interactionState === 'active' ? 'translate-y-0 opacity-100 group-hover:translate-y-0 group-hover:opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        
        <div className="flex items-center gap-2">
          <button onClick={() => removeWidget(id)} className="w-3 h-3 rounded-full bg-error hover:opacity-80"></button>
          <button 
            onClick={() => {
              updateWidgetData(id, { interactionState: 'minimized', w: 250, h: 48 })
            }} 
            className="w-3 h-3 rounded-full bg-tertiary hover:opacity-80"
          ></button>
          <button 
            onClick={() => {
              window.ipcRenderer.send('toggle-fullscreen', id);
            }} 
            className="w-3 h-3 rounded-full bg-[#34c759] hover:opacity-80 flex items-center justify-center text-black font-bold"
          ></button>
        </div>
        
        <div className="flex gap-2 ml-4 text-on-surface-variant flex-shrink-0 border-l border-white/5 pl-4">
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

        <div className="flex-1 mx-6 flex justify-center cursor-move custom-drag-handle"> 
          {/* React flow allows applying ".custom-drag-handle" class to limit dragging to header only! */}
          <form 
            onSubmit={handleUrlSubmit} 
            className={`bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-mono border border-outline-variant/20 flex items-center gap-2 max-w-sm w-full shadow-inner ${isEditing ? 'ring-1 ring-primary border-primary/50' : 'text-on-surface-variant/80'}`}
          >
            <Globe size={12} className="opacity-50 shrink-0" />
            <input 
               ref={inputRef}
               className="bg-transparent w-full outline-none truncate"
               value={isEditing ? editingUrl : (widget.url)}
               onFocus={() => {
                   setIsEditing(true);
                   setEditingUrl(widget.url);
               }}
               onBlur={() => setIsEditing(false)}
               onChange={(e) => setEditingUrl(e.target.value)}
            />
          </form>
        </div>
        <div className="w-20"></div>
      </div>

      <div className={`flex-1 w-full bg-white relative ${widget.interactionState === 'active' ? 'mt-12 opacity-100' : 'hidden'}`}
           style={{ pointerEvents: widget.interactionState === 'active' ? 'auto' : 'none' }}
      >
        <div className={`absolute inset-0 top-0 h-10 ${widget.interactionState === 'active' ? 'cursor-move pointer-events-auto custom-drag-handle' : 'pointer-events-none'}`} />
        
        {widget.url.startsWith('about:blank') ? (
             <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center text-on_surface_variant overflow-y-auto p-4 cursor-auto relative">
                 <div className="w-full max-w-lg mb-6 flex flex-col gap-2">
                     <h2 className="text-2xl font-bold text-white text-center">Settings</h2>
                     <p className="text-sm opacity-70 text-center">System preferences and AI integrations.</p>
                 </div>
                 
                 <div className="w-full max-w-lg space-y-4 px-2">
                     <div className="bg-surface-container-highest p-5 rounded-xl border border-white/5 flex flex-col gap-3">
                        <h3 className="font-semibold text-white">General UI</h3>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black text-primary focus:ring-primary accent-primary" />
                            <span className="text-sm group-hover:text-white transition-colors">Show Tab Shadows</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input defaultChecked type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black text-primary focus:ring-primary accent-primary" />
                            <span className="text-sm group-hover:text-white transition-colors">Enable Cinematic Auto-Focus (Zooming)</span>
                        </label>
                     </div>
                     
                     <div className="bg-surface-container-highest p-5 rounded-xl border border-white/5 flex flex-col gap-3">
                        <h3 className="font-semibold text-white">Oragai Copilot</h3>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input defaultChecked type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black text-primary focus:ring-primary accent-primary" />
                            <span className="text-sm group-hover:text-white transition-colors">Show Vision Action Boxes (Red/Green outlines)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black text-primary focus:ring-primary accent-primary" />
                            <span className="text-sm group-hover:text-white transition-colors">Auto-Execute suggested code</span>
                        </label>
                     </div>

                     <div className="bg-surface-container-highest p-5 rounded-xl border border-white/5 flex flex-col gap-4">
                        <h3 className="font-semibold text-white">Database & Sync</h3>
                        <button className="bg-primary/20 text-primary w-full py-2.5 rounded-lg border border-primary/20 font-medium hover:bg-primary hover:text-white transition-all text-sm outline-none">
                            Force Manual Sync (Supabase)
                        </button>
                        <button className="bg-error/10 text-error w-full py-2.5 rounded-lg border border-error/20 font-medium hover:bg-error hover:text-white transition-all text-sm outline-none">
                            Wipe Local Spatial DB cache
                        </button>
                     </div>
                 </div>
                 
                 <div className="absolute bottom-4 opacity-30 text-xs text-center flex flex-col gap-1 pointer-events-none">
                     <span>Dopomogai Spatial OS v1.5.0</span>
                     <span>Chromium {window.electron?.process?.chrome || ''} • Electron {window.electron?.process?.electron || ''}</span>
                 </div>
             </div>
        ) : (
            <webview
              ref={webviewRef}
              src={widget.url}
              className={`w-full h-full border-none ${isSpacebarHeld || isShiftHeld ? 'pointer-events-none' : 'pointer-events-auto'}`}
              partition="persist:main"
              preload={`file://${(window as any).api?.getPreloadPath?.() || '../preload/index.js'}`}
            />
        )}
      </div>

      {widget.interactionState === 'sleeping' && (
        // UI matches exactly, but we removed the manual TLDraw pointer-events math
        <div className="absolute inset-0 z-30 bg-[#131315] flex flex-col overflow-hidden group">
           <div className="flex-1 w-full bg-black relative flex items-center justify-center overflow-hidden pointer-events-auto">
             {widget.screenshotBase64 && (
              <img src={widget.screenshotBase64} alt="site" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale-[20%]" />
             )}
             <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                <button className="bg-[#aac7ff] text-[#131315] px-6 py-2.5 rounded-full font-bold" onClick={(e) => { e.stopPropagation(); expandWidget() }}>
                  Wake Tab
                </button>
             </div>
           </div>
        </div>
      )}

      {widget.interactionState === 'minimized' && (
        <div className="absolute inset-0 z-40 bg-surface-container-high rounded-full shadow-lg border border-outline-variant/30 flex items-center px-4 gap-3 group cursor-pointer hover:bg-surface-container-highest transition-colors"
          onClick={(e) => { e.stopPropagation(); expandWidget() }}
        >
          <Globe size={16} className="text-primary" />
          <span className="text-sm font-semibold text-on-surface truncate flex-1">{widget.title || widget.url}</span>
          <button onClick={(e) => { e.stopPropagation(); expandWidget() }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-container-lowest rounded-full text-on-surface-variant transition-all">
            <Maximize2 size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); removeWidget(id) }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-error/20 hover:text-error rounded-full text-on-surface-variant transition-all">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
    </>
  )
}