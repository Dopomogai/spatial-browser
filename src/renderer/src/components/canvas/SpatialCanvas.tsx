     1|import React, { useEffect, useState } from 'react'
     2|import { Tldraw, useEditor, createShapeId } from 'tldraw'
     3|import 'tldraw/tldraw.css'
     4|import { BrowserWidgetShapeUtil } from '../shapes/BrowserWidget/BrowserWidgetShapeUtil'
     5|import { useCanvasStore } from '../../store/useCanvasStore'
     6|import { Omnibar } from '../ui/Omnibar'
     7|import { Minimap } from '../ui/Minimap'
     8|
     9|const customShapeUtils = [BrowserWidgetShapeUtil]
    10|
    11|const CanvasContent = () => {
    12|  const editor = useEditor()
    13|  const { widgets, updateWidget } = useCanvasStore()
    14|  // Sync index creation once. We'll simply let the 'initialized' ref stay unused for state setting
    15|  // to avoid cascading renders.
    16|  const isInitialized = React.useRef(false);
    17|  useEffect(() => {
    18|    if (!isInitialized.current && Object.keys(widgets).length > 0) {
    19|      Object.values(widgets).forEach(widget => {
    20|        const shapeId = createShapeId(widget.id)
    21|        if (!editor.getShape(shapeId)) {
    22|          editor.createShape({
    23|            id: shapeId,
    24|            type: 'browser_widget',
    25|            x: widget.x,
    26|            y: widget.y,
    27|            props: {
    28|              w: widget.w,
    29|              h: widget.h,
    30|              widgetId: widget.id
    31|            }
    32|          } as any)
    33|        }
    34|      })
    35|      isInitialized.current = true;
    36|    }
    37|  }, [editor, widgets])
    38|
    39|  // Sync TLDraw changes back to Zustand
    40|  useEffect(() => {
    41|    const unsubscribe = editor.store.listen((updates) => {
    42|      // Check for shape updates (movement, resize)
    43|      Object.values(updates.changes.updated).forEach((change) => {
    44|        const [, newShape] = change as any
    45|        if (newShape.type === 'browser_widget') {
    46|          updateWidget(newShape.props.widgetId, {
    47|            x: newShape.x,
    48|            y: newShape.y,
    49|            w: newShape.props.w,
    50|            h: newShape.props.h
    51|          })
    52|        }
    53|      })
    54|      
    55|      // Check for newly added shapes via Omnibar
    56|      Object.values(updates.changes.added).forEach((newShape: any) => {
    57|         // Not handled here to avoid infinite loops, adding is driven by Zustand
    58|      })
    59|    }, { source: 'user', scope: 'document' })
    60|
    61|    return () => unsubscribe()
    62|  }, [editor, updateWidget])
    63|
    64|  // Viewport Intersection Check (The Sleeping Tab mechanism)
    65|  useEffect(() => {
    66|    const checkViewport = () => {
    67|      const bounds = editor.getViewportPageBounds()
    68|      const buffer = 500 // 500px buffer zone
    69|      
    70|      const widgetsEntries = Object.values(useCanvasStore.getState().widgets);
    71|      
    72|      widgetsEntries.forEach(widget => {
    73|        if (widget.interactionState === 'minimized') return;
    74|
    75|        const shapeId = createShapeId(widget.id)
    76|        const shape = editor.getShape(shapeId)
    77|        if (!shape) return
    78|
    79|        // Get absolute coordinates on canvas
    80|        const shapePageBounds = editor.getShapePageBounds(shape)
    81|        if (!shapePageBounds) return
    82|
    83|        // Check if shape is off screen
    84|        const isOffScreen = 
    85|          shapePageBounds.maxX < bounds.minX - buffer ||
    86|          shapePageBounds.minX > bounds.maxX + buffer ||
    87|          shapePageBounds.maxY < bounds.minY - buffer ||
    88|          shapePageBounds.minY > bounds.maxY + buffer
    89|
    90|        if (isOffScreen && widget.interactionState === 'active') {
    91|          updateWidget(widget.id, { interactionState: 'sleeping' })
    92|        } else if (!isOffScreen && widget.interactionState === 'sleeping') {
    93|          updateWidget(widget.id, { interactionState: 'active' })
    94|        }
    95|      })
    96|    }
    97|
    98|    const unsubscribe = editor.store.listen(() => {
    99|      checkViewport()
   100|    }, { source: 'user', scope: 'document' })
   101|
   102|    // Also run check periodically since we disabled the one in the component
   103|    const interval = setInterval(checkViewport, 1000)
   104|    
   105|    return () => {
   106|        unsubscribe()
   107|        clearInterval(interval)
   108|    }
   109|  }, [editor, updateWidget])
   110|
   111|  // Listen for new widgets added from Zustand and create shapes for them
   112|  useEffect(() => {
   113|    Object.values(widgets).forEach(widget => {
   114|      const shapeId = createShapeId(widget.id)
   115|      if (!editor.getShape(shapeId)) {
   116|        editor.createShape({
   117|          id: shapeId,
   118|          type: 'browser_widget',
   119|          x: widget.x,
   120|          y: widget.y,
   121|          props: {
   122|            w: widget.w,
   123|            h: widget.h,
   124|            widgetId: widget.id
   125|          }
   126|        } as any)
   127|      }
   128|    })
   129|  }, [widgets, editor])
   130|
   131|  return null
   132|}
   133|export const SpatialCanvas: React.FC = () => {
   134|  const { setOmnibarOpen, undo, redo, profiles, loadProfile, saveProfileAs, deleteProfile, currentProfileId } = useCanvasStore()
   135|  const [contextMenuOpen, setContextMenuOpen] = useState(false)
   136|  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
   137|
   138|  const handleContextMenu = (e: React.MouseEvent) => {
   139|    e.preventDefault()
   140|    setContextMenuOpen(true)
   141|    setContextMenuPos({ x: e.clientX, y: e.clientY })
   142|  }
   143|
   144|  return (
   145|    <div className="w-full h-full relative" style={{ background: '#131315' }} onContextMenu={handleContextMenu} onClick={() => setContextMenuOpen(false)}>
   146|      <div 
   147|        className="absolute inset-0 pointer-events-none" 
   148|        style={{
   149|          backgroundImage: `
   150|            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
   151|            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
   152|          `,
   153|          backgroundSize: '40px 40px',
   154|          backgroundPosition: '0 0'
   155|        }}
   156|      />
   157|      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px', color: 'white', display: 'flex', gap: '10px', alignItems: 'center' }}>
   158|          <select 
   159|             value={currentProfileId} 
   160|             onChange={(e) => loadProfile(e.target.value)}
   161|             style={{ background: 'black', color: 'white', border: '1px solid gray', borderRadius: '4px', padding: '4px' }}
   162|          >
   163|              {profiles.map(p => (
   164|                  <option key={p.id} value={p.id}>{p.name}</option>
   165|              ))}
   166|          </select>
   167|          <button onClick={() => {
   168|              const name = prompt('Enter profile name:')
   169|              if (name) saveProfileAs(name)
   170|          }} style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>Save As</button>
   171|          <button onClick={() => deleteProfile(currentProfileId)} disabled={currentProfileId === 'default'} style={{ background: '#533', padding: '4px 8px', borderRadius: '4px', opacity: currentProfileId === 'default' ? 0.5 : 1 }}>Delete</button>
   172|          
   173|          <div style={{ width: '1px', height: '20px', background: 'gray', margin: '0 5px' }}></div>
   174|          <button onClick={undo} style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>Undo</button>
   175|          <button onClick={redo} style={{ background: '#333', padding: '4px 8px', borderRadius: '4px' }}>Redo</button>
   176|      </div>
   177|      <Tldraw 
   178|        shapeUtils={customShapeUtils}
   179|        components={{
   180|          Toolbar: null,
   181|          DebugMenu: null,
   182|          MainMenu: null,
   183|          PageMenu: null,
   184|          NavigationPanel: null,
   185|          ContextMenu: null,
   186|          Minimap: null,
   187|          StylePanel: null,
   188|          ZoomMenu: null,
   189|          HelperButtons: null,
   190|          KeyboardShortcutsDialog: null,
   191|          QuickActions: null
   192|        }}
   193|        // Remove explicit assetUrls to let tldraw auto-resolve locally or via node_modules
   194|      >
   195|        <CanvasContent />
   196|        <Omnibar />
   197|        <Minimap />
   198|        {contextMenuOpen && (
   199|            <div 
   200|              style={{
   201|                  position: 'fixed',
   202|                  top: contextMenuPos.y,
   203|                  left: contextMenuPos.x,
   204|                  background: '#222',
   205|                  border: '1px solid #444',
   206|                  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
   207|                  padding: '5px',
   208|                  borderRadius: '5px',
   209|                  zIndex: 9999,
   210|                  color: 'white'
   211|              }}
   212|              onClick={(e) => e.stopPropagation()}
   213|            >
   214|                <button 
   215|                  onClick={() => {
   216|                      setContextMenuOpen(false)
   217|                      // Notify tldraw context from within the hook
   218|                      // A little dirty but we will pass the screen position to the store
   219|                      setOmnibarOpen(true, contextMenuPos)
   220|                  }}
   221|                  style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', color: 'white' }}
   222|                  onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
   223|                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
   224|                >
   225|                    Spawn Tab Here
   226|                </button>
   227|            </div>
   228|        )}
   229|      </Tldraw>
   230|    </div>
   231|  )
   232|}