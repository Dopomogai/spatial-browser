import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  getPreloadPath: () => __filename,
  onToggleOmnibar: (callback: () => void) => {
    ipcRenderer.on('toggle-omnibar', callback)
  },
  removeToggleOmnibar: (callback: () => void) => {
    ipcRenderer.removeListener('toggle-omnibar', callback)
  },
  onAIEvent: (callback: (data: any) => void) => {
    ipcRenderer.on('ai-event', (event, data) => callback(data))
  }
}

// Inject standard IPC bridge
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
        on: (channel: string, func: (...args: any[]) => void) => {
          ipcRenderer.on(channel, (event, ...args) => func(...args))
        }
      }
    })
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = { ipcRenderer }
  // @ts-ignore (define in dts)
  window.api = api
}

// --- KEYBOARD TRAP SOLUTION ---
// This handles keys when focus is inside a webview
// Pass context menu right-clicks up to the main process natively
window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ipcRenderer.send('show-webview-context-menu', { x: e.clientX, y: e.clientY })
})

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    // Send to host (React app) if this script is running inside a webview
    // We try IPC first, or sendToHost if it's a webview
    try {
      ipcRenderer.sendToHost('toggle-omnibar')
    } catch {
      // Direct ipc to main process if it's the main window
      ipcRenderer.send('toggle-omnibar')
    }
  }
})