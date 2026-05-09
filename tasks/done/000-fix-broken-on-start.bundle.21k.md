---
task-id: 000
generated: 2026-05-09T10:00:00Z
generator-version: 1.0.0
budget:
  target-tokens: 80000
  actual-tokens: 21350
  status: ok
included:
  source-files:
    - path: src/renderer/src/App.tsx
      tokens: 2047
      reason: files-to-touch
    - path: src/renderer/src/components/canvas/SpatialCanvas.tsx
      tokens: 4506
      reason: files-to-touch
    - path: src/renderer/src/store/useCanvasStore.ts
      tokens: 7563
      reason: files-to-touch
    - path: src/renderer/src/main.tsx
      tokens: 146
      reason: direct-import
    - path: src/renderer/src/store/useCanvasStore.test.ts
      tokens: 1765
      reason: same-area-prior-work
    - path: src/main/index.ts
      tokens: 1860
      reason: ipc-host
    - path: src/preload/index.ts
      tokens: 603
      reason: ipc-client
  docs: []
  decisions: []
  related-tasks:
    - path: tasks/done/tab-reopen-crash.md
      tokens: 375
      reason: same-area-prior-work
    - path: tasks/done/tab-wake-crash.md
      tokens: 330
      reason: same-area-prior-work
    - path: tasks/done/fix-ghost-tabs.md
      tokens: 210
      reason: same-area-prior-work
  conventions:
    - section: stack-snapshot
    - section: state-management
    - section: canvas-xyflow
    - section: ipc-electron
    - section: testing
  glossary:
    - canvas
    - node
    - widget
    - viewport
    - supabase sync
    - xyflow
---

# Bundle for Task 000: Fix broken-on-start regression

**Task file**: `tasks/in-progress/000-fix-broken-on-start.md`
**Generated**: 2026-05-09  
**Scope**: renderer-startup  
**Type**: bug  
**Budget**: 21,350 / 80,000 tokens (ok — all candidate files included)

## Navigation

