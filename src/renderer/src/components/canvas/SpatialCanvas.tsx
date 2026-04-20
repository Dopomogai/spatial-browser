import React, { useEffect, useState } from 'react'
import { Tldraw, useEditor, createShapeId } from 'tldraw'
import { Plus, MousePointer2 } from 'lucide-react'
import 'tldraw/tldraw.css'
import { BrowserWidgetShapeUtil } from '../shapes/BrowserWidget/BrowserWidgetShapeUtil'
import { CanvasesWidgetShapeUtil } from '../shapes/CanvasesWidget/CanvasesWidgetShapeUtil'
import { SettingsWidgetShapeUtil } from '../shapes/SettingsWidget/SettingsWidgetShapeUtil'
import { useCanvasStore } from '../../store/useCanvasStore'
import { Omnibar } from '../ui/Omnibar'
import { Minimap } from '../ui/Minimap'
const customShapeUtils = [BrowserWidgetShapeUtil, CanvasesWidgetShapeUtil, SettingsWidgetShapeUtil]
const CanvasContent = () => {
  const editor = useEditor()
  const { widgets, updateWidget } = useCanvasStore()
  // Sync index creation once. We'll simply let the 'initialized' ref stay unused for state setting
  // to avoid cascading renders.
  const isInitialized = React.useRef(false);
  useEffect(() => {
    if (!isInitialized.current && Object.keys(widgets).length > 0) {
      Object.values(widgets).forEach(widget => {
        const shapeId = createShapeId(widget.id)
        if (!editor.getShape(shapeId)) {
          editor.createShape({
            id: shapeId,
            type: 'browser_widget',
            x: widget.x,
            y: widget.y,
            props: {
              w: widget.w,
              h: widget.h,
              widgetId: widget.id
            }
          } as any)
        }
      })
      isInitialized.current = true;
    }
  }, [editor, widgets])
  // Sync TLDraw changes back to Zustand
  useEffect(() => {
    const unsubscribe = editor.store.listen((updates) => {
      // Check for shape updates (movement, resize)
      Object.values(updates.changes.updated).forEach((change) => {
        const [, newShape] = change as any
        if (newShape.type === 'browser_widget') {
          updateWidget(newShape.props.widgetId, {
            x: newShape.x,
            y: newShape.y,
            w: newShape.props.w,
            h: newShape.props.h
          })
        }
      })
      
      // Cleanup deleted shapes from the React Zustand Store
      Object.values(updates.changes.removed).forEach((deletedShape: any) => {
        if (deletedShape.type === 'browser_widget') {
          useCanvasStore.getState().removeWidget(deletedShape.props.widgetId)
        }
      })
    }, { source: 'user', scope: 'document' })
    return () => unsubscribe()
  }, [editor, updateWidget])
  // Viewport Intersection Check (The Sleeping Tab mechanism)
  useEffect(() => {
    const checkViewport = () => {
      const bounds = editor.getViewportPageBounds()
      const scale = editor.getCamera().z // Get current zoom level
      const buffer = 500 / scale // Dynamically adjust buffer based on zoom
      const widgetsEntries = Object.values(useCanvasStore.getState().widgets);
      
      widgetsEntries.forEach(widget => {
        if (widget.interactionState === 'minimized') return;
        const shapeId = createShapeId(widget.id)
        const shape = editor.getShape(shapeId)
        if (!shape) return
        
        const shapePageBounds = editor.getShapePageBounds(shape)
        if (!shapePageBounds) return

        // 1. Calculate how far the widget is from the viewport
        const distanceX = Math.max(0, bounds.minX - shapePageBounds.maxX, shapePageBounds.minX - bounds.maxX)
        const distanceY = Math.max(0, bounds.minY - shapePageBounds.maxY, shapePageBounds.minY - bounds.maxY)
        
        // 2. Hysteresis band (Wake up when close, sleep when far)
        const WAKE_THRESHOLD = buffer            // Needs to be this close to wake up
        const SLEEP_THRESHOLD = buffer + (300 / scale)  // Needs to be this far to sleep

        const isDeepOffScreen = distanceX > SLEEP_THRESHOLD || distanceY > SLEEP_THRESHOLD
        const isCloseToScreen = distanceX < WAKE_THRESHOLD && distanceY < WAKE_THRESHOLD

        // 3. Apply state checks with hysteresis to prevent fighting loops
        if (isDeepOffScreen && widget.interactionState === 'active') {
          updateWidget(widget.id, { interactionState: 'sleeping' })
        } else if (isCloseToScreen && widget.interactionState === 'sleeping') {
          updateWidget(widget.id, { interactionState: 'active' })
        }
      })
    }
    const unsubscribe = editor.store.listen(() => {
      checkViewport()
    }, { source: 'user', scope: 'document' })
    // Also run check periodically since we disabled the one in the component
    const interval = setInterval(checkViewport, 1000)
    return () => {
        unsubscribe()
        clearInterval(interval)
    }
  }, [editor, updateWidget])
  // Listen for new widgets added from Zustand and create shapes for them
  useEffect(() => {
    Object.values(widgets).forEach(widget => {
      const shapeId = createShapeId(widget.id)
      if (!editor.getShape(shapeId)) {
        editor.createShape({
          id: shapeId,
          type: 'browser_widget',
          x: widget.x,
          y: widget.y,
          props: {
            w: widget.w,
            h: widget.h,
            widgetId: widget.id
          }
        } as any)
      }
    })
  }, [widgets, editor])
  return null
}
export const SpatialCanvas: React.FC = () => {
  const { setOmnibarOpen } = useCanvasStore()
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuOpen(true)
    setContextMenuPos({ x: e.clientX, y: e.clientY })
  }

  // Handle global events dispatched from TopTabBar or elsewhere
  useEffect(() => {
      const handleSpawnCanvases = () => {
          const editor = useCanvasStore.getState().editor;
          if (editor) {
              const bounds = editor.getViewportPageBounds();
              editor.createShape({
                type: 'CanvasesWidget',
                x: bounds.midX - 180,
                y: bounds.midY - 240,
                props: { w: 360, h: 480 }
              } as any)
          }
      };

      const handleSpawnSettings = () => {
          const editor = useCanvasStore.getState().editor;
          if (editor) {
              const bounds = editor.getViewportPageBounds();
              editor.createShape({
                type: 'SettingsWidget',
                x: bounds.midX - 240,
                y: bounds.midY - 170,
                props: { w: 480, h: 340 }
              } as any)
          }
      };

      const handleSpawnCenter = () => {
          const editor = useCanvasStore.getState().editor;
          if (editor) {
              const bounds = editor.getViewportPageBounds();
              useCanvasStore.getState().setOmnibarOpen(true, { x: bounds.midX, y: bounds.midY });
          } else {
              useCanvasStore.getState().setOmnibarOpen(true, { x: 0, y: 0 });
          }
      };

      const handlePanToWidget = (e: any) => {
          try {
              const editor = useCanvasStore.getState().editor;
              if (editor && e.detail?.id) {
                  const widget = useCanvasStore.getState().widgets[e.detail.id];
                  if (widget) {
                      const bounds = editor.getViewportPageBounds();
                      // Center the specific widget on the screen 
                      const centerX = widget.x + widget.w / 2;
                      const centerY = widget.y + widget.h / 2;
                      editor.setCamera({ x: -centerX + bounds.w / 2, y: -centerY + bounds.h / 2 }, { animation: { duration: 300 } });
                  }
              }
          } catch(err) {
              console.error(err);
          }
      };

      window.addEventListener('spawn-tab-center', handleSpawnCenter);
      window.addEventListener('pan-to-widget' as any, handlePanToWidget);
      window.addEventListener('spawn-canvases-widget', handleSpawnCanvases);
      window.addEventListener('spawn-settings-widget', handleSpawnSettings);

      return () => {
          window.removeEventListener('spawn-tab-center', handleSpawnCenter);
          window.removeEventListener('pan-to-widget' as any, handlePanToWidget);
          window.removeEventListener('spawn-canvases-widget', handleSpawnCanvases);
          window.removeEventListener('spawn-settings-widget', handleSpawnSettings);
      };
  }, []);

  return (
    <div className="w-full h-full relative" style={{ background: '#131315' }} onContextMenu={handleContextMenu} onClick={() => setContextMenuOpen(false)} onPointerDown={() => setContextMenuOpen(false)}>
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0'
        }}
      />
      {/* Temporary Developer Data Sync Overlay (Hidden for end-users) */}
      {/* 
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px', color: 'white', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
             value={currentProfileId} 
             onChange={(e) => loadProfile(e.target.value)}
             style={{ background: 'black', color: 'white', border: '1px solid gray', borderRadius: '4px', padding: '4px' }}
          >
              {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </select>
          <button onClick={() => {
              // Temporary V1 fix: prompt is not supported in electron
              const name = `Canvas_${Math.floor(Math.random() * 1000)}`
              if (name) saveProfileAs(name)
          }} style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>Save As</button>
          <button onClick={() => deleteProfile(currentProfileId)} disabled={currentProfileId === 'default'} style={{ background: '#533', padding: '4px 8px', borderRadius: '4px', opacity: currentProfileId === 'default' ? 0.5 : 1 }}>Delete</button>
          <div style={{ width: '1px', height: '20px', background: 'gray', margin: '0 5px' }}></div>
          <button onClick={undo} style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>Undo</button>
          <button onClick={redo} style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>Redo</button>
      </div> 
      */}
      <Tldraw 
        shapeUtils={customShapeUtils}
        onMount={(editor) => {
            useCanvasStore.getState().setEditor(editor)
            editor.setCurrentTool('select')
        }}
        components={{
          Toolbar: null,
          DebugMenu: null,
          MainMenu: null,
          PageMenu: null,
          NavigationPanel: null,
          ContextMenu: null,
          StylePanel: null,
          ZoomMenu: null,
          HelperButtons: null,
          KeyboardShortcutsDialog: null,
          QuickActions: null
        }}
        // Remove explicit assetUrls to let tldraw auto-resolve locally or via node_modules
      >
        <CanvasContent />
        <Omnibar />
        <Minimap />
                {contextMenuOpen && (
              <div className="bg-[#242424] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)] rounded py-1 w-48 animate-in fade-in zoom-in duration-100"
              style={{
                  position: 'absolute',
                  top: contextMenuPos.y,
                  left: contextMenuPos.x,
                  zIndex: 9999,
              }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <button 
                  onClick={() => {
                      setContextMenuOpen(false)
                      
                      // Convert fixed screen coordinates to actual physical infinite-canvas coordinates
                      const editor = useCanvasStore.getState().editor;
                      if (!editor) {
                          useCanvasStore.getState().setOmnibarOpen(true, contextMenuPos)
                          return;
                      }

                      const point = { x: contextMenuPos.x, y: contextMenuPos.y }
                      const canvasPoint = editor.screenToPage(point)
                      
                      useCanvasStore.getState().setOmnibarOpen(true, { x: canvasPoint.x, y: canvasPoint.y })
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-on_surface_variant hover:text-white hover:bg-primary/20 transition-colors flex items-center gap-2"
                >
                    <Plus size={14} /> Spawn Tab Here
                </button>
                <div className="w-full h-px bg-white/5 my-1"></div>
                <button 
                  onClick={() => {
                      setContextMenuOpen(false)
                      useCanvasStore.getState().setSpacebarHeld(false)
                      
                      const editor = useCanvasStore.getState().editor;
                      if (editor) {
                          // Custom algorithm to center the view based on bounding boxes of widgets
                          const widgets = Object.values(useCanvasStore.getState().widgets);
                          if (widgets.length === 0) {
                              editor.setCamera({ x: 0, y: 0 }, { animation: { duration: 300 } });
                              return;
                          }

                          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                          widgets.forEach(w => {
                              minX = Math.min(minX, w.x);
                              minY = Math.min(minY, w.y);
                              maxX = Math.max(maxX, w.x + w.w);
                              maxY = Math.max(maxY, w.y + w.h);
                          });

                          const centerX = minX + (maxX - minX) / 2;
                          const centerY = minY + (maxY - minY) / 2;
                          const bounds = editor.getViewportPageBounds();
                          // To center something on screen, map the canvas center subtracted by half viewport
                          editor.setCamera({ x: -centerX + bounds.w / 2, y: -centerY + bounds.h / 2 }, { animation: { duration: 300 } });
                      }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-on_surface_variant hover:text-white hover:bg-primary/20 transition-colors flex items-center gap-2"
                >
                    <MousePointer2 size={14} /> Center View
                </button>
            </div>
        )}
      </Tldraw>
    </div>
  )
}