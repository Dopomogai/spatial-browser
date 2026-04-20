declare const supabase: any;

import { create } from 'zustand'
import { set, get } from 'idb-keyval'

export type WidgetState = 'active' | 'sleeping' | 'minimized'

export interface SpatialWidget {
  id: string              // Unique TLDraw shape ID
  type: 'browser_widget' 
  url: string             // Current URL
  title: string           // Page title for the Minimized state
  faviconUrl: string      // URL to the site's favicon
  screenshotBase64: string | null // Cached image for Sleeping state
  x: number
  y: number
  w: number
  h: number
  interactionState: WidgetState
  lastActive: number      // Unix timestamp
  tabHistory: string[]   // Added for back/forward support (Time Machine)
  currentHistoryIndex: number
}

export interface WorkspaceProfile {
  id: string
  name: string
  widgets: Record<string, SpatialWidget>
}

export interface CanvasStore {
  editor: any | null;
  setEditor: (editor: any) => void;
  widgets: Record<string, SpatialWidget>
  currentProfileId: string
  profiles: WorkspaceProfile[]
  isOmnibarOpen: boolean
  isSpacebarHeld: boolean
  omnibarPosition: { x: number; y: number } | null
  undoStack: Array<{ id: string; oldState: Partial<SpatialWidget>; newState: Partial<SpatialWidget> }>
  redoStack: Array<{ id: string; oldState: Partial<SpatialWidget>; newState: Partial<SpatialWidget> }>
  addWidget: (url: string, x: number, y: number) => void
  updateWidget: (id: string, updates: Partial<SpatialWidget>) => void
  removeWidget: (id: string) => void
  setOmnibarOpen: (open: boolean, position?: { x: number; y: number } | null) => void
  setSpacebarHeld: (held: boolean) => void
  loadInitialState: () => Promise<void>
  loadProfile: (profileId: string) => void
  saveProfileAs: (name: string) => void
  deleteProfile: (profileId: string) => void
  undo: () => void
  redo: () => void
  recordActionLog: (actionType: string, agentId: string | null, details: any) => void
  checkCameraBounds: (viewportBounds: any, zZoom: number) => void
}

