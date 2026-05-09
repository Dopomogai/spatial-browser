/**
 * @purpose React DOM root mount; renders <App> inside StrictMode.
 * @why Standard Vite + React entry point required by the renderer process.
 * @role entry
 * @exports -
 * @uses App, ./index.css
 * @stability stable
 * @gotchas React 19 StrictMode double-invokes effects — interacts with webview lifecycle in BrowserWidgetNode
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)