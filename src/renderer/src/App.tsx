     1|import React, { useEffect } from 'react'
     2|import { SpatialCanvas } from './components/canvas/SpatialCanvas'
     3|// Omnibar
     4|import { useCanvasStore } from './store/useCanvasStore'
     5|
     6|function App() {
     7|  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()
     8|
     9|  useEffect(() => {
    10|    loadInitialState()
    11|
    12|    // Listen for Cmd+K and Spacebar
    13|    const handleKeyDown = (e: KeyboardEvent) => {
    14|      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    15|        e.preventDefault()
    16|        setOmnibarOpen(true)
    17|      }
    18|      if (e.code === 'Space') {
    19|        setSpacebarHeld(true)
    20|      }
    21|    }
    22|
    23|    const handleKeyUp = (e: KeyboardEvent) => {
    24|      if (e.code === 'Space') {
    25|        setSpacebarHeld(false)
    26|      }
    27|    }
    28|
    29|    window.addEventListener('keydown', handleKeyDown)
    30|    window.addEventListener('keyup', handleKeyUp)
    31|
    32|    // Listen to IPC from Preload (when inside a webview)
    33|    if ((window as any).api?.onToggleOmnibar) {
    34|      (window as any).api.onToggleOmnibar(() => setOmnibarOpen(true))
    35|    }
    36|
    37|    // AI Control Bridge (V2)
    38|    if ((window as any).api?.onAIEvent) {
    39|      (window as any).api.onAIEvent((data: any) => {
    40|        if (data.action === 'addWidget') {
    41|          addWidget(data.url, data.x, data.y)
    42|        } else if (data.action === 'updateWidget') {
    43|          updateWidget(data.id, data.updates)
    44|        }
    45|      })
    46|    }
    47|
    48|    return () => {
    49|      window.removeEventListener('keydown', handleKeyDown)
    50|      window.removeEventListener('keyup', handleKeyUp)
    51|    }
    52|  }, [setOmnibarOpen, setSpacebarHeld, addWidget, updateWidget, loadInitialState])
    53|
    54|  return (
    55|    <div className="w-screen h-screen relative overflow-hidden bg-background mac-drag-region flex flex-col">
    56|      {/* Floating Header */}
    57|      <div className="absolute top-0 w-[50%] left-1/2 -translate-x-1/2 mt-4 h-12 z-40 bg-[#131315]/80 backdrop-blur-2xl flex items-center px-6 pointer-events-auto rounded-full border border-outline-variant/20 shadow-[0px_12px_32px_rgba(255,255,255,0.1)] no-drag-region justify-between">
    58|        
    59|        {/* Left Side: Logo */}
    60|        <div className="flex items-center gap-2">
    61|          <div className="w-4 h-4 rounded bg-[#aac7ff]"></div>
    62|          <span className="text-[#e4e2e4] font-bold tracking-tight text-sm cursor-default">SpatialCommand</span>
    63|        </div>
    64|
    65|        {/* Center: Search */}
    66|        <div className="flex items-center gap-4 w-full max-w-sm justify-center">
    67|          <div onClick={() => setOmnibarOpen(true)} className="flex-1 flex items-center gap-2 bg-[#2a2a2c] rounded-full px-3 py-1.5 border border-[#414754]/50 hover:border-[#aac7ff]/50 transition-colors cursor-pointer group">
    68|            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b91a0] group-hover:text-[#aac7ff] transition-colors"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
    69|            <span className="text-xs text-[#8b91a0] group-hover:text-white transition-colors">Search or launch tab...</span>
    70|            <kbd className="px-1.5 py-0.5 bg-[#353437] rounded text-[10px] text-[#c0c6d6] ml-auto">⌘K</kbd>
    71|          </div>
    72|        </div>
    73|
    74|        {/* Right Side: Settings */}
    75|        <div className="flex items-center gap-4">
    76|          <button className="text-[#c0c6d6] hover:text-[#aac7ff] transition-colors">
    77|            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    78|              <circle cx="12" cy="12" r="3"></circle>
    79|              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    80|            </svg>
    81|          </button>
    82|        </div>
    83|      </div>
    84|
    85|      <div className="flex-1 w-full relative no-drag-region">
    86|        <SpatialCanvas />
    87|      </div>
    88|      
    89|      
    90|    </div>
    91|  )
    92|}
    93|
    94|export default App