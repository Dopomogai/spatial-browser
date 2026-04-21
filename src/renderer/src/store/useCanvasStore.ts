// V2 Store utilizing @xyflow/react native types
import { create } from 'zustand'
import { set as idbSet, get as idbGet } from 'idb-keyval'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { Connection, Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react'

import { supabase } from '../lib/supabase'

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
  
  // UI Interaction State
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

  // Application Actions
  isTopTabBarVisible: boolean
  setTopTabBarVisible: (visible: boolean) => void
  
  addWidget: (url: string, x: number, y: number) => void
  addTextNode: (x: number, y: number) => void
  updateWidgetData: (id: string, dataUpdates: Partial<BrowserWidgetData & TextNodeData>) => void
  toggleFullscreen: (id: string) => void
  removeWidget: (id: string) => void
  
  undo: () => void
  redo: () => void
  undoStack: AppNode[][]
  redoStack: AppNode[][]
  
  setOmnibarOpen: (open: boolean, position?: { x: number; y: number } | null) => void
  setSpacebarHeld: (held: boolean) => void

  lastViewport: { x: number; y: number; zoom: number }
  setLastViewport: (viewport: { x: number; y: number; zoom: number }) => void
  loadInitialState: () => Promise<void>
  loadProfile: (profileId: string) => void
}

let saveTimeout: any

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  isAppMaximized: false,
  setIsAppMaximized: (maximized) => set({ isAppMaximized: maximized }),
  nodes: [],
  edges: [],
  currentProfileId: 'default',
  profiles: [{ id: 'default', name: 'Default Profile', nodes: [], edges: [] }],
  isOmnibarOpen: false,
  isTopTabBarVisible: true,
  omnibarPosition: null, // this holds physical canvas coordinates, NOT visual css integers!
 isSpacebarHeld: false,
  theme: 'dark',
  defaultTabWidth: 800,
  defaultTabHeight: 600,
  setDefaultTabSize: (width, height) => set({ defaultTabWidth: width, defaultTabHeight: height }),

  lastViewport: { x: 0, y: 0, zoom: 1 },

  setTheme: (theme) => set({ theme }),
  setTopTabBarVisible: (visible) => set({ isTopTabBarVisible: visible }),

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
      const newState = {
        nodes: applyNodeChanges(changes, state.nodes),
        undoStack: newUndoStack,
        redoStack: isPositionChange ? [] : state.redoStack
      };
      persistState({ ...state, ...newState })
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

 addWidget: (url, x, y) => {
   const id = `browser_widget_${Date.now()}`
   
   const { defaultTabWidth, defaultTabHeight } = get()

   const newNode: AppNode = {
     id,
      type: 'browser_widget', // Matches nodeTypes in ReactFlow instance
      position: { x, y }, // React flow handles position natively
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
      persistState({ ...state, ...newState })
      return newState
    })
  },

  addTextNode: (x, y) => {
    const id = `text_node_${Date.now()}`
    
    const newNode: AppNode = {
      id,
      type: 'text_node',
      position: { x, y },
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
              const flowX = -viewport.x / viewport.zoom;
              const flowY = -viewport.y / viewport.zoom;
              
              return {
                ...node,
                position: { x: flowX, y: flowY },
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
      const newNodes = state.nodes.map((node) => {
        if (node.id === id) {
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

      const newState = { nodes: newNodes, undoStack: newUndoStack }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  removeWidget: (id) => {
    set((state) => {
      const newNodes = state.nodes.filter(n => n.id !== id)
      // also remove any edges connected to this widget if we add them later
      const newEdges = state.edges.filter(e => e.source !== id && e.target !== id)
      const newUndoStack = [...state.undoStack, state.nodes].slice(-50)
      
      const newState = { nodes: newNodes, edges: newEdges, undoStack: newUndoStack, redoStack: [] }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  setOmnibarOpen: (open, position = null) => set({ isOmnibarOpen: open, omnibarPosition: position }),
  
  setSpacebarHeld: (held) => set({ isSpacebarHeld: held }),

  setLastViewport: (viewport) => {
    set({ lastViewport: viewport })
    persistState(get())
  },

  loadInitialState: async () => {
    try {
      const stored = await idbGet<Partial<CanvasStore>>('spatial-canvas-v2-state')
      if (stored) {
        set({ ...stored, isOmnibarOpen: false, omnibarPosition: null } as any)
        if (stored.theme) {
          document.documentElement.setAttribute('data-theme', stored.theme);
        }
      }
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
  }

}))

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
       defaultTabHeight: state.defaultTabHeight
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
        id: state.currentProfileId,
        workspace_id: '00000000-0000-0000-0000-000000000000', // Mock link to public.workspaces.id for now
        profile_id: state.currentProfileId,
        name: state.profiles.find(p => p.id === state.currentProfileId)?.name || 'Default Profile',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      
    // 2. Push widgets
    const currentWidgets = state.nodes.filter(n => n.type === 'browser_widget') as BrowserAppNode[]
    
    if (currentWidgets.length > 0) {
        const widgetPayload = currentWidgets.map(w => ({
            id: w.id, // String IDs supported if schema altered or backend coerces
            spatial_workspace_id: state.currentProfileId,
            widget_type: w.type,
            url: w.data.url,
            title: w.data.title,
            x: w.position.x,
            y: w.position.y,
            width: w.data.w,
            height: w.data.h,
            interaction_state: w.data.interactionState,
            updated_at: new Date().toISOString(),
            last_active_at: new Date(w.data.lastActive as number).toISOString()
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
        
        for (const w of currentWidgets) {
            // Very simple out of bounds logic just for demonstration 
            const isOutside = w.position.x < viewMinX || w.position.y < viewMinY || w.position.x > viewMaxX || w.position.y > viewMaxY;
            if (isOutside) {
                 timelinePayload.push({
                     spatial_workspace_id: state.currentProfileId,
                     widget_id: w.id,
                     action_type: 'widget_moved_out_of_bounds',
                     new_state: { x: w.position.x, y: w.position.y, url: w.data.url },
                     timestamp: new Date().toISOString()
                 });
            }
        }
        
        if (timelinePayload.length > 0) {
            await supabase.schema('spatial_os').from('spatial_timeline').insert(timelinePayload)
        }
    }
  } catch (error) {
    console.error('Failed to sync to Supabase SSOT:', error)
  }
}
