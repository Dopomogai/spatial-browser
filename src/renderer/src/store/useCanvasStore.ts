// V2 Store utilizing @xyflow/react native types
import { create } from 'zustand'
import { set as idbSet, get as idbGet } from 'idb-keyval'
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'
import type { Connection, Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react'

declare const supabase: any;

export type WidgetState = 'active' | 'sleeping' | 'minimized'

// We map our SpatialWidget directly onto the React Flow 'Node.data' object type
export interface BrowserWidgetData extends Record<string, unknown> {
  url: string
  title: string
  faviconUrl: string
  screenshotBase64: string | null
  w: number
  h: number
  interactionState: WidgetState
  lastActive: number
  tabHistory: string[]
  currentHistoryIndex: number
}

// React Flow strictly separates geometric math (Node) from business logic (data)
export type AppNode = Node<BrowserWidgetData, 'browser_widget'>;

export interface WorkspaceProfile {
  id: string
  name: string
  nodes: AppNode[]
  edges: Edge[]
}

export interface CanvasStore {
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

  // Application Actions
  addWidget: (url: string, x: number, y: number) => void
  updateWidgetData: (id: string, dataUpdates: Partial<BrowserWidgetData>) => void
  removeWidget: (id: string) => void
  
  undo: () => void
  redo: () => void
  undoStack: AppNode[][]
  redoStack: AppNode[][]
  
  setOmnibarOpen: (open: boolean, position?: { x: number; y: number } | null) => void
  setSpacebarHeld: (held: boolean) => void

  loadInitialState: () => Promise<void>
  loadProfile: (profileId: string) => void
}

let saveTimeout: any

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  currentProfileId: 'default',
  profiles: [{ id: 'default', name: 'Default Profile', nodes: [], edges: [] }],
  isOmnibarOpen: false,
  isSpacebarHeld: false,
  omnibarPosition: null,

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
    
    const newNode: AppNode = {
      id,
      type: 'browser_widget', // Matches nodeTypes in ReactFlow instance
      position: { x, y }, // React flow handles position natively
      data: {
        url,
        title: 'New Tab',
        faviconUrl: '',
        screenshotBase64: null,
        w: 800,
        h: 600,
        interactionState: 'active',
        lastActive: Date.now(),
        tabHistory: [url],
        currentHistoryIndex: 0
      }
    }
    
    set((state) => {
      const newNodes = [...state.nodes, newNode]
      const newState = { nodes: newNodes }
      persistState({ ...state, ...newState })
      return newState
    })
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
          };
        }
        return node;
      });

      const newState = { nodes: newNodes }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  removeWidget: (id) => {
    set((state) => {
      const newNodes = state.nodes.filter(n => n.id !== id)
      // also remove any edges connected to this widget if we add them later
      const newEdges = state.edges.filter(e => e.source !== id && e.target !== id)
      
      const newState = { nodes: newNodes, edges: newEdges }
      persistState({ ...state, ...newState })
      return newState
    })
  },

  setOmnibarOpen: (open, position = null) => set({ isOmnibarOpen: open, omnibarPosition: position }),
  
  setSpacebarHeld: (held) => set({ isSpacebarHeld: held }),

  loadInitialState: async () => {
    try {
      const stored = await idbGet<Partial<CanvasStore>>('spatial-canvas-v2-state')
      if (stored) {
        set({ ...stored, isOmnibarOpen: false, omnibarPosition: null } as any)
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
        currentProfileId: state.currentProfileId
    }

    // Local persistence (V2 uses new key to avoid clashing with V1 TLDraw store)
    idbSet('spatial-canvas-v2-state', stateToSave).catch(console.error)
    
    if (state.currentProfileId && typeof supabase !== 'undefined' && supabase) {
        // Sync spatial_workspaces...
    }
  }, 1000)
}