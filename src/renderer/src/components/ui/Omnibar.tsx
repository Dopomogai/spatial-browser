import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import { Search } from 'lucide-react'

export const Omnibar: React.FC = () => {
  const { isOmnibarOpen, setOmnibarOpen, addWidget, omnibarPosition } = useCanvasStore()
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (isOmnibarOpen) {
       setTimeout(() => {
          inputRef.current?.focus()
       }, 50)
    } else {
        setUrl('')
    }
  }, [isOmnibarOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOmnibarOpen) {
        setOmnibarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOmnibarOpen, setOmnibarOpen])

  if (!isOmnibarOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let finalUrl = url.trim()
    // More robust regex to catch "google.com", "localhost:3000", "192.168.1.1", etc.
    const domainRegex = /^(https?:\/\/)?((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|(localhost)|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:\d+)?(\/.*)?$/i;
    
    if (domainRegex.test(finalUrl)) {
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`
      }
    } else {
        // Fallback to Google Search
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`
    }

    let centerX = 0
    let centerY = 0
    
    // Natively provided by ReactFlow! No need to pipe the `editor` down here, 
    // the Omnibar can just dispatch the raw creation and SpatialCanvas will handle the screen-to-flow mapping
    // if an override was provided.

    if (omnibarPosition) {
        // Here we just map exactly where the context menu was clicked. We let ReactFlow's creation logic handle offsets.
        centerX = omnibarPosition.x - 400
        centerY = omnibarPosition.y - 300
    } // else, arbitrary center fallbacks are handled later

    addWidget(finalUrl, centerX, centerY)
    setOmnibarOpen(false)
  }

  // Calculate style based on whether omnibarPosition is set
  const containerStyle: React.CSSProperties = omnibarPosition ? {
      position: 'absolute',
      top: 0, // This logic is wrong when inside TLDraw canvas coords
      left: 0,
      transform: `translate(${omnibarPosition.x}px, ${omnibarPosition.y}px)`,
      zIndex: 1000,
  } : {
      position: 'fixed',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
  }

  return (
    <div style={containerStyle}>
      <form 
        onSubmit={handleSubmit}
        className="w-[600px] bg-neutral-900 rounded-xl shadow-2xl overflow-hidden border border-neutral-800 flex flex-col"
      >
        <div className="flex items-center px-4 py-4 gap-4">
          <Search className="w-6 h-6 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Search or enter URL, then hit Enter"
            className="flex-1 bg-transparent text-white text-xl outline-none placeholder:text-neutral-500"
          />
        </div>
        <div className="bg-neutral-800/50 px-4 py-2 flex justify-between text-xs text-neutral-500 border-t border-neutral-800">
          <span>Press Enter to open and Esc to cancel</span>
        </div>
      </form>
    </div>
  )
}