// Debounce for saving to IDB to avoid performance hits
let saveTimeout: any

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  widgets: {},
  currentProfileId: 'default',
  profiles: [{ id: 'default', name: 'Default Profile', widgets: {} }],
  isOmnibarOpen: false,
  isSpacebarHeld: false,
  omnibarPosition: null, // Stores screen coords for right-click spawn
  undoStack: [],
  redoStack: [],

  addWidget: (url, x, y) => {
    const id = `browser_widget_${Date.now()}`
    const newWidget: SpatialWidget = {
      id,
      type: 'browser_widget',
      url,
      title: 'New Tab',
      faviconUrl: '',
      screenshotBase64: null,
      x,
      y,
      w: 800,
      h: 600,
      interactionState: 'active',
      lastActive: Date.now(),
      tabHistory: [url],
      currentHistoryIndex: 0
    }
    
    setStore((state) => {
      const newWidgets = { ...state.widgets, [id]: newWidget }
      persistState(newWidgets)
      return { widgets: newWidgets }
    })
  },

  updateWidget: (id, updates) => {
    setStore((state) => {
      if (!state.widgets[id]) return state
      
      const oldState = {} as Partial<SpatialWidget>
      for (const k in updates) { // record the old values for the updated keys 
        const key = k as keyof SpatialWidget
        (oldState as any)[key] = state.widgets[id][key]
      }
      const newWidgets = {
        ...state.widgets,
        [id]: { ...state.widgets[id], ...updates }
      }

      // Add to undo stack if position or size changed
      let newUndoStack = state.undoStack
      if ('x' in updates || 'y' in updates || 'w' in updates || 'h' in updates) {
          newUndoStack = [...state.undoStack, { id, oldState, newState: updates }].slice(-50) // keep last 50
      }

      const newState = { 
          widgets: newWidgets,
          undoStack: newUndoStack,
          redoStack: newUndoStack.length !== state.undoStack.length ? [] : state.redoStack
      }

      persistState(newState)
      return newState
    })
  },

  removeWidget: (id) => {
    setStore((state) => {
      const newWidgets = { ...state.widgets }
      delete newWidgets[id]
      persistState(newWidgets)
      return { widgets: newWidgets }
    })
  },

  setOmnibarOpen: (open, position = null) => setStore({ isOmnibarOpen: open, omnibarPosition: position }),
  
  setSpacebarHeld: (held) => setStore({ isSpacebarHeld: held }),

  loadInitialState: async () => {
    try {
      const stored = await get<CanvasStore>('spatial-canvas-state')
      if (stored) {
        setStore({ ...stored, isOmnibarOpen: false, omnibarPosition: null })
      }
    } catch (e) {
      console.error('Failed to load local DB', e)
    }
  },

  loadProfile: (profileId: string) => {
      setStore((state) => {
          const profile = state.profiles.find(p => p.id === profileId)
          if (!profile) return state
          
          const newState = { 
              ...state, 
              currentProfileId: profileId, 
              widgets: profile.widgets,
              undoStack: [], // clear stacks on profile load
              redoStack: []
          }
          persistState(newState)
          return newState
      })
  },

  saveProfileAs: (name: string) => {
      setStore((state) => {
          const id = `profile_${Date.now()}`
          const newProfile: WorkspaceProfile = {
              id,
              name,
              widgets: state.widgets // clone current active widgets into a new profile
          }
          const newProfiles = [...state.profiles, newProfile]
          const newState = {
              ...state,
              profiles: newProfiles,
              currentProfileId: id
          }
          persistState(newState)
          return newState
      })
  },

  deleteProfile: (profileId: string) => {
      setStore((state) => {
          if (profileId === 'default' || state.profiles.length === 1) return state // cannot delete last profile or default
          
          const newProfiles = state.profiles.filter(p => p.id !== profileId)
          const newState = { ...state, profiles: newProfiles }

          if (state.currentProfileId === profileId) { // switch to default if current deleted
             newState.currentProfileId = 'default'
             newState.widgets = newProfiles.find(p => p.id === 'default')?.widgets || {}
             newState.undoStack = []
             newState.redoStack = []
          }

          persistState(newState)
          return newState
      })
  },

  undo: () => {
      setStore((state) => {
          if (state.undoStack.length === 0) return state

          const lastAction = state.undoStack[state.undoStack.length - 1]
          const newUndoStack = state.undoStack.slice(0, -1)
          const newRedoStack = [...state.redoStack, lastAction]
          
          // Revert widget state
          const newWidgets = { ...state.widgets }
          if (newWidgets[lastAction.id]) {
               newWidgets[lastAction.id] = { ...newWidgets[lastAction.id], ...lastAction.oldState }
          }
          
          const newState = {
              ...state,
              widgets: newWidgets,
              undoStack: newUndoStack,
              redoStack: newRedoStack
          }
          persistState(newState)
          return newState
      })
  },

  redo: () => {
      setStore((state) => {
           if (state.redoStack.length === 0) return state

           const nextAction = state.redoStack[state.redoStack.length - 1]
           const newRedoStack = state.redoStack.slice(0, -1)
           const newUndoStack = [...state.undoStack, nextAction]

           const newWidgets = { ...state.widgets }
           if (newWidgets[nextAction.id]) {
               newWidgets[nextAction.id] = { ...newWidgets[nextAction.id], ...nextAction.newState }
           }

           const newState = {
               ...state,
               widgets: newWidgets,
               undoStack: newUndoStack,
               redoStack: newRedoStack
           }
           persistState(newState)
           return newState
      })
  },

  recordActionLog: (actionType, agentId, details) => {
      if (typeof supabase !== 'undefined' && supabase) {
          supabase
            .from('spatial_timeline')
            .insert({
                action_type: actionType,
                agent_id: agentId,
                details: details,
                created_at: new Date().toISOString()
            })
            .then(({ error }: { error: any }) => {
                if (error) console.warn('Supabase timeline logging failed:', error.message)
            })
      }
  },

  checkCameraBounds: (viewportBounds, zZoom) => {
      // Logic to determine if windows are outside TLDraw camera viewport
      // and log to spatial_timeline if necessary based on hysteresis math
  }

}))

function persistState(state: Partial<CanvasStore>) {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    
    // Auto-update the current profile in the profiles list
    let profilesToSave = state.profiles || []
    if (state.currentProfileId && state.widgets) {
        profilesToSave = profilesToSave.map(p => 
            p.id === state.currentProfileId 
                ? { ...p, widgets: state.widgets as Record<string, SpatialWidget> } 
                : p
        )
    }

    const stateToSave = {
        ...state,
        profiles: profilesToSave,
        omnibarPosition: null, // do not persist UI states
        isOmnibarOpen: false,
        isSpacebarHeld: false
    }


    // Local persistence
    set('spatial-canvas-state', stateToSave).catch(console.error)
    
    // Remote cloud persistence
    if (state.currentProfileId && typeof supabase !== 'undefined' && supabase) {
        const currentStateJson = stateToSave;
        supabase
          .from('spatial_workspaces')
          .upsert({ 
              id: state.currentProfileId, 
              name: profilesToSave.find(p => p.id === state.currentProfileId)?.name || 'Default',
              state_json: currentStateJson,
              updated_at: new Date().toISOString()
          })
          .then(({ error }: { error: any }) => {
              if (error) console.warn('Supabase sync failed (likely missing keys):', error.message)
          })

        // Asynchronously persist individual spatial_widgets
        if (state.widgets) {
            const widgetsArray = Object.values(state.widgets);
            
            widgetsArray.forEach(widget => {
                // We avoid clobbering public.workspaces and persist directly to spatial_widgets
                supabase
                  .from('spatial_widgets')
                  .upsert({
                      id: widget.id,
                      workspace_id: state.currentProfileId,
                      url: widget.url,
                      x: Math.round(widget.x),
                      y: Math.round(widget.y),
                      w: Math.round(widget.w),
                      h: Math.round(widget.h),
                      state: widget.interactionState,
                      updated_at: new Date().toISOString()
                  })
                  .then(({ error }: { error: any }) => {
                      if (error) console.warn(`Supabase spatial_widgets sync failed for ${widget.id}:`, error.message)
                  })
            });
        }
    }
  }, 1000)
}
