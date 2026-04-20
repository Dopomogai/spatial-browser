import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { WebSocketServer } from 'ws'

// AI Setup: remote debugging for DOM scraping
app.commandLine.appendSwitch('remote-debugging-port', '9222')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')

// Suppress dev security warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let mainWindow: BrowserWindow | null = null

// Setup WebSocket server for V2 AI Backend
function setupWebSocketServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080
  const wss = new WebSocketServer({ port })
  console.log(`WebSocket Server running on ws://localhost:${port}`)

  // Hardened WebView isolation
app.on('web-contents-created', (event, contents) => {
  contents.on('before-input-event', (event, input) => {
    if (input.key === 'Shift') {
      const isHeld = input.type === 'keyDown'
      if (mainWindow) {
        mainWindow.webContents.send('shift-state-change', isHeld)
      }
    }
  })

  if (contents.getType() === 'webview') {
    // Intercept native Webview right-clicks and explicitly ask Electron to pop a basic text-editing menu
    // This provides native copy/paste without breaking React layer clicks
    contents.on('context-menu', (e, params) => {
      e.preventDefault();
      
      const menu = Menu.buildFromTemplate([
        { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
        { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
        { label: 'Cut', role: 'cut', enabled: params.editFlags.canCut },
        { type: 'separator' },
        { label: 'Select All', role: 'selectAll', enabled: params.editFlags.canSelectAll },
        { type: 'separator' },
        { 
          label: 'Spawn Empty Tab Here', 
          click: () => {
             if (mainWindow) mainWindow.webContents.send('spawn-tab-center')
          }
        }
      ])
      
      if (mainWindow) {
         menu.popup({ window: mainWindow || undefined })
      }
    });

    contents.setWindowOpenHandler(({ url }) => {
        if (mainWindow) {
           // Send event to React store to spawn a natively styled Spatial Tab
           mainWindow.webContents.send('spawn-tab-from-link', url)
        }
        return { action: 'deny' }
      })

      // Intercept and prevent sandbox escapes/navigation to weird local protocols
      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl)
        if (parsedUrl.protocol === 'file:') {
          event.preventDefault()
          console.warn('Blocked file:// protocol navigation in webview')
        }
      })
  }
})

  wss.on('connection', (ws) => {
    console.log('AI Backend Connected')
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        console.log('Received from AI:', data)
        
        if (mainWindow) {
          // Forward event to React renderer via IPC
          mainWindow.webContents.send('ai-event', data)
        }
      } catch (e) {
        console.error('Invalid WS Message', e)
      }
    })
    
    ws.send(JSON.stringify({ status: 'connected', message: 'Spatial Browser Ready' }))
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    titleBarStyle: 'hiddenInset', // Mac-native UX
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      // Important: webSecurity must be explicitly true for production. 
      // V1 uses false solely for local sandboxed agent debugging of CORS-hostile websites,
      // but it throws warnings via Chromium natively.
      sandbox: false,
      webviewTag: true,
      webSecurity: false, 
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Open external links in default browser or handle otherwise
    return { action: 'allow' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  setupWebSocketServer()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC for Cmd+K and other global events
ipcMain.on('toggle-omnibar', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.webContents.send('toggle-omnibar')
  }
})

ipcMain.on("toggle-fullscreen", (event, tabId) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const isFullScreen = win.isFullScreen();
    win.setFullScreen(!isFullScreen);
    
    // We send an event back so React Flow can intercept it and physically maximize the targeted React Flow node bounds
    win.webContents.send("fullscreen-toggled", { tabId, isFullScreen: !isFullScreen });
  }
});
ipcMain.on('show-webview-context-menu', (event, params) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const template = [
    { label: 'Reload Page', role: 'reload' as const },
    { type: 'separator' as const },
    { label: 'Copy', role: 'copy' as const },
    { label: 'Paste', role: 'paste' as const },
    { label: 'Cut', role: 'cut' as const },
    { type: 'separator' as const },
    { label: 'Select All', role: 'selectAll' as const }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  if (params && params.x !== undefined && params.y !== undefined) {
    menu.popup({ window: win, x: Math.round(params.x), y: Math.round(params.y) });
  } else {
    menu.popup({ window: win });
  }
})