import React, { useEffect, useState } from 'react'
import { SpatialCanvas } from "./components/canvas/SpatialCanvas"
import { TopTabBar } from "./components/TopTabBar"
// Omnibar
import { useCanvasStore } from './store/useCanvasStore'

function App() {
  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()
  const [showTopbar, setShowTopbar] = useState(true)
  const [showNewProfileModal, setShowNewProfileModal] = useState(false)

  useEffect(() => {
    loadInitialState()

    const handleProfileModalOpen = () => setShowNewProfileModal(true)
    window.addEventListener('open-new-profile-modal', handleProfileModalOpen)

    // Listen for Cmd+K and Spacebar
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default undo action so we cleanly use our array engine
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
             useCanvasStore.getState().redo()
          } else {
             useCanvasStore.getState().undo()
          }
      }

      if (e.key === 'Shift') {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: true } }))
      }
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
      if (e.key === 'Shift') {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: false } }))
      }
      if (e.code === 'Space') {
        setSpacebarHeld(false)
      }
    }

    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.on('shift-state-change', (_event, isHeld) => {
            window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: isHeld } }));
        });
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('open-new-profile-modal', handleProfileModalOpen)
      if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.removeAllListeners('shift-state-change')
      }
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

      {/* New Profile Modal */}
      {showNewProfileModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-surface_container_highest border border-white/10 rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                  <h3 className="text-lg font-semibold text-white mb-2">Save New Profile</h3>
                  <p className="text-sm text-on_surface_variant mb-4">Name your current spatial workspace tab layout.</p>
                  
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('profileName') as string;
                      if (name.trim()) {
                          useCanvasStore.getState().saveProfileAs(name.trim());
                      }
                      setShowNewProfileModal(false);
                  }}>
                      <input 
                          autoFocus
                          type="text" 
                          name="profileName"
                          placeholder="e.g. Marketing Dashboard" 
                          required
                          className="w-full bg-surface_container_lowest border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-primary/50 transition-colors mb-4"
                      />
                      <div className="flex justify-end gap-2">
                          <button 
                              type="button" 
                              onClick={() => setShowNewProfileModal(false)}
                              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              type="submit"
                              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 shadow-md transition-colors"
                          >
                              Save Canvas
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
    </div>
  )
}

export default App
