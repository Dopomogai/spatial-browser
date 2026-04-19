import React, { useEffect } from 'react'
import { SpatialCanvas } from './components/canvas/SpatialCanvas'
// Omnibar
import { useCanvasStore } from './store/useCanvasStore'

function App() {
  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()

  useEffect(() => {
    loadInitialState()

    // Listen for Cmd+K and Spacebar
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOmnibarOpen(true)
      }
      if (e.code === 'Space') {
        setSpacebarHeld(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacebarHeld(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Listen to IPC from Preload (when inside a webview)
    if ((window as any).api?.onToggleOmnibar) {
      (window as any).api.onToggleOmnibar(() => setOmnibarOpen(true))
    }

    // AI Control Bridge (V2)
    if ((window as any).api?.onAIEvent) {
      (window as any).api.onAIEvent((data: any) => {
        if (data.action === 'addWidget') {
          addWidget(data.url, data.x, data.y)
        } else if (data.action === 'updateWidget') {
          updateWidget(data.id, data.updates)
        }
      })
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setOmnibarOpen, setSpacebarHeld, addWidget, updateWidget, loadInitialState])

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-background mac-drag-region flex flex-col">
      {/* Floating Header */}
      <div className="absolute top-0 w-[50%] left-1/2 -translate-x-1/2 mt-4 h-12 z-40 bg-[#131315]/80 backdrop-blur-2xl flex items-center px-6 pointer-events-auto rounded-full border border-outline-variant/20 shadow-[0px_12px_32px_rgba(255,255,255,0.1)] no-drag-region justify-between">
        
        {/* Left Side: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#aac7ff]"></div>
          <span className="text-[#e4e2e4] font-bold tracking-tight text-sm cursor-default">SpatialCommand</span>
        </div>

        {/* Center: Tab Links */}
        <div className="flex gap-6 items-center text-sm font-medium text-[#c0c6d6]">
          <button className="hover:text-[#aac7ff] transition-colors">Data Vis</button>
          <button className="hover:text-[#aac7ff] transition-colors">API Docs</button>
          <button className="hover:text-[#aac7ff] transition-colors">Team Comms</button>
        </div>

        {/* Right Side: Search & Settings */}
        <div className="flex items-center gap-4">
          {/* Mock Search Input */}
          <div className="flex items-center gap-2 bg-[#2a2a2c] rounded-full px-3 py-1.5 border border-[#414754]/50 hover:border-[#aac7ff]/50 transition-colors cursor-pointer" onClick={() => setOmnibarOpen(true)}>
            <span className="text-xs text-[#8b91a0]">Search...</span>
            <kbd className="px-1.5 py-0.5 bg-[#353437] rounded text-[10px] text-[#c0c6d6]">⌘K</kbd>
          </div>
          
          {/* Settings Icon */}
          <button className="text-[#c0c6d6] hover:text-[#aac7ff] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative no-drag-region">
        <SpatialCanvas />
      </div>
      
      
    </div>
  )
}

export default App