import React, { useEffect, useState } from 'react'
import { ReactFlow, Background, MiniMap, Controls, useReactFlow, ReactFlowProvider } from '@xyflow/react'
import type { NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BrowserWidgetNode } from '../shapes/BrowserWidget/BrowserWidgetNode'
import { useCanvasStore } from '../../store/useCanvasStore'
import type { AppNode } from '../../store/useCanvasStore'
import { Plus, Maximize } from 'lucide-react'
import { Omnibar } from '../ui/Omnibar'

// Define our completely custom node components to inject into ReactFlow
const nodeTypes: NodeTypes = {
  browser_widget: BrowserWidgetNode,
//  canvases_widget: CanvasesWidgetNode,
//  settings_widget: SettingsWidgetNode,
}

const CanvasContent = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, updateWidgetData } = useCanvasStore()
  const { setCenter, screenToFlowPosition, getZoom, getViewport } = useReactFlow()
  const { setOmnibarOpen, isSpacebarHeld } = useCanvasStore()
  
  // Track shift explicitly to manipulate scroll behaviors
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftHeld(true) }
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftHeld(false) }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
        window.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

  const onPaneContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuOpen(true);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Handle global events dispatched from TopTabBar or elsewhere
  useEffect(() => {
    const handleSpawnCenter = () => {
      setOmnibarOpen(true, null) // Triggers the absolute center calculation inside the Omnibar
    }
    const handlePanToWidget = (e: any) => {
        try {
            const widgetNode = nodes.find(n => n.id === e.detail.id)
            if (widgetNode) {
                // Focus entirely safely without breaking constraints!
                const w = widgetNode.data?.w || 800
                const h = widgetNode.data?.h || 600
                setCenter(widgetNode.position.x + (w/2), widgetNode.position.y + (h/2), { duration: 500, zoom: 1 })
            }
        } catch(err) {}
    }

    const handleSpawnCanvases = () => {
        const id = `canvases_widget_${Date.now()}`
        const viewport = getViewport()
        const scale = viewport.zoom
        
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const centerXV = windowWidth / 2
        const centerYV = windowHeight / 2
        
        const visibleX = (centerXV - viewport.x) / scale - 250 // offset for widget half width (500/2)
        const visibleY = (centerYV - viewport.y) / scale - 200 // offset for widget half height (400/2)
        
        const newNode: AppNode = {
            id,
            type: 'browser_widget', 
            position: { x: visibleX, y: visibleY },
            data: {
              url: 'about:blank#history', 
              title: 'History & Workspaces',
              faviconUrl: '',
              screenshotBase64: null,
              w: 500,
              h: 400,
              interactionState: 'active',
              lastActive: Date.now(),
              tabHistory: ['about:blank#history'],
              currentHistoryIndex: 0
            }
        }
        
        useCanvasStore.setState((state) => ({
            nodes: [...state.nodes, newNode],
            undoStack: [...state.undoStack, state.nodes].slice(-50),
            redoStack: []
        }))
    }

    const handleFullscreenToggled = (_e: any, { tabId, isFullScreen }: { tabId: string, isFullScreen: boolean }) => {
        const widget = nodes.find(n => n.id === tabId)
        if (!widget) return;
        
        if (isFullScreen) {
            updateWidgetData(tabId, { 
                interactionState: 'active', 
                w: window.innerWidth, 
                h: window.innerHeight,
                tabHistoryW: widget.data.w,
                tabHistoryH: widget.data.h
            })
            // setCenter takes x,y of the exact point to focus on, and zoom.
            // When putting the tab center at widget.x + w/2 and widget.y + h/2, with zoom 1, 
            // the innerWidth and innerHeight of the browser matches the widget size exactly,
            // so it naturally frames it perfectly.
            setCenter(
                widget.position.x + (window.innerWidth / 2), 
                widget.position.y + (window.innerHeight / 2), 
                { zoom: 1, duration: 300 }
            )
        } else {
            // Restore previous sizing if available
            updateWidgetData(tabId, { 
                interactionState: 'active', 
                w: widget.data.tabHistoryW || 800, 
                h: widget.data.tabHistoryH || 600 
            })
        }
    }

    const handleSpawnSettings = () => {
        const id = `settings_widget_${Date.now()}`
        const viewport = getViewport()
        const scale = viewport.zoom
        
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const centerXV = windowWidth / 2
        const centerYV = windowHeight / 2
        
        const visibleX = (centerXV - viewport.x) / scale - 250 // offset for widget half width (500/2)
        const visibleY = (centerYV - viewport.y) / scale - 200 // offset for widget half height (400/2)
        
        const newNode: AppNode = {
            id,
            type: 'browser_widget', // Built via browser node routing to settings page for now
            position: { x: visibleX, y: visibleY },
            data: {
              url: 'about:blank#settings', // Distinguishes it inside the Node
              title: 'Settings',
              faviconUrl: '',
              screenshotBase64: null,
              w: 500,
              h: 400,
              interactionState: 'active',
              lastActive: Date.now(),
              tabHistory: ['about:blank#settings'],
              currentHistoryIndex: 0
            }
        }
        
        useCanvasStore.setState((state) => ({
            nodes: [...state.nodes, newNode],
            undoStack: [...state.undoStack, state.nodes].slice(-50),
            redoStack: []
        }))
    }

    window.addEventListener('spawn-tab-center', handleSpawnCenter)
    window.addEventListener('spawn-settings-widget', handleSpawnSettings)
    window.addEventListener('spawn-canvases-widget', handleSpawnCanvases)
    window.addEventListener('pan-to-widget' as any, handlePanToWidget)
    window.electron?.ipcRenderer?.on('fullscreen-toggled', handleFullscreenToggled)

    return () => {
      window.removeEventListener('spawn-tab-center', handleSpawnCenter)
      window.removeEventListener('spawn-settings-widget', handleSpawnSettings)
      window.removeEventListener('spawn-canvases-widget', handleSpawnCanvases)
      window.removeEventListener('pan-to-widget' as any, handlePanToWidget)
      window.electron?.ipcRenderer?.removeListener?.('fullscreen-toggled', handleFullscreenToggled)
    }
  }, [nodes, setCenter, setOmnibarOpen, getViewport])

  // Sleeping tab hysteresis (We keep the bounding boxes logic but use ReactFlow's zoom!)
  useEffect(() => {
      const checkViewport = () => {
          const viewport = getViewport()
          const scale = viewport.zoom
          const buffer = 500 / scale 

          // Reverse viewport coordinates to find bounding box in ReactFlow coords
          const screenW = window.innerWidth / scale
          const screenH = window.innerHeight / scale
          const visibleX = -viewport.x / scale
          const visibleY = -viewport.y / scale

          nodes.forEach(node => {
              if (node.data?.interactionState === 'minimized') return;

              const nx = node.position.x
              const ny = node.position.y
              const nw = node.data?.w || 800
              const nh = node.data?.h || 600

              const distanceX = Math.max(0, visibleX - (nx + nw), nx - (visibleX + screenW))
              const distanceY = Math.max(0, visibleY - (ny + nh), ny - (visibleY + screenH))
  
              const WAKE_THRESHOLD = buffer            
              const SLEEP_THRESHOLD = buffer + (300 / scale) 

              const isDeepOffScreen = distanceX > SLEEP_THRESHOLD || distanceY > SLEEP_THRESHOLD
              const isCloseToScreen = distanceX < WAKE_THRESHOLD && distanceY < WAKE_THRESHOLD

              if (isDeepOffScreen && node.data?.interactionState === 'active') {
                   updateWidgetData(node.id, { interactionState: 'sleeping' })
              } else if (isCloseToScreen && node.data?.interactionState === 'sleeping') {
                   updateWidgetData(node.id, { interactionState: 'active' })
              }
          })
      }
      
      const interval = setInterval(checkViewport, 1000)
      return () => clearInterval(interval)
  }, [nodes, getViewport, updateWidgetData])

  return (
    <div className="w-full h-full relative" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => setContextMenuOpen(false)} onPointerDown={() => setContextMenuOpen(false)}>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneContextMenu={onPaneContextMenu}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        // Force the background to intercept the mouse pan event ONLY when Space or Shift is held
        panOnScroll={true}
        panOnDrag={isSpacebarHeld || isShiftHeld}
        zoomOnScroll={false} // Disable default zoom to let macOS trackpad scroll to pan correctly
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }} // Let's keep Dopomogai clean
      >
        <Background 
          color="rgba(255,255,255,0.03)" 
          size={1} 
          gap={40} 
          className="bg-[#131315]"
        />
        
        {/* We use ReactFlow's natively styled components, customized heavily to match LiquidGlass Dopomogai style */}
        <MiniMap 
          onNodeClick={(e, node) => {
              setCenter(node.position.x + (node.data?.w as number || 800) / 2, node.position.y + (node.data?.h as number || 600) / 2, { duration: 500, zoom: 1 })
          }}
          nodeColor={(n: any) => {
              if(n.data?.interactionState === 'minimized') return '#FFB868';
              return '#4ADE80';
          }}
          nodeBorderRadius={2}
          className="!absolute !bottom-4 !right-4 !w-[200px] !h-[150px] !bg-[#131315]/80 !backdrop-blur-2xl !rounded-2xl !border !border-outline-variant/20 shadow-[0_12px_32px_rgba(255,255,255,0.1)] !overflow-hidden !z-50 cursor-crosshair transition-transform hover:scale-[1.02]"
          maskColor="rgba(255, 255, 255, 0.1)"
        />

        {/* Optional dev tool, hidden for V1 - let's add back hotkeys later if desired 
        <Controls className="!bg-[#242424] !border !border-white/10 !fill-white" /> */}
      </ReactFlow>

      {contextMenuOpen && (
          <div className="absolute bg-[#242424] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)] rounded py-1 w-48 animate-in fade-in zoom-in duration-100 z-[9999]"
            style={{
                top: contextMenuPos.y,
                left: contextMenuPos.x,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
              <button 
                onClick={() => {
                    setContextMenuOpen(false)
                    // Pass the true screen coordinates for the UI Omnibar overlay
                    setOmnibarOpen(true, contextMenuPos) 
                }}
                className="w-full text-left px-3 py-2 text-sm text-on_surface_variant hover:text-white hover:bg-primary/20 transition-colors flex flex-row items-center gap-2"
              >
                  <Plus size={14} /> Spawn Tab Here
              </button>
              <div className="w-full h-px bg-white/5 my-1"></div>
              <button 
                onClick={() => {
                    setContextMenuOpen(false)
                    
                    const widgetNodes = useCanvasStore.getState().nodes;
                    if (widgetNodes.length === 0) {
                        setCenter(0, 0, { zoom: 1, duration: 300 });
                        return;
                    }

                    // Simple bounding box centering
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    widgetNodes.forEach(w => {
                        minX = Math.min(minX, w.position.x);
                        minY = Math.min(minY, w.position.y);
                        // Standard size fallback if W and H are nullish somehow
                        maxX = Math.max(maxX, w.position.x + (w.data?.w || 800));
                        maxY = Math.max(maxY, w.position.y + (w.data?.h || 600));
                    });

                    const centerX = minX + (maxX - minX) / 2;
                    const centerY = minY + (maxY - minY) / 2;
                    
                    // React Flow native animation
                    setCenter(centerX, centerY, { zoom: 0.5, duration: 500 });
                }}
                className="w-full text-left px-3 py-2 text-sm text-on_surface_variant hover:text-white hover:bg-primary/20 transition-colors flex items-center gap-2"
              >
                  <Maximize size={14} /> Center View
              </button>
          </div>
      )}
    </div>
  )
}

export const SpatialCanvas = () => {
    return (
        <ReactFlowProvider>
            <CanvasContent />
            <Omnibar />
        </ReactFlowProvider>
    )
}