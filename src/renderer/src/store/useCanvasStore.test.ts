import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCanvasStore } from './useCanvasStore'
import * as idb from 'idb-keyval'

describe('useCanvasStore', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useCanvasStore.setState({
      widgets: {},
      isOmnibarOpen: false,
      isSpacebarHeld: false
    })
    
    // Clear mocks
    vi.clearAllMocks()
  })

  it('adds a new widget correctly', () => {
    const store = useCanvasStore.getState()
    store.addWidget('https://example.com', 100, 200)

    const updatedStore = useCanvasStore.getState()
    const widgetIds = Object.keys(updatedStore.widgets)
    
    expect(widgetIds.length).toBe(1)
    
    const widget = updatedStore.widgets[widgetIds[0]]
    expect(widget.url).toBe('https://example.com')
    expect(widget.x).toBe(100)
    expect(widget.y).toBe(200)
    expect(widget.interactionState).toBe('active')
    
    // Check if persistence was called (throttled/debounced logic, might need fake timers, but we just check if set is queued)
  })

  it('updates an existing widget', () => {
    const store = useCanvasStore.getState()
    store.addWidget('https://test.com', 0, 0)
    
    const widgetId = Object.keys(useCanvasStore.getState().widgets)[0]
    
    useCanvasStore.getState().updateWidget(widgetId, {
      interactionState: 'sleeping',
      screenshotBase64: 'data:image/png;base64,...'
    })
    
    const updatedWidget = useCanvasStore.getState().widgets[widgetId]
    expect(updatedWidget.interactionState).toBe('sleeping')
    expect(updatedWidget.screenshotBase64).toBe('data:image/png;base64,...')
  })

  it('removes a widget', () => {
    const store = useCanvasStore.getState()
    store.addWidget('https://test.com', 0, 0)
    
    const widgetId = Object.keys(useCanvasStore.getState().widgets)[0]
    expect(Object.keys(useCanvasStore.getState().widgets).length).toBe(1)
    
    useCanvasStore.getState().removeWidget(widgetId)
    expect(Object.keys(useCanvasStore.getState().widgets).length).toBe(0)
  })
  
  it('toggles omnibar and spacebar state', () => {
    useCanvasStore.getState().setOmnibarOpen(true)
    expect(useCanvasStore.getState().isOmnibarOpen).toBe(true)
    
    useCanvasStore.getState().setSpacebarHeld(true)
    expect(useCanvasStore.getState().isSpacebarHeld).toBe(true)
  })
})