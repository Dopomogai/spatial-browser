import React, { useEffect } from 'react'
import { SpatialCanvas } from './components/canvas/SpatialCanvas'
import { Omnibar } from './components/ui/Omnibar'
import { useCanvasStore } from './store/useCanvasStore'

function App() {
  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()

  const handle100TabTest = () => {
    for (let i = 0; i < 100; i++) {
      // Scatter randomly across a 15000x15000 area
      const x = Math.random() * 15000 - 7500
      const y = Math.random() * 15000 - 7500
      // We use diverse URLs to test memory usage across different sites if possible, or just example.com
      const urls = [
        'https://example.com',
        'https://wikipedia.org',
        'https://react.dev'
      ]
      const url = urls[Math.floor(Math.random() * urls.length)]
      addWidget(url, x, y)
    }
  }

  useEffect(() => {
    loadInitialState()
  }, [])

  useEffect(() => {
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
  }, [setOmnibarOpen, setSpacebarHeld])

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-background mac-drag-region flex flex-col">
      {/* Floating Header */}
      <div className="absolute top-0 w-full h-12 z-40 bg-surface-container-low/80 backdrop-blur-2xl flex items-center px-6 pointer-events-auto border-b border-outline-variant/10">
        <div className="flex gap-2 mr-6">
          <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
          <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
          <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
        </div>
        <span className="text-primary font-bold tracking-tight text-sm no-drag-region cursor-default">SpatialCommand</span>
        
        {/* 100 Tab Test Button */}
        <button 
          onClick={handle100TabTest}
          className="ml-6 px-3 py-1 bg-surface-container-highest text-primary text-xs font-semibold uppercase tracking-widest rounded-full border border-outline-variant/30 hover:bg-primary-container/20 transition-colors no-drag-region cursor-pointer"
        >
          100 Tab Test
        </button>

        <div className="ml-auto text-xs text-on-surface-variant/60 uppercase tracking-widest font-semibold flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-surface-container-highest rounded border border-outline-variant/20">⌘K</kbd> 
          Command
        </div>
      </div>

      <div className="flex-1 w-full relative mt-12 no-drag-region">
        <SpatialCanvas />
      </div>
      
      
    </div>
  )
}

export default App