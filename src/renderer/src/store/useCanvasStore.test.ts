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
      // Viewport bounds calculation in calculateCulling:
      // vpX = -lastViewport.x / zoom, vpW = innerWidth / zoom
      // marginX = vpW
      // cullBox.x1 = vpX - marginX // = vpX - vpW
      // cullBox.x2 = vpX + vpW + marginX // = vpX + 2*vpW
      
      // Setup simple viewport: 1000x1000 window, zoom 1, no translation. 
      // Thus vp: x=0, y=0, w=1000, h=1000
      // x1 = -1000, x2 = 2000
      // y1 = -1000, y2 = 2000
      vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 1000 });
      useCanvasStore.setState({ lastViewport: { x: 0, y: 0, zoom: 1 } })
      
      // Node size is 300x200 by default in the culling logic if w, h missing (from code)
      
      // Inside node: center
      const nodeInside = { id: 'n1', position: { x: 500, y: 500 }, data: { w: 300, h: 200 } }
      // Bordering/Margin node: touches x2 limit
      const nodeBordering = { id: 'n2', position: { x: -1200, y: 500 }, data: { w: 300, h: 200 } } // x+w = -900 > -1000, so visible
      // Outside node: far away
      const nodeOutside1 = { id: 'n3', position: { x: 5000, y: 500 }, data: { w: 300, h: 200 } }
      const nodeOutside2 = { id: 'n4', position: { x: -1400, y: 500 }, data: { w: 300, h: 200 } } // x+w = -1100 < -1000, outside
      
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
