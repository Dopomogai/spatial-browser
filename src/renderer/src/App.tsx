import React, { useEffect, useState } from 'react'
import { SpatialCanvas } from "./components/canvas/SpatialCanvas"
import { TopTabBar } from "./components/TopTabBar"
// Omnibar
import { useCanvasStore } from './store/useCanvasStore'

function App() {
  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()
  const [showTopbar, setShowTopbar] = useState(true)

  useEffect(() => {
    loadInitialState()

    // Listen for Cmd+K and Spacebar
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Topbar visibility via Cmd+Shift+B
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
         e.preventDefault()
         setShowTopbar(prev => !prev)
      }
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="w-screen h-screen flex flex-col bg-surface text-on-surface overflow-hidden relative">
      
      {/* Top OS Window Control Area */}
      <div className="h-8 flex-none bg-surface-container-low border-b border-outline-variant/30 flex items-center px-4 drag-region z-50">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-900/50"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-900/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-900/50"></div>
        </div>
        <div className="text-xs font-semibold text-on-surface-variant flex-1 text-center font-mono opacity-50 tracking-widest uppercase">
          Dopomogai Spatial OS
        </div>
      </div>

      <div className="flex-1 w-full relative no-drag-region">
        {showTopbar && <TopTabBar />}
        <SpatialCanvas />
      </div>
      
    </div>
  )
}

export default App
