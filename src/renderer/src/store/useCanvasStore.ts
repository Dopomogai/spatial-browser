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
}

export interface CanvasStore {
  widgets: Record<string, SpatialWidget>
  isOmnibarOpen: boolean
  isSpacebarHeld: boolean
  addWidget: (url: string, x: number, y: number) => void
  updateWidget: (id: string, updates: Partial<SpatialWidget>) => void
  removeWidget: (id: string) => void
  setOmnibarOpen: (open: boolean) => void
  setSpacebarHeld: (held: boolean) => void
  loadInitialState: () => Promise<void>
}

// Debounce for saving to IDB to avoid performance hits
let saveTimeout: NodeJS.Timeout

export const useCanvasStore = create<CanvasStore>((setStore, getStore) => ({
  widgets: {},
  isOmnibarOpen: false,
  isSpacebarHeld: false,

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
      lastActive: Date.now()
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
      const newWidgets = {
        ...state.widgets,
        [id]: { ...state.widgets[id], ...updates }
      }
      persistState(newWidgets)
      return { widgets: newWidgets }
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

  setOmnibarOpen: (open) => setStore({ isOmnibarOpen: open }),
  
  setSpacebarHeld: (held) => setStore({ isSpacebarHeld: held }),

  loadInitialState: async () => {
    try {
      const stored = await get<Record<string, SpatialWidget>>('spatial-canvas-widgets')
      if (stored) {
        setStore({ widgets: stored })
      }
    } catch (e) {
      console.error('Failed to load local DB', e)
    }
  }
}))

function persistState(widgets: Record<string, SpatialWidget>) {
  const widgetsToSave = Object.fromEntries(
    Object.entries(widgets).map(([id, w]) => [id, { ...w, screenshotBase64: null }])
  )
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    set('spatial-canvas-widgets', widgetsToSave).catch(console.error)
  }, 1000)
}