- [Source files](#source-files)
  - [App.tsx](#-files-to-touch--srcrenderersrcapptsx) — primary culprit (flushSyncQueue mismatch, duplicate Space handler)
  - [SpatialCanvas.tsx](#-files-to-touch--srcrenderercomponentscanvasspatialcanvastsx) — secondary issue (double-flush, unverified setTopTabBarVisible)
  - [useCanvasStore.ts](#-files-to-touch--srcrendererarcstoreusecanvasstorets) — single source of truth for store API
  - [main.tsx](#-direct-import--srcrendererarcmaintsx) — entry point
  - [useCanvasStore.test.ts](#-same-area-prior-work--srcrendererarcstorusecanvasstoretestts) — AC4 target; must stay green
  - [src/main/index.ts](#-ipc-host--srcmainindexts) — ipc-host; toggle-maximize handler gap documented
  - [src/preload/index.ts](#-ipc-client--srcpreloadindexts) — ipc-client bridge
- [Related tasks](#related-tasks)
- [Conventions](#conventions)
- [Glossary](#glossary)

---

## Source files

### [files-to-touch] src/renderer/src/App.tsx

```tsx
/**
 * @purpose Root shell: wraps the app in SupabaseAuthProvider, wires global key listeners, runs the sync flusher interval.
 * @why Auth provider must wrap the full component tree; global keydown wiring belongs at root. This shell is also the top-level mount point for the agent-operator canvas — future RemoteAgentWidget and GoogleSheetWidget instances will be orchestrated through the store this component initializes.
 * @role component
 * @exports App
 * @uses useCanvasStore, SpatialCanvas, TopTabBar, AuthModal, @dopomogai/supabase-client/react, supabase
 * @stability experimental
 * @gotchas Duplicate Space-key handler (lines 31 and 46); flusher setInterval(1500ms) here AND another in SpatialCanvas (double-flush); calls flushSyncQueue() but store method is named flushSpatialEvents — TypeError every tick and likely the broken-on-start culprit; calls setTopTabBarVisible via (state: any) cast — existence not verified, may crash on fullscreen toggle if missing
 */
import React, { useEffect, useState } from 'react'
import { SpatialCanvas } from "./components/canvas/SpatialCanvas"
import { TopTabBar } from "./components/TopTabBar"
// Omnibar
import { useCanvasStore } from './store/useCanvasStore'
import { AuthModal } from './components/auth/AuthGate'
import { SupabaseAuthProvider } from '@dopomogai/supabase-client/react'
import { supabase } from './lib/supabase'

function AppContent() {
  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()
  const isTopTabBarVisible = useCanvasStore((state: any) => state.isTopTabBarVisible)
  const setTopTabBarVisible = useCanvasStore((state: any) => state.setTopTabBarVisible)
  const [showNewProfileModal, setShowNewProfileModal] = useState(false)

  useEffect(() => {
    // Sync Flusher Interval
    const flusher = setInterval(() => {
      useCanvasStore.getState().flushSyncQueue();
    }, 1500);

    loadInitialState()

    const handleProfileModalOpen = () => setShowNewProfileModal(true)
    window.addEventListener('open-new-profile-modal', handleProfileModalOpen)

    // Listen for Cmd+K and Spacebar
    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.code === 'Space') {
        setSpacebarHeld(true)
      }

      if (e.key === 'Shift') {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: true } }))
      }
      // Toggle Topbar visibility via Cmd+Shift+B
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
         e.preventDefault()
         setTopTabBarVisible(!useCanvasStore.getState().isTopTabBarVisible)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOmnibarOpen(true)
      }
      if (e.code === 'Space') {
        setSpacebarHeld(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: false } }))
      }
      if (e.code === 'Space') {
        setSpacebarHeld(false)
      }
      if (e.code === 'Space') {
        setSpacebarHeld(false)
      }
    }

    const handleIpcShiftState = (_event: any, isHeld: boolean) => {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: isHeld } }));
    };

    const handleIpcUndo = () => {
      useCanvasStore.getState().undo()
    }
    
    const handleIpcRedo = () => {
      useCanvasStore.getState().redo()
    }
    
    const handleIpcCut = () => {
      // We will let native UI handle the text cut. 
      // For React flow, we could optionally delete the currently selected node here,
      // but we need to track selected nodes first. Since this isn't globally exposed in useCanvasStore easily yet,
      // we will rely on native cut working on text fields, which is the primary issue.
    }

    const handleWindowBlur = () => {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: false } }));
    };

    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.on('shift-state-change', handleIpcShiftState);
        window.electron.ipcRenderer.on('undo-action', handleIpcUndo);
        window.electron.ipcRenderer.on('redo-action', handleIpcRedo);
        window.electron.ipcRenderer.on('cut-action', handleIpcCut);
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('open-new-profile-modal', handleProfileModalOpen)
      if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.removeListener?.('shift-state-change', handleIpcShiftState)
          window.electron.ipcRenderer.removeListener?.('undo-action', handleIpcUndo)
          window.electron.ipcRenderer.removeListener?.('redo-action', handleIpcRedo)
          window.electron.ipcRenderer.removeListener?.('cut-action', handleIpcCut)
      }
      clearInterval(flusher);
    }
  }, [])

  return (
    <div className="w-screen h-screen flex flex-col bg-surface text-on-surface overflow-hidden relative">
      


      <div className="flex-1 w-full relative no-drag-region">
        {isTopTabBarVisible && <TopTabBar />}
        <SpatialCanvas />
      </div>

      {/* New Profile Modal */}
      <AuthModal />
      {showNewProfileModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onPointerDown={(e) => e.stopPropagation()}
          >
              <div className="bg-surface_container_highest border border-white/10 rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-semibold text-white mb-2">Save New Profile</h3>
                  <p className="text-sm text-on_surface_variant mb-4">Name your current spatial workspace tab layout.</p>
                  
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('profileName') as string;
                      if (name.trim()) {
                          useCanvasStore.getState().saveProfileAs(name.trim());
                      }
                      setShowNewProfileModal(false);
                  }}>
                      <input 
                          autoFocus
                          type="text" 
                          name="profileName"
                          placeholder="e.g. Marketing Dashboard" 
                          required
                          className="w-full bg-surface_container_lowest border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary/50 transition-colors mb-4"
                      />
                      <div className="flex justify-end gap-2">
                          <button 
                              type="button" 
                              onClick={() => setShowNewProfileModal(false)}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 shadow-md transition-colors"
                          >
                              Save Canvas
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
    </div>
  )
}

function App() {
  return (
    <SupabaseAuthProvider
        supabaseClient={supabase}
    >
      <AppContent />
    </SupabaseAuthProvider>
  )
}

export default App
```

---

### [files-to-touch] src/renderer/src/components/canvas/SpatialCanvas.tsx

```tsx
/**
 * @purpose xyflow ReactFlow host: registers nodeTypes, manages viewport save, sleeping-tab hysteresis, context menu, and custom canvas events.
 * @why xyflow requires a single ReactFlowProvider; canvas-level events are centralized here to avoid each node type subscribing independently. This component is also the mounting surface for all future agent widgets (RemoteAgentWidget, GoogleSheetWidget, TerminalWidget, FileDiffWidget, TodoListWidget) as the agent-operator canvas evolves.
 * @role component
 * @exports SpatialCanvas
 * @uses @xyflow/react, useCanvasStore, BrowserWidgetNode, SettingsWidgetComponent, TextNodeComponent, Omnibar
 * @stability experimental
 * @gotchas Duplicate flushSpatialEvents setInterval(1500ms) — App.tsx also has one; calls setTopTabBarVisible via (state: any) cast — existence not verified, may crash on fullscreen toggle if missing; handleSpawnCanvases hardcodes type:'browser_widget' (canvases widget is dead)
 */
import React, { useEffect, useState } from 'react'
import { ReactFlow, Background, MiniMap, Controls, useReactFlow, ReactFlowProvider } from '@xyflow/react'
import type { NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BrowserWidgetNode } from '../shapes/BrowserWidget/BrowserWidgetNode'
import { SettingsWidgetComponent } from '../shapes/SettingsWidget/SettingsWidgetComponent'
import { TextNodeComponent } from '../shapes/TextNode/TextNodeComponent'
import { useCanvasStore } from '../../store/useCanvasStore'
import type { AppNode } from '../../store/useCanvasStore'
import { Plus, Maximize, Type } from 'lucide-react'
import { Omnibar } from '../ui/Omnibar'

// Define our completely custom node components to inject into ReactFlow
const nodeTypes: NodeTypes = {
  browser_widget: BrowserWidgetNode,
  text_node: TextNodeComponent,
  settingsWidget: SettingsWidgetComponent,
//  settings_widget: SettingsWidgetNode,
//  canvases_widget: CanvasesWidgetNode,
}

const CanvasContent = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, updateWidgetData, lastViewport } = useCanvasStore()
  const { setCenter, screenToFlowPosition, getZoom, getViewport, setViewport } = useReactFlow()
  const { setOmnibarOpen, isSpacebarHeld, isAppMaximized } = useCanvasStore()
  
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

  // Restore initial viewport from the store explicitly
  useEffect(() => {
    if (lastViewport) {
      setViewport({ x: lastViewport.x, y: lastViewport.y, zoom: lastViewport.zoom });
    }
  }, [setViewport]);

  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuScreenPos, setContextMenuScreenPos] = useState({ x: 0, y: 0 })
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

  const onPaneContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuOpen(true);
    setContextMenuScreenPos({ x: e.clientX, y: e.clientY });
    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setContextMenuPos(flowPos);
  };

  useEffect(() => {
    const handleCloseContextMenu = () => setContextMenuOpen(false);
    window.addEventListener('blur', handleCloseContextMenu);
    window.addEventListener('close-context-menu', handleCloseContextMenu);
    return () => {
      window.removeEventListener('blur', handleCloseContextMenu);
      window.removeEventListener('close-context-menu', handleCloseContextMenu);
    };
  }, []);

  // Global Flusher for Spatialos Background Synchronization
  useEffect(() => {
    const flusherId = setInterval(() => {
      const state = useCanvasStore.getState()
      state.flushSpatialEvents()
    }, 1500)
    return () => clearInterval(flusherId)
  }, [])

  // Handle global events dispatched from TopTabBar or elsewhere
  useEffect(() => {
    const handleSpawnCenter = () => {
      const viewport = getViewport()
      const scale = viewport.zoom
      
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const centerXV = windowWidth / 2
      const centerYV = windowHeight / 2
      
      const visibleX = (centerXV - viewport.x) / scale
      const visibleY = (centerYV - viewport.y) / scale
      
      useCanvasStore.getState().addWidget('about:blank', visibleX, visibleY)
    }
    const handleSpawnTextNodeCenter = () => {
      const viewport = getViewport()
      const scale = viewport.zoom
      
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const centerXV = windowWidth / 2
      const centerYV = windowHeight / 2
      
      const visibleX = (centerXV - viewport.x) / scale
      const visibleY = (centerYV - viewport.y) / scale
      
      useCanvasStore.getState().addTextNode(visibleX, visibleY)
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

    
    const handleOpenOmniSearch = () => {
      const viewport = getViewport()
      const scale = viewport.zoom
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const centerXV = windowWidth / 2
      const centerYV = windowHeight / 2
      const visibleX = (centerXV - viewport.x) / scale
      const visibleY = (centerYV - viewport.y) / scale
      setOmnibarOpen(true, { x: visibleX, y: visibleY })
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

    const handleFullscreenToggled = (e: any) => {
        const { tabId, isFullScreen } = e.detail;
        const widget = nodes.find(n => n.id === tabId)
        if (!widget) return;
        
        useCanvasStore.getState().setTopTabBarVisible(!isFullScreen);
        
        if (isFullScreen) {
            // Do NOT re-center. toggleFullscreen already computed the exact viewport boundaries.
        } else {
            // Restore previous sizing if available
            updateWidgetData(tabId, { 
                interactionState: 'active', 
                w: widget.data.tabHistoryW || 800, 
                h: widget.data.tabHistoryH || 600 
            })
            // We can re-center to the restored widget center if desired, or skip it
        }
    }
        
    const handleSpawnSettings = () => {
        const viewport = getViewport()
        const scale = viewport.zoom
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const centerXV = windowWidth / 2
        const centerYV = windowHeight / 2
        
        const visibleX = (centerXV - viewport.x) / scale - 200 // offset for widget half width (400/2)
        const visibleY = (centerYV - viewport.y) / scale - 250 // offset for widget half height (500/2)
        
        useCanvasStore.getState().addSettingsWidget(visibleX, visibleY)
    }

    window.addEventListener('spawn-tab-center', handleSpawnCenter)
    window.addEventListener('spawn-text-node-center', handleSpawnTextNodeCenter)
    window.addEventListener('spawn-settings-widget', handleSpawnSettings)
    window.addEventListener('spawn-canvases-widget', handleSpawnCanvases)
    window.addEventListener('open-omni-search', handleOpenOmniSearch)
    window.addEventListener('pan-to-widget' as any, handlePanToWidget)
    window.addEventListener('fullscreen-toggled-client', handleFullscreenToggled)

    return () => {
      window.removeEventListener('spawn-tab-center', handleSpawnCenter)
      window.removeEventListener('spawn-text-node-center', handleSpawnTextNodeCenter)
      window.removeEventListener('spawn-settings-widget', handleSpawnSettings)
      window.removeEventListener('spawn-canvases-widget', handleSpawnCanvases)
      window.removeEventListener('open-omni-search', handleOpenOmniSearch)
      window.removeEventListener('pan-to-widget' as any, handlePanToWidget)
      window.removeEventListener('fullscreen-toggled-client', handleFullscreenToggled)
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

  // Track and save viewport changes with debounce
  const { setLastViewport } = useCanvasStore()
  const [moveTimeout, setMoveTimeout] = useState<any>(null)
  const onMoveEnd = (_event: any, viewport: { x: number; y: number; zoom: number }) => {
    if (moveTimeout) clearTimeout(moveTimeout)
    const timeout = setTimeout(() => {
      setLastViewport(viewport)
    }, 500)
    setMoveTimeout(timeout)
  }

  return (
    <div className="w-full h-full relative">
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={() => setContextMenuOpen(false)}
        onPaneContextMenu={onPaneContextMenu}
        onConnect={onConnect}
        onMoveEnd={(e, v) => onMoveEnd(e, v)}
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
        {useCanvasStore((state) => state.showCanvasGrid) && (
          <Background 
            color="rgba(255,255,255,0.03)" 
            size={1} 
            gap={40} 
            className="bg-[#131315]"
          />
        )}
        
        {/* We use ReactFlow's natively styled components, customized heavily to match LiquidGlass Dopomogai style */}
        {useCanvasStore((state) => state.isTopTabBarVisible) && !isAppMaximized && (
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
        )}

        {/* Optional dev tool, hidden for V1 - let's add back hotkeys later if desired 
        <Controls className="!bg-[#242424] !border !border-white/10 !fill-white" /> */}
      </ReactFlow>

      {contextMenuOpen && (
          <div className="absolute bg-[#242424] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)] rounded py-1 w-48 animate-in fade-in zoom-in duration-100 z-[9999]"
            style={{
                top: contextMenuScreenPos.y,
                left: contextMenuScreenPos.x,
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
              <button 
                onClick={() => {
                    setContextMenuOpen(false)
                    // Pass the true screen coordinates for mathematical insertion, not visual UI placement
                    setOmnibarOpen(true, contextMenuPos) 
                }}
                className="w-full text-left px-3 py-2 text-sm text-on_surface_variant hover:text-white hover:bg-primary/20 transition-colors flex flex-row items-center gap-2"
              >
                  <Plus size={14} /> Spawn Tab Here
              </button>
              <button 
                onClick={() => {
                    setContextMenuOpen(false)
                    useCanvasStore.getState().addTextNode(contextMenuPos.x, contextMenuPos.y)
                }}
                className="w-full text-left px-3 py-2 text-sm text-on_surface_variant hover:text-white hover:bg-primary/20 transition-colors flex flex-row items-center gap-2"
              >
                  <Type size={14} /> Add Text Note
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
            <Omnibar />
            <CanvasContent />
        </ReactFlowProvider>
    )
}
```

---

### [files-to-touch] src/renderer/src/store/useCanvasStore.ts

```ts
/**
 * @purpose Central Zustand store: nodes, edges, undo/redo, viewport, render culling, sync queue, Supabase realtime, and workspace profile management.
 * @why Single-store pattern co-locates all canvas state and avoids prop-drilling. This store is the runtime hub for the agent-operator canvas — Phase B will route incoming SSE events through here to spawn TerminalWidget, FileDiffWidget, TodoListWidget, and RemoteAgentWidget nodes.
 * @role store
 * @exports useCanvasStore, CanvasStore, BrowserWidgetData, TextNodeData, AppNode, BrowserAppNode, TextAppNode, WorkspaceProfile, SpatialTimelineEvent
 * @uses zustand, idb-keyval, @xyflow/react, supabase, syncSpatialEvents
 * @stability experimental
 * @gotchas Module-level saveTimeout is a singleton — breaks if store is instantiated more than once; hardcoded UUID '00000000-0000-0000-0000-000000000000' for canvas_id everywhere; flushSyncQueue referenced in App.tsx but the method is named flushSpatialEvents — mismatch is the broken-on-start culprit
 */
// V2 Store utilizing @xyflow/react native types
import { create } from 'zustand'
import { set as idbSet, get as idbGet } from 'idb-keyval'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { Connection, Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react'

import { supabase } from '../lib/supabase'
import { syncSpatialEvents } from '../api/api'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type WidgetState = 'active' | 'sleeping' | 'minimized'

// We map our SpatialWidget directly onto the React Flow 'Node.data' object type
export interface BrowserWidgetData extends Record<string, unknown> {
  url: string
  title: string
  faviconUrl: string
  screenshotBase64: string | null
  w: number
  h: number
  tabHistoryW?: number
  tabHistoryH?: number
  _preFullscreenX?: number
  _preFullscreenY?: number
  interactionState: WidgetState
  lastActive: number
  tabHistory: string[]
  currentHistoryIndex: number
}

export interface TextNodeData extends Record<string, unknown> {
  url?: string;
  title?: string;
  text: string;
  w: number;
  h: number;
  interactionState: WidgetState;
}

// React Flow strictly separates geometric math (Node) from business logic (data)
export interface SpatialTimelineEvent {
  id?: string;
  spatial_workspace_id: string;
  widget_id: string;
  agent_id?: string | null;
  action_type: string;
  old_state: any;
  new_state: any;
  timestamp?: string;
}

export type BrowserAppNode = Node<BrowserWidgetData, 'browser_widget'>;
export type TextAppNode = Node<TextNodeData, 'text_node'>;
export type AppNode = BrowserAppNode | TextAppNode;

export interface WorkspaceProfile {
  id: string
  name: string
  nodes: AppNode[]
  edges: Edge[]
}

export interface CanvasStore {
  isAppMaximized: boolean
  setIsAppMaximized: (maximized: boolean) => void
  // React Flow Core State
  nodes: AppNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  // Profile State
  currentProfileId: string
  profiles: WorkspaceProfile[]
  
  visitorId: string | null
  setVisitorId: (id: string) => void
  
  isOmnibarOpen: boolean
  isSpacebarHeld: boolean
  omnibarPosition: { x: number; y: number } | null

 // Theme State
 theme: 'light' | 'dark'
 setTheme: (theme: 'light' | 'dark') => void
 // Default Tab Size State
 defaultTabWidth: number
 defaultTabHeight: number
 setDefaultTabSize: (width: number, height: number) => void

  isMinimalHeader: boolean
  toggleHeaderMode: () => void
  showCanvasGrid: boolean
  toggleCanvasGrid: () => void
  searchEngine: 'google' | 'duckduckgo' | 'perplexity'
  setSearchEngine: (engine: 'google' | 'duckduckgo' | 'perplexity') => void
  
  addWidget: (url?: string, x?: number, y?: number) => void
  addSettingsWidget: (x: number, y: number) => void
  addTextNode: (x?: number, y?: number) => void
  updateWidgetData: (id: string, dataUpdates: Partial<BrowserWidgetData & TextNodeData>) => void
  toggleFullscreen: (id: string) => void
  removeWidget: (id: string) => void
  duplicateNode: (id: string) => void
  
  undo: () => void
  redo: () => void
  undoStack: AppNode[][]
  redoStack: AppNode[][]
  
  setOmnibarOpen: (open: boolean, position?: { x: number; y: number } | null) => void
  setSpacebarHeld: (held: boolean) => void

  activeNodeIds: string[]
  calculateCulling: () => void

  // Sync Engine State
  currentCanvasId: string
  currentSequence: number
  pendingSpatialEvents: any[]
  queueSpatialEvent: (action_type: string, payload: any) => void
  flushSpatialEvents: () => void

  lastViewport: { x: number; y: number; zoom: number }
  setLastViewport: (viewport: { x: number; y: number; zoom: number }) => void
  loadInitialState: () => Promise<void>
  loadProfile: (profileId: string) => void

  realtimeSubscription: RealtimeChannel | null
  initializeTimelineSubscription: () => void
}

let saveTimeout: any

export const useCanvasStore = create<CanvasStore>((set, get) => {
  const queueEvent = (widgetId: string, actionType: string, oldState: any, newState: any) => {
    const { currentProfileId, pendingSpatialEvents } = get();
    
    const event: SpatialTimelineEvent = {
        spatial_workspace_id: currentProfileId,
        widget_id: widgetId,
        action_type: actionType,
        old_state: oldState,
        new_state: newState,
        timestamp: new Date().toISOString()
    };
    
    const newQueue = [...pendingSpatialEvents, event];
    set({
        pendingSpatialEvents: newQueue
    });
    
    // Asynchronously write to idb-keyval to persist across reloads
    idbSet('pendingSpatialEvents', newQueue).catch(err => {
      console.error('Failed to save spatial events to IndexedDB', err);
    });
  };

  return {
  currentCanvasId: 'default-canvas-uuid',
  currentSequence: 0,
  pendingSpatialEvents: [],
  queueSpatialEvent: (action_type: string, delta_payload: any) => {
    const { currentCanvasId, currentSequence, pendingSpatialEvents } = get();
    const newSequence = currentSequence + 1;
    
    const event = {
      canvas_id: currentCanvasId,
      sequence: newSequence,
      action_type,
      delta_payload,
      is_agent: false
    };
    
    const newQueue = [...pendingSpatialEvents, event];
    set({
      currentSequence: newSequence,
      pendingSpatialEvents: newQueue
    });
    
    // Asynchronously write to idb-keyval to persist across reloads
    idbSet('pendingSpatialEvents', newQueue).catch(err => {
      console.error('Failed to save spatial events to IndexedDB', err);
    });
  },

  flushSpatialEvents: async () => {
    const queue = get().pendingSpatialEvents;
    if (queue.length === 0) return;

    // Optional early check, avoid failing the console pointlessly if completely offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
       console.log('Currently offline, holding spatial events in IndexedDB buffer.');
       return;
    }

    try {
         const visitorId = get().visitorId;
         await syncSpatialEvents(queue, visitorId);
         
         // Only clear local queue and persistent store on success
         const currentQueue = get().pendingSpatialEvents;
         const remainingQueue = currentQueue.filter(
           currentEvent => !queue.some(flushedEvent => flushedEvent.sequence === currentEvent.sequence)
         );
         
         set({ pendingSpatialEvents: remainingQueue });
         await idbSet('pendingSpatialEvents', remainingQueue);
         
         if (typeof supabase !== 'undefined' && supabase) {
             // Now also update the widgets if necessary to ensure spatial_widgets is in sync
             const { nodes } = get();
         
         // Collect all unique widget IDs that were mutated in this batch
         const modifiedWidgetIds = new Set<string>();
         
         for (const event of queue) {
             const payload = event.delta_payload;
             if (payload && payload.id) {
                 modifiedWidgetIds.add(payload.id);
             }
         }
         
         if (modifiedWidgetIds.size > 0) {
             const widgetsToUpsert = nodes
               .filter(node => modifiedWidgetIds.has(node.id))
               .map(w => ({
                 id: w.id,
                 canvas_id: '00000000-0000-0000-0000-000000000000', // Requires valid UUID matching active_canvas_id
                 widget_type: w.type,
                 url: w.data?.url || '',
                 title: w.data?.title || '',
                 position_x: w.position.x,
                 position_y: w.position.y,
                 width: w.data?.w || w.data?.width || 0,
                 height: w.data?.h || w.data?.height || 0,
                 interaction_state: w.data?.interactionState || 'active',
                 updated_at: new Date().toISOString()
               }));
             
             if (widgetsToUpsert.length > 0) {
                 const { error: widgetError } = await supabase.schema('spatial_os').from('spatial_widgets').upsert(widgetsToUpsert, { onConflict: 'id' });
                 if (widgetError) console.error('Failed to upsert widgets:', widgetError);
             }
         }
         
      } else {
         console.log('Mock flush spatial timeline events:', queue);
      }
    } catch (e) {
      console.error('Failed to flush sync queue, retaining in IndexedDB', e);
      // We don't need to do anything with the pendingSpatialEvents array here; we left it intact.
    }
  },

  showCanvasGrid: true,
  toggleCanvasGrid: () => set((state) => ({ showCanvasGrid: !state.showCanvasGrid })),
  searchEngine: 'google',
  setSearchEngine: (engine) => set({ searchEngine: engine }),
  isMinimalHeader: false,
  toggleHeaderMode: () => set((state) => ({ isMinimalHeader: !state.isMinimalHeader })),
  isAppMaximized: false,
  setIsAppMaximized: (maximized) => set({ isAppMaximized: maximized }),
  nodes: [],
  edges: [],
  currentProfileId: 'default',
  profiles: [{ id: 'default', name: 'Default Profile', nodes: [], edges: [] }],
  visitorId: null,
  setVisitorId: (id) => set({ visitorId: id }),
  activeNodeIds: [],
  isOmnibarOpen: false,
  omnibarPosition: null, // this holds physical canvas coordinates, NOT visual css integers!
 isSpacebarHeld: false,
  theme: 'dark',
  defaultTabWidth: 800,
  defaultTabHeight: 600,
  setDefaultTabSize: (width, height) => set({ defaultTabWidth: width, defaultTabHeight: height }),

  lastViewport: { x: 0, y: 0, zoom: 1 },

  setTheme: (theme) => set({ theme }),

  calculateCulling: () => {
    const { lastViewport, nodes } = get();
    
    // Culling viewport: Add a generous margin of 1 screen width/height around the viewed area
    // to let nodes "warm up" before they actually enter the screen.
    const vpX = -lastViewport.x / lastViewport.zoom;
    const vpY = -lastViewport.y / lastViewport.zoom;
    const vpW = window.innerWidth / lastViewport.zoom;
    const vpH = window.innerHeight / lastViewport.zoom;

    const marginX = vpW;
    const marginY = vpH;

    const cullBox = {
      x1: vpX - marginX,
      y1: vpY - marginY,
      x2: vpX + vpW + marginX,
      y2: vpY + vpH + marginY
    };

    const activeIds = nodes.filter(node => {
      const w = node.data.w as number || 300;
      const h = node.data.h as number || 200;
      return !(node.position.x > cullBox.x2 || node.position.x + w < cullBox.x1 || node.position.y > cullBox.y2 || node.position.y + h < cullBox.y1);
    }).map(n => n.id);

    set({ activeNodeIds: activeIds });
  },

  undoStack: [],
  redoStack: [],

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previousNodes = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    const newRedoStack = [...state.redoStack, state.nodes];
    const newState = { nodes: previousNodes, undoStack: newUndoStack, redoStack: newRedoStack };
    persistState({ ...state, ...newState });
    return newState;
  }),

  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state;
    const nextNodes = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    const newUndoStack = [...state.undoStack, state.nodes];
    const newState = { nodes: nextNodes, undoStack: newUndoStack, redoStack: newRedoStack };
    persistState({ ...state, ...newState });
    return newState;
  }),

  // React Flow internal reconciliation overrides
  onNodesChange: (changes) => {
    set((state) => {
      // Only track physical movement in the undo stack
      const isPositionChange = changes.some(c => c.type === 'position' && !c.dragging);
      const newUndoStack = isPositionChange ? [...state.undoStack, state.nodes].slice(-50) : state.undoStack;
      const newNodes = applyNodeChanges(changes, state.nodes);
      const newState = {
        nodes: newNodes,
        undoStack: newUndoStack,
        redoStack: isPositionChange ? [] : state.redoStack
      };
      persistState({ ...state, ...newState })

      changes.forEach(change => {
        if (change.type === 'position' && !change.dragging) {
          const oldNode = state.nodes.find(n => n.id === change.id);
          const newNode = newNodes.find(n => n.id === change.id);
          if (oldNode && newNode) {
            queueEvent(change.id, 'widget_moved', oldNode, newNode);
            get().queueSpatialEvent('WIDGET_MOVE', { id: change.id, x: newNode.position.x, y: newNode.position.y });
          }
        }
      });

      return newState;
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    persistState(get())
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
    persistState(get())
  },

 addWidget: (url = 'https://google.com', x?: number, y?: number) => {
   const id = `browser_widget_${Date.now()}`
   
   const { defaultTabWidth, defaultTabHeight, lastViewport } = get()
   
   // Calculate center of viewport if coordinates are not provided
   const spawnX = x !== undefined ? x : (-lastViewport.x + window.innerWidth / 2) / lastViewport.zoom - (defaultTabWidth / 2);
   const spawnY = y !== undefined ? y : (-lastViewport.y + window.innerHeight / 2) / lastViewport.zoom - (defaultTabHeight / 2);

   const newNode: AppNode = {
     id,
      type: 'browser_widget', // Matches nodeTypes in ReactFlow instance
      position: { x: spawnX, y: spawnY }, // React flow handles position natively
      data: {
        url,
        title: 'New Tab',
        faviconUrl: '',
       screenshotBase64: null,
       w: defaultTabWidth,
       h: defaultTabHeight,
       interactionState: 'active',
        lastActive: Date.now(),
        tabHistory: [url],
        currentHistoryIndex: 0
      }
    }
    
    set((state) => {
      const newNodes = [...state.nodes, newNode]
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      const newState = { nodes: newNodes, undoStack: newUndoStack, redoStack: [] }
      queueEvent(id, 'widget_created', null, newNode);
      get().queueSpatialEvent('WIDGET_SPAWN', { ...newNode });
      persistState({ ...state, ...newState })
      return newState
    })
  },

  addSettingsWidget: (x, y) => {
    const id = 'system-widget-settings'
    
    set((state) => {
      const existingSettingsNode = state.nodes.find(n => n.id === id)
      if (existingSettingsNode) {
        // Bring to front or just focus logic if needed
        return state
      }

      const newNode = {
        id,
        type: 'settingsWidget',
        position: { x, y },
        data: {
          w: 800,
          h: 600,
          interactionState: 'active'
        }
      } as any // We override AppNode type strictly for the settings node which is allowed loosely in layout

      const newNodes = [...state.nodes, newNode]
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      const newState = { nodes: newNodes, undoStack: newUndoStack, redoStack: [] }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  addTextNode: (x?: number, y?: number) => {
    const id = `text_node_${Date.now()}`
    
    const { lastViewport } = get()
    const spawnX = x !== undefined ? x : (-lastViewport.x + window.innerWidth / 2) / lastViewport.zoom - (300 / 2);
    const spawnY = y !== undefined ? y : (-lastViewport.y + window.innerHeight / 2) / lastViewport.zoom - (150 / 2);

    const newNode: AppNode = {
      id,
      type: 'text_node',
      position: { x: spawnX, y: spawnY },
      data: {
        text: '',
        w: 300,
        h: 150,
        interactionState: 'active'
      }
    }
    
    set((state) => {
      const newNodes = [...state.nodes, newNode]
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      const newState = { nodes: newNodes, undoStack: newUndoStack, redoStack: [] }
      queueEvent(id, 'widget_created', null, newNode);
      get().queueSpatialEvent('WIDGET_SPAWN', { ...newNode });
      persistState({ ...state, ...newState })
      return newState
    })
  },

  toggleFullscreen: (id) => {
    set((state) => {
      const isMaxing = !state.isAppMaximized;
      const viewport = state.lastViewport;
      
      const newNodes = state.nodes.map((node) => {
        if (node.id === id) {
          // If we are currently maximizing
          if (isMaxing) {
              // We want our element to exactly fill the window
              // So, flow coordinates must be what gives us 0,0 on screen
              const targetFlowX = -viewport.x / viewport.zoom;
              const targetFlowY = -viewport.y / viewport.zoom;
              
              return {
                ...node,
                position: { x: targetFlowX, y: targetFlowY },
                data: {
                  ...node.data,
                  w: window.innerWidth / viewport.zoom,
                  h: window.innerHeight / viewport.zoom,
                  tabHistoryW: node.data.w,
                  tabHistoryH: node.data.h,
                  _preFullscreenX: node.position.x,
                  _preFullscreenY: node.position.y
                }
              } as AppNode;
          } else {
              // If we are un-maximizing, restoring
              return {
                ...node,
                position: { 
                  x: node.data._preFullscreenX !== undefined ? node.data._preFullscreenX : node.position.x, 
                  y: node.data._preFullscreenY !== undefined ? node.data._preFullscreenY : node.position.y 
                },
                data: {
                  ...node.data,
                  w: node.data.tabHistoryW || 800,
                  h: node.data.tabHistoryH || 600,
                }
              } as AppNode;
          }
        }
        return node;
      });
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50);
      const newState = { nodes: newNodes, undoStack: newUndoStack, isAppMaximized: isMaxing };
      persistState({ ...state, ...newState });
      return newState;
    });
  },

  updateWidgetData: (id, dataUpdates) => {
    set((state) => {
      let oldNodeData: AppNode | undefined;
      const newNodes = state.nodes.map((node) => {
        if (node.id === id) {
          oldNodeData = node;
          // It's crucial to create a new object here for React Flow to register the update
          return {
            ...node,
            data: {
              ...node.data,
              ...dataUpdates,
            },
          } as AppNode;
        }
        return node;
      });

      // Track size modifications or major interactions to history
      let newUndoStack = state.undoStack
      if ('w' in dataUpdates || 'h' in dataUpdates || 'interactionState' in dataUpdates) {
          newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      }

      if (oldNodeData) {
        queueEvent(id, 'widget_updated', oldNodeData, newNodes.find((n) => n.id === id));
      }
      get().queueSpatialEvent('WIDGET_UPDATE', { id, ...dataUpdates });

      const newState = { nodes: newNodes, undoStack: newUndoStack }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  removeWidget: (id) => {
    set((state) => {
      const nodeToRemove = state.nodes.find(n => n.id === id);
      const newNodes = state.nodes.filter(n => n.id !== id)
      // also remove any edges connected to this widget if we add them later
      const newEdges = state.edges.filter(e => e.source !== id && e.target !== id)
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      
      if (nodeToRemove) {
        queueEvent(id, 'widget_deleted', nodeToRemove, null);
      }
      get().queueSpatialEvent('WIDGET_DELETE', { id });

      const newState = { nodes: newNodes, edges: newEdges, undoStack: newUndoStack, redoStack: [] }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  duplicateNode: (id) => {
    set((state) => {
      const targetNode = state.nodes.find(n => n.id === id)
      if (!targetNode) return state;

      const newNode = {
        ...targetNode,
        id: `${targetNode.type}_${Date.now()}`,
        position: {
          x: (targetNode.position?.x ?? 0) + 50,
          y: (targetNode.position?.y ?? 0) + 50
        },
        data: {
          ...targetNode.data,
          interactionState: 'active'
        }
      } as AppNode;

      const newNodes = [...state.nodes, newNode]
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      const newState = { nodes: newNodes, undoStack: newUndoStack, redoStack: [] }
      queueEvent(newNode.id, 'widget_created', null, newNode);
      get().queueSpatialEvent('WIDGET_DUPLICATE', { original_id: id, ...newNode });
      persistState({ ...state, ...newState })
      return newState
    })
  },

  setOmnibarOpen: (open, position = null) => set({ isOmnibarOpen: open, omnibarPosition: position }),
  
  setSpacebarHeld: (held) => set({ isSpacebarHeld: held }),

  setLastViewport: (viewport) => {
    set({ lastViewport: viewport })
    get().calculateCulling()
    persistState(get())
  },

  loadInitialState: async () => {
    try {
      // First load regular UI state
      const stored = await idbGet<Partial<CanvasStore>>('spatial-canvas-v2-state')
      if (stored) {
        set({ ...stored, isOmnibarOpen: false, omnibarPosition: null } as any)
        if (stored.theme) {
          document.documentElement.setAttribute('data-theme', stored.theme);
        }
      }
      
      // Then load offline buffer queue
      const storedQueue = await idbGet<any[]>('pendingSpatialEvents');
      if (storedQueue && Array.isArray(storedQueue) && storedQueue.length > 0) {
        set((state) => ({ 
          pendingSpatialEvents: [...storedQueue, ...state.pendingSpatialEvents],
          currentSequence: Math.max(state.currentSequence, ...storedQueue.map((e: any) => e.sequence || 0))
        }));
      }

      get().initializeTimelineSubscription()
    } catch (e) {
      console.error('Failed to load local DB', e)
    }
  },

  loadProfile: (profileId: string) => {
      set((state) => {
          const profile = state.profiles.find(p => p.id === profileId)
          if (!profile) return state
          
          const newState = { 
              currentProfileId: profileId, 
              nodes: profile.nodes || [],
              edges: profile.edges || []
          }
          persistState({ ...state, ...newState })
          return newState
      })
  },

  realtimeSubscription: null,
  initializeTimelineSubscription: () => {
    const { visitorId, realtimeSubscription } = get();
    
    // Prevent infinite rebinding
    if (realtimeSubscription) return;
    if (!supabase) return;

    const channel = supabase
      .channel('spatial_timeline_sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'spatial_os',
          table: 'spatial_timeline'
        },
        (payload) => {
          // Always fetch current states again to avoid stale closure issues
          const currentVisitorId = get().visitorId;
          const row = payload.new;
          
          // 4a: Don't echo out our own changes
          if (row.actor_id === currentVisitorId && currentVisitorId !== null) {
            return;
          }
          
          // 4b: Handle remote events based on action_type
          if (row.action_type === 'WIDGET_MOVE') {
             const state = get();
             const targetNodeId = row.widget_id || row.delta_payload?.id;
             if (!targetNodeId) return;
             
             // Only update if the node exists and is tracking coordinates
             set({
                nodes: state.nodes.map(node => {
                   if (node.id === targetNodeId) {
                       return {
                           ...node,
                           position: {
                               x: row.new_state?.x || row.delta_payload?.x || node.position.x,
                               y: row.new_state?.y || row.delta_payload?.y || node.position.y
                           }
                       } as AppNode
                   }
                   return node;
                })
             });
          }
        }
      )
      .subscribe();
      
    set({ realtimeSubscription: channel });
  }
};
})

// Subscribe to theme changes to update the DOM
useCanvasStore.subscribe((state, prevState) => {
  if (state.theme !== prevState.theme) {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
});

function persistState(state: CanvasStore) {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    
    // Auto-update the current profile in the profiles list
    let profilesToSave = state.profiles || []
    if (state.currentProfileId && state.nodes) {
        profilesToSave = profilesToSave.map(p => 
            p.id === state.currentProfileId 
                ? { ...p, nodes: state.nodes as AppNode[], edges: state.edges as Edge[] } 
                : p
        )
    }

   const stateToSave = {
       nodes: state.nodes,
       edges: state.edges,
       profiles: profilesToSave,
       currentProfileId: state.currentProfileId,
       theme: state.theme,
       lastViewport: state.lastViewport,
       defaultTabWidth: state.defaultTabWidth,
       defaultTabHeight: state.defaultTabHeight,
       isMinimalHeader: state.isMinimalHeader,
       showCanvasGrid: state.showCanvasGrid,
       searchEngine: state.searchEngine
   }

    // Local persistence (V2 uses new key to avoid clashing with V1 TLDraw store)
    idbSet('spatial-canvas-v2-state', stateToSave).catch(console.error)
    
    if (state.currentProfileId && typeof supabase !== 'undefined' && supabase) {
        // Extract the user UUID somehow or assume anon for tracking
        syncToSupabase(state)
    }
  }, 1000)
}

async function syncToSupabase(state: CanvasStore) {
  if (!state.currentProfileId) return
  
  try {
    // 1. Sync Workspace Base Configuration
    await supabase
      .schema('spatial_os')
      .from('spatial_workspaces')
      .upsert({
        id: '00000000-0000-0000-0000-000000000000', // Requires valid UUID for current profile test
        workspace_id: '00000000-0000-0000-0000-000000000000',
        profile_name: state.profiles.find(p => p.id === state.currentProfileId)?.name || 'Default Profile',
        active_canvas_id: '00000000-0000-0000-0000-000000000000', // Mock link
        theme_engine_state: { theme: state.theme },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      
    // 2. Push widgets
    const currentWidgets = state.nodes.filter(n => n.type === 'browser_widget') as BrowserAppNode[]
    
    if (currentWidgets.length > 0) {
        const widgetPayload = currentWidgets.map(w => ({
            id: w.id,
            canvas_id: '00000000-0000-0000-0000-000000000000', // Requires valid UUID 
            widget_type: w.type,
            url: w.data.url,
            title: w.data.title,
            position_x: w.position.x,
            position_y: w.position.y,
            width: w.data.w,
            height: w.data.h,
            interaction_state: w.data.interactionState,
            snapshot_url: w.data.screenshotBase64,
            updated_at: new Date().toISOString(),
            last_active_at: w.data.lastActive ? new Date(w.data.lastActive).toISOString() : new Date().toISOString()
        }))
        
        await supabase.schema('spatial_os').from('spatial_widgets').upsert(widgetPayload, { onConflict: 'id' })
        
        // 3. Action Timeline
        // Record actions if physically moved outside view bounds (hysteresis logic)
        const vZoom = state.lastViewport.zoom || 1;
        const viewMinX = -state.lastViewport.x / vZoom;
        const viewMinY = -state.lastViewport.y / vZoom;
        const viewMaxX = viewMinX + window.innerWidth / vZoom;
        const viewMaxY = viewMinY + window.innerHeight / vZoom;
        
        const timelinePayload = [];
        let seq = 1000; // Mock sequence for detached boundary tracking
        for (const w of currentWidgets) {
            const isOutside = w.position.x < viewMinX || w.position.y < viewMinY || w.position.x > viewMaxX || w.position.y > viewMaxY;
            if (isOutside) {
                 timelinePayload.push({
                     canvas_id: '00000000-0000-0000-0000-000000000000',
                     sequence: seq++,
                     action_type: 'widget_moved_out_of_bounds',
                     delta_payload: { id: w.id, position_x: w.position.x, position_y: w.position.y, url: w.data.url },
                     actor_id: null,
                     is_agent: false,
                     created_at: new Date().toISOString()
                 });
            }
        }
        
        if (timelinePayload.length > 0) {
            const visitorId = state.visitorId;
            await syncSpatialEvents(timelinePayload, visitorId);
        }
    }
  } catch (error) {
    console.error('Failed to sync to Supabase SSOT:', error)
  }
}
```

---

### [direct-import] src/renderer/src/main.tsx

```tsx
/**
 * @purpose React DOM root mount; renders <App> inside StrictMode.
 * @why Standard Vite + React entry point required by the renderer process.
 * @role entry
 * @exports -
 * @uses App, ./index.css
 * @stability stable
 * @gotchas React 19 StrictMode double-invokes effects — interacts with webview lifecycle in BrowserWidgetNode
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

### [same-area-prior-work] src/renderer/src/store/useCanvasStore.test.ts

```ts
/**
 * @purpose Vitest unit tests for store: undo/redo, widget spawn math, and render culling logic.
 * @why Unit-test coverage for pure store logic without requiring the Electron runtime.
 * @role config
 * @exports -
 * @uses useCanvasStore, vitest
 * @stability experimental
 * @gotchas Fails if supabase client throws at import (e.g., missing env in CI); mocks idb-keyval and window but not all Electron globals
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCanvasStore } from './useCanvasStore'

// Mock DOM APIs used in store
vi.stubGlobal('window', {
  innerWidth: 1920,
  innerHeight: 1080
});

// Mock idb-keyval to prevent actual DB writes during test
vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined)
}));

// Mock MatchMedia (might be needed by React Flow internally if tested)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('useCanvasStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCanvasStore.getState()
    store.nodes = []
    store.edges = []
    store.undoStack = []
    store.redoStack = []
    store.activeNodeIds = []
    store.lastViewport = { x: 0, y: 0, zoom: 1 }
    // Update the store using setState rather than mutation for Zustand to pick it up properly
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      undoStack: [],
      redoStack: [],
      activeNodeIds: [],
      lastViewport: { x: 0, y: 0, zoom: 1 },
      defaultTabWidth: 800,
      defaultTabHeight: 600
    })
  })

  describe('History Engine (Undo/Redo)', () => {
    it('should correctly undo and redo node addition', () => {
      const store = useCanvasStore.getState()

      // Initial state check
      expect(useCanvasStore.getState().nodes.length).toBe(0)
      expect(useCanvasStore.getState().undoStack.length).toBe(0)

      // Trigger addNode
      useCanvasStore.getState().addWidget('https://example.com')
      
      const stateAfterAdd = useCanvasStore.getState()
      expect(stateAfterAdd.nodes.length).toBe(1)
      expect(stateAfterAdd.undoStack.length).toBe(1) // Should keep history of previous empty nodes state
      expect(stateAfterAdd.undoStack[0].length).toBe(0)

      // Trigger undo
      useCanvasStore.getState().undo()
      
      const stateAfterUndo = useCanvasStore.getState()
      expect(stateAfterUndo.nodes.length).toBe(0)
      expect(stateAfterUndo.undoStack.length).toBe(0)
      expect(stateAfterUndo.redoStack.length).toBe(1) // Now has the state with 1 node

      // Trigger redo
      useCanvasStore.getState().redo()
      
      const stateAfterRedo = useCanvasStore.getState()
      expect(stateAfterRedo.nodes.length).toBe(1)
      expect(stateAfterRedo.undoStack.length).toBe(1) // Empty node state back in past
      expect(stateAfterRedo.redoStack.length).toBe(0)
    })
  })

  describe('Spawn Math', () => {
    it('should calculate correct default coordinates centrally when coordinates are omitted', () => {
      // Setup viewport and store default sizes (window mocked as 1920x1080)
      useCanvasStore.setState({
        lastViewport: { x: -500, y: -200, zoom: 2 },
        defaultTabWidth: 800,
        defaultTabHeight: 600
      })

      useCanvasStore.getState().addWidget('https://example.com')
      
      const state = useCanvasStore.getState()
      const node = state.nodes[0]
      
      // Math: (-lastViewport.x + window.innerWidth / 2) / lastViewport.zoom - (defaultTabWidth / 2)
      // X: (500 + 1920 / 2) / 2 - (800 / 2) = (500 + 960) / 2 - 400 = 1460 / 2 - 400 = 730 - 400 = 330
      // Y: (200 + 1080 / 2) / 2 - (600 / 2) = (200 + 540) / 2 - 300 = 740 / 2 - 300 = 370 - 300 = 70
      
      expect(node.position.x).toBe(330)
      expect(node.position.y).toBe(70)
    })

    it('should calculate correct duplicate offset (sourceX + 50, sourceY + 50)', () => {
        useCanvasStore.setState({
            nodes: [
                {
                    id: 'test-node-1',
                    type: 'browser_widget',
                    position: { x: 100, y: 150 },
                    data: {
                        url: 'https://example.com',
                        w: 800,
                        h: 600
                    }
                }
            ] as any,
            undoStack: [],
            redoStack: []
        })

        useCanvasStore.getState().duplicateNode('test-node-1')

        const state = useCanvasStore.getState()
        expect(state.nodes.length).toBe(2)
        
        const duplicatedNode = state.nodes[1]
        expect(duplicatedNode.position.x).toBe(150) // 100 + 50
        expect(duplicatedNode.position.y).toBe(200) // 150 + 50
        expect(duplicatedNode.id).not.toBe('test-node-1')
        expect(duplicatedNode.data.url).toBe('https://example.com')
        expect(duplicatedNode.data.interactionState).toBe('active')
    })
  })

  describe('Culling Orchestrator', () => {
    it('should correctly include only nodes inside or bordering the cull box (with generous margin)', () => {
      vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 1000 });
      useCanvasStore.setState({ lastViewport: { x: 0, y: 0, zoom: 1 } })
      
      const nodeInside = { id: 'n1', position: { x: 500, y: 500 }, data: { w: 300, h: 200 } }
      const nodeBordering = { id: 'n2', position: { x: -1200, y: 500 }, data: { w: 300, h: 200 } }
      const nodeOutside1 = { id: 'n3', position: { x: 5000, y: 500 }, data: { w: 300, h: 200 } }
      const nodeOutside2 = { id: 'n4', position: { x: -1400, y: 500 }, data: { w: 300, h: 200 } }
      
      useCanvasStore.setState({ 
        nodes: [nodeInside, nodeBordering, nodeOutside1, nodeOutside2] as any 
      })

      useCanvasStore.getState().calculateCulling()

      const activeIds = useCanvasStore.getState().activeNodeIds
      expect(activeIds).toContain('n1')
      expect(activeIds).toContain('n2')
      expect(activeIds).not.toContain('n3')
      expect(activeIds).not.toContain('n4')
    })
  })
})
```

---

### [ipc-host] src/main/index.ts

```ts
/**
 * @purpose Electron main process: creates BrowserWindow, runs WebSocket server for AI backend, registers IPC handlers.
 * @why Electron requires a separate Node.js process for OS-level window and webview lifecycle; WebSocket chosen over IPC to allow external processes (AI agents) to connect directly.
 * @role main-process
 * @exports -
 * @uses electron, ws, @electron-toolkit/utils
 * @stability experimental
 * @gotchas webSecurity:false hardcoded ("V1 only"); WS port falls back to 8080 unconditionally; --remote-debugging-port=9222 always-on; no ipcMain handler for 'toggle-maximize' (renderer sends it — likely contributing to broken-on-start state)
 */
import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { WebSocketServer } from 'ws'

// AI Setup: remote debugging for DOM scraping
app.commandLine.appendSwitch('remote-debugging-port', '9222')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')

// Suppress dev security warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let mainWindow: BrowserWindow | null = null

// Setup WebSocket server for V2 AI Backend
function setupWebSocketServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080
  const wss = new WebSocketServer({ port })
  console.log(`WebSocket Server running on ws://localhost:${port}`)

  // Hardened WebView isolation
  app.on('web-contents-created', (event, contents) => {
    contents.on('before-input-event', (event, input) => {
      if (input.key === 'Shift') {
        const isHeld = input.type === 'keyDown'
        if (mainWindow) {
          mainWindow.webContents.send('shift-state-change', isHeld)
        }
      }
      
      if ((input.control || input.meta) && input.key.toLowerCase() === 'z') {
        if (input.type === 'keyDown') {
          event.preventDefault()
          if (mainWindow) {
            mainWindow.webContents.send(input.shift ? 'redo-action' : 'undo-action')
          }
        }
      }
      
      if ((input.control || input.meta) && input.key.toLowerCase() === 'x') {
        if (input.type === 'keyDown') {
          if (mainWindow) {
            mainWindow.webContents.send('cut-action')
          }
        }
      }
    })

  if (contents.getType() === 'webview') {
    contents.on('context-menu', (e, params) => {
      e.preventDefault();
      
      const menu = Menu.buildFromTemplate([
        { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
        { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
        { label: 'Cut', role: 'cut', enabled: params.editFlags.canCut },
        { type: 'separator' },
        { label: 'Select All', role: 'selectAll', enabled: params.editFlags.canSelectAll },
        { type: 'separator' },
        { 
          label: 'Spawn Empty Tab Here', 
          click: () => {
             if (mainWindow) mainWindow.webContents.send('spawn-tab-center')
          }
        }
      ])
      
      if (mainWindow) {
         menu.popup({ window: mainWindow || undefined })
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
        if (mainWindow) {
           mainWindow.webContents.send('spawn-tab-from-link', url)
        }
        return { action: 'deny' }
      })

      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl)
        if (parsedUrl.protocol === 'file:') {
          event.preventDefault()
          console.warn('Blocked file:// protocol navigation in webview')
        }
      })
  }
})

  wss.on('connection', (ws) => {
    console.log('AI Backend Connected')
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        console.log('Received from AI:', data)
        
        if (mainWindow) {
          mainWindow.webContents.send('ai-event', data)
        }
      } catch (e) {
        console.error('Invalid WS Message', e)
      }
    })
    
    ws.send(JSON.stringify({ status: 'connected', message: 'Spatial Browser Ready' }))
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      webviewTag: true,
      webSecurity: false, 
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    return { action: 'allow' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  setupWebSocketServer()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('toggle-omnibar', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.webContents.send('toggle-omnibar')
  }
})

ipcMain.on('show-webview-context-menu', (event, params) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const template = [
    { label: 'Reload Page', role: 'reload' as const },
    { type: 'separator' as const },
    { label: 'Copy', role: 'copy' as const },
    { label: 'Paste', role: 'paste' as const },
    { label: 'Cut', role: 'cut' as const },
    { type: 'separator' as const },
    { label: 'Select All', role: 'selectAll' as const }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  if (params && params.x !== undefined && params.y !== undefined) {
    menu.popup({ window: win, x: Math.round(params.x), y: Math.round(params.y) });
  } else {
    menu.popup({ window: win });
  }
})
```

---

### [ipc-client] src/preload/index.ts

```ts
/**
 * @purpose Exposes window.electron.ipcRenderer and window.api via contextBridge to the renderer process.
 * @why contextIsolation requires an explicit IPC bridge; raw ipcRenderer is surfaced for renderer-side flexibility.
 * @role bridge
 * @exports api
 * @uses electron (contextBridge, ipcRenderer)
 * @stability stable
 * @gotchas sendToHost(Cmd+K) silently fails outside a webview context; getPreloadPath() returns __filename for webview preload injection
 */
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  getPreloadPath: () => __filename,
  onToggleOmnibar: (callback: () => void) => {
    ipcRenderer.on('toggle-omnibar', callback)
  },
  removeToggleOmnibar: (callback: () => void) => {
    ipcRenderer.removeListener('toggle-omnibar', callback)
  },
  onAIEvent: (callback: (data: any) => void) => {
    ipcRenderer.on('ai-event', (event, data) => callback(data))
  }
}

// Inject standard IPC bridge
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
        removeListener: (channel: string, func: (...args: any[]) => void) => {
          ipcRenderer.removeListener(channel, func)
        },
        on: (channel: string, func: (...args: any[]) => void) => {
          ipcRenderer.on(channel, (event, ...args) => func(...args))
        }
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ipcRenderer }
  // @ts-ignore (define in dts)
  window.api = api
}

// --- KEYBOARD TRAP SOLUTION ---
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ipcRenderer.send('show-webview-context-menu', { x: e.clientX, y: e.clientY })
})

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    try {
      ipcRenderer.sendToHost('toggle-omnibar')
    } catch {
      ipcRenderer.send('toggle-omnibar')
    }
  }
})
```

---

## Docs

No docs included. No `docs/` or directory README files are scoped to the renderer-startup bug area.

---

## Decisions

No ADRs found. The `.agents/memory/decisions/` directory does not exist yet in this repo.

---

## Related tasks

### tasks/done/tab-reopen-crash.md

```
---
title: "Fix Tab Reopening Error (WebGL Context Failure)"
status: "in-progress"
priority: "high"
created_at: "2026-04-20"
---

# Issue
When reopening a minimized tab, the application throws:
`[ERROR:gles2_command_buffer_stub.cc(298)] ContextResult::kFatalFailure: Failed to create context.`
`Error occurred in handler for 'GUEST_VIEW_MANAGER_CALL': Error:  (-3) loading 'url'`

# Cause
Because `<webview>` is a multi-process Chromium component, rapidly toggling React components (from `display: none` or remounting them entirely) destroys the underlying GPU buffer and guest view manager context. When React remounts the `<webview>` component with the active `src`, Electron fails to reconnect the pre-existing Chromium guest process to the new DOM node.

# Possible Solution
Instead of unmounting/remounting the actual `<webview>` element when a widget switches to `minimized` or `sleeping` state, we must keep the `<webview>` mounted in the DOM at all times, but control its visibility via CSS opacity or `z-index`. This preserves the native Chromium renderer context and prevents the `ContextResult::kFatalFailure`.
```

### tasks/done/tab-wake-crash.md

```
---
title: "Tab Reactivation Crash (Context kFatalFailure)"
status: "todo"
priority: "high"
created_at: "2026-04-20"
---

# Issue
When waking a deeply slept or minimized widget, the native Chromium sandbox throws multiple terminal errors and occasionally fails.

# Suspected Cause
This is a WebGL context restoration failure when `<webview>` elements are re-injected into the DOM rapidly or moved while hidden by React's virtual DOM diffing algorithm.

# Need to investigate
How React remounts the `webviewRef`. Instead of destroying the component node entirely during minimization, we may need to `display: none` or throttle `loadURL()`.
```

### tasks/done/fix-ghost-tabs.md

```
# Fix V1 Ghost Tabs

## Description
When closing a tab physically on the canvas, the tab disappears but occasionally leaves an orphaned entry in the Zustand store, remaining visible in the Top Tab bar. Clicking the ghost tab resurrects an errored, minimized tab.

## Status
Done. Re-bound the `editor.store.listen` payload in `SpatialCanvas.tsx` to automatically catch `[...updates.changes.removed]` shapes and broadcast an immediate `.removeWidget()` upstream.

## Linked PRs
- c4ce524
```

---

## Conventions

### stack-snapshot

- **Renderer**: Electron + Vite + React + TypeScript. Canvas substrate is `@xyflow/react` (the project migrated from `tldraw` early on — treat any `tldraw` references in older docs/comments as legacy).
- **Backend**: FastAPI stub at `backend/agent/server.py`. Sync via Supabase.
- **Build**: `electron-vite` (config in `electron.vite.config.ts`).

### state-management

- **Zustand** for shared state. The canvas state lives in `useCanvasStore.ts` — this is a large file and the de-facto domain model. Treat it as a hot zone: changes here cascade.
- Local component state for component-internal concerns (form fields, hover states, etc.). No new React contexts.

### canvas-xyflow

- Nodes register through `nodeTypes` map; new node types must be defined there.
- Coordinates are canvas-space, not screen-space — be explicit when converting.
- Don't mutate node arrays directly; always go through store actions.

### ipc-electron

- Channels are typed; declare in `src/preload/index.d.ts` first, then implement on both sides.
- No direct `ipcRenderer` access in the renderer — go through the preload bridge.

### testing

- Vitest, configured via electron-vite. Test runner not currently green — see `local/untouchables.md` for the broken-on-start status.
- New code aims for tests; legacy code is grandfathered until touched.

---

## Untouchables

The full content of `.agents/local/untouchables.md` is included here because this task directly touches the broken-on-start area and the domain model.

**App is currently broken on start**: As of 2026-05-09, `npm run dev` fails to launch. Don't paper over the start error with a try/catch swallow. When a task touches startup, treat fixing the boot path as part of the task or as a blocking pre-requisite.

**`useCanvasStore.ts` is the domain model**: `src/renderer/src/store/useCanvasStore.ts`, ~800+ lines. A deliberate "one big store" choice. Do NOT split it into many small stores casually. Extend with new actions/selectors only.

**Supabase sync debouncing**: Debounce/throttle windows between local state changes and Supabase writes must be preserved. Do NOT lower or remove the debounce intervals.

**tldraw legacy references**: tldraw is legacy. Do not re-introduce tldraw imports. Update stale references to xyflow when encountered.

**.env file (untracked)**: `.env` at the repo root is intentionally untracked. Do not re-add to git tracking.

---

## Glossary

### canvas

The infinite 2D surface that hosts widgets. Implemented via `@xyflow/react`. "The canvas" usually refers to the rendered surface plus its viewport state (pan/zoom).

### node

An xyflow-rendered element on the canvas. Every widget is a node. Don't confuse with DOM nodes or with backend nodes — when ambiguous, say "canvas node."

### widget

A user-visible interactive element placed on the canvas. Examples: browser widget (a webview), shape widgets, tab widgets. Implemented as a node type registered in `nodeTypes`.

### viewport

The pan/zoom state of the canvas. Stored in the canvas store; persists to Supabase.

### supabase sync

The background process that mirrors local store state to a Supabase project. Debounced; see `local/untouchables.md` for the why.

### xyflow

The current canvas library (`@xyflow/react`). Treat as canonical; "tldraw" mentions in older code/docs are legacy from the pre-migration era.

---

## Librarian notes (scoring observations)

1. **Primary bug confirmed**: `useCanvasStore.ts` interface (`CanvasStore`) declares `flushSpatialEvents` (line ~132). `App.tsx` calls `useCanvasStore.getState().flushSyncQueue()` (line 28) — method does not exist. This is the `TypeError: flushSyncQueue is not a function` that fires every 1500ms. Fix: rename the call in `App.tsx` to `flushSpatialEvents()`.

2. **Secondary: double-flush**: Both `App.tsx` (line 27–29) and `SpatialCanvas.tsx` (lines 80–86) run a `setInterval(1500ms)` calling flush. After fixing the name in `App.tsx`, the Planner should decide which owner is canonical and remove one. `SpatialCanvas.tsx` is closer to the canvas domain and already uses the correct name; removing the interval from `App.tsx` is the cleaner path.

3. **Secondary: `setTopTabBarVisible` unverified**: Both `App.tsx` and `SpatialCanvas.tsx` call `useCanvasStore.getState().setTopTabBarVisible(...)` via `(state: any)` cast. The `CanvasStore` interface does NOT declare `setTopTabBarVisible` — only `isTopTabBarVisible` (line 21 of App.tsx, used as selector). The store has `isMinimalHeader` / `toggleHeaderMode` for header toggling, and `isTopTabBarVisible` as state that `TopTabBar` reads — but no setter action named `setTopTabBarVisible` in the store interface. This means calling it will silently do nothing (or crash if Zustand's strict mode is on). The Planner needs to either add `setTopTabBarVisible` to the store, or wire the existing `toggleHeaderMode`, depending on intent.

4. **Duplicate `Space` handlers**: `App.tsx` lines 39–41 and 55–57 are identical (`if (e.code === 'Space') setSpacebarHeld(true)`). Similarly lines 62–64 and 66–68 are duplicate `keyup` handlers. These are dead code but not crash-causing. Clean up as part of this fix to satisfy AC3.

5. **`src/main/index.ts` — `toggle-maximize` gap**: The ipc-host has no `ipcMain.on('toggle-maximize', ...)` handler even though `BrowserWidgetNode` sends it. Per the task body and untouchables, this is likely out-of-scope for this task (only fires on user click, not on startup). The Planner may confirm and spin it out.

6. **Deprecated tldraw files excluded**: `CanvasesWidgetComponent.tsx`, `CanvasesWidgetShapeUtil.tsx`, and `SettingsWidgetShapeUtil.tsx` were scored at -30 (deprecated) and excluded. None are referenced in the live `nodeTypes` map or on the boot path.

7. **`saveProfileAs` not in store interface**: `App.tsx` line 146 calls `useCanvasStore.getState().saveProfileAs(name.trim())` but `CanvasStore` interface has no `saveProfileAs` method. This will throw a `TypeError` when a user submits the "Save New Profile" modal. Not a startup blocker (modal only opens on `open-new-profile-modal` event), but the Planner should flag it for a follow-up or fix inline.
