import React, { useEffect, useState } from 'react'
import { SpatialCanvas } from "./components/canvas/SpatialCanvas"
import { TopTabBar } from "./components/TopTabBar"
// Omnibar
import { useCanvasStore } from './store/useCanvasStore'

function App() {
  const { setOmnibarOpen, setSpacebarHeld, loadInitialState, addWidget, updateWidget } = useCanvasStore()
  const isTopTabBarVisible = useCanvasStore(state => state.isTopTabBarVisible)
  const setTopTabBarVisible = useCanvasStore(state => state.setTopTabBarVisible)
  const [showNewProfileModal, setShowNewProfileModal] = useState(false)

  useEffect(() => {
    loadInitialState()

    const handleProfileModalOpen = () => setShowNewProfileModal(true)
    window.addEventListener('open-new-profile-modal', handleProfileModalOpen)

    // Listen for Cmd+K and Spacebar
    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.code === 'Space') {
        setSpacebarHeld(true)
      }

      if (e.key === 'Shift') {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: true } }))
      }
      // Toggle Topbar visibility via Cmd+Shift+B
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
         e.preventDefault()
         setTopTabBarVisible(!useCanvasStore.getState().isTopTabBarVisible)
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
      if (e.code === 'Space') {
        setSpacebarHeld(false)
      }
    }

    const handleIpcShiftState = (_event: any, isHeld: boolean) => {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: isHeld } }));
    };

    const handleIpcUndo = () => {
      useCanvasStore.getState().undo()
    }
    
    const handleIpcRedo = () => {
      useCanvasStore.getState().redo()
    }
    
    const handleIpcCut = () => {
      // We will let native UI handle the text cut. 
      // For React flow, we could optionally delete the currently selected node here,
      // but we need to track selected nodes first. Since this isn't globally exposed in useCanvasStore easily yet,
      // we will rely on native cut working on text fields, which is the primary issue.
    }

    const handleWindowBlur = () => {
        window.dispatchEvent(new CustomEvent('shift-state-change', { detail: { held: false } }));
    };

    if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.on('shift-state-change', handleIpcShiftState);
        window.electron.ipcRenderer.on('undo-action', handleIpcUndo);
        window.electron.ipcRenderer.on('redo-action', handleIpcRedo);
        window.electron.ipcRenderer.on('cut-action', handleIpcCut);
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('open-new-profile-modal', handleProfileModalOpen)
      if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.removeListener?.('shift-state-change', handleIpcShiftState)
          window.electron.ipcRenderer.removeListener?.('undo-action', handleIpcUndo)
          window.electron.ipcRenderer.removeListener?.('redo-action', handleIpcRedo)
          window.electron.ipcRenderer.removeListener?.('cut-action', handleIpcCut)
      }
    }
  }, [])

  return (
    <div className="w-screen h-screen flex flex-col bg-surface text-on-surface overflow-hidden relative">
      


      <div className="flex-1 w-full relative no-drag-region">
        {isTopTabBarVisible && <TopTabBar />}
        <SpatialCanvas />
      </div>

      {/* New Profile Modal */}
      {showNewProfileModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onPointerDown={(e) => e.stopPropagation()}
          >
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
