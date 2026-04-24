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
          w: 400,
          h: 500,
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
