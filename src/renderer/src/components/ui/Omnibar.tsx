import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '../../store/useCanvasStore'
import { Search } from 'lucide-react'
import { useEditor } from 'tldraw'

export const Omnibar: React.FC = () => {
  const { isOmnibarOpen, setOmnibarOpen, addWidget } = useCanvasStore()
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Need to get the editor to find viewport center
  const editor = useEditor()

  useEffect(() => {
    if (isOmnibarOpen) {
      inputRef.current?.focus()
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
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`
    }

    const bounds = editor.getViewportPageBounds()
    const centerX = bounds.x + bounds.w / 2 - 400 // half of default widget width
    const centerY = bounds.y + bounds.h / 2 - 300 // half of default widget height

    addWidget(finalUrl, centerX, centerY)
    setOmnibarOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={() => setOmnibarOpen(false)} />
      
      <form 
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-2xl bg-surface-container-highest/80 backdrop-blur-2xl rounded-2xl border border-outline-variant/30 shadow-[0_24px_48px_rgba(0,0,0,0.5)] p-2 flex items-center gap-3"
      >
        <div className="pl-4">
          <Search className="w-6 h-6 text-primary/80" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL or search..."
          className="flex-1 bg-transparent border-none text-xl text-on-surface focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/40 py-4"
        />
        <div className="pr-4 flex items-center gap-2 text-xs text-on-surface-variant/60 font-semibold tracking-widest uppercase">
          <kbd className="px-2 py-1 bg-surface-container-low rounded border border-outline-variant/20">↵</kbd>
          to open
        </div>
      </form>
    </div>
  )
}