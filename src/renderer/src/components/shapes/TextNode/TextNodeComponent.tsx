import React, { useRef, useEffect } from 'react'
import { useCanvasStore } from '../../../store/useCanvasStore'

// A pure HTML textarea adapted for the spatial canvas.
export const TextNodeComponent = React.memo(({ id, data, selected }: { id: string, data: Record<string, any>, selected: boolean }) => {
  const updateWidgetData = useCanvasStore(state => state.updateWidgetData)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const text = data?.text || ''
  const w = data?.w || 200
  const h = data?.h || 100

  // Auto-resize height based on scrollHeight, max out at some reasonable limit to prevent crazy long nodes, or let the user resize.
  // For V1, we will just let it grow downward natively or be sized.
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        
        // Update the underlying store height if it grew beyond the initial data.h
        if (textareaRef.current.scrollHeight > h) {
            updateWidgetData(id, { h: textareaRef.current.scrollHeight })
        }
    }
  }, [text, h, id, updateWidgetData])

  return (
    <>
      <div 
        className={`
          relative w-full h-full 
          group 
          ${selected ? 'ring-2 ring-primary/50 rounded-lg' : ''}
        `}
        style={{ width: w, minHeight: h }}
        onPointerDown={() => window.dispatchEvent(new Event('close-context-menu'))}
      >
        <textarea
            ref={textareaRef}
            className="w-full h-full bg-transparent text-white/90 placeholder-white/30 resize-none outline-none font-sans text-lg leading-relaxed p-4"
            placeholder="Type something..."
            value={text}
            onChange={(e) => updateWidgetData(id, { text: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()} // Let the user click into the text area without panning the canvas
            onKeyDown={(e) => e.stopPropagation()} // Stop backspace from deleting the node while typing (ReactFlow intercepts)
            style={{ 
                minWidth: '200px', 
                minHeight: '100px',
                overflow: 'hidden' // We auto-grow it
            }}
        />

        {/* Drag handle for moving without selecting text */}
        <div 
            className="absolute top-0 left-0 right-0 h-4 opacity-0 group-hover:opacity-100 bg-white/5 cursor-grab active:cursor-grabbing rounded-t-lg transition-opacity"
            // We don't need onMouseDown preventDefault here, as we WANT this to trigger ReactFlow's drag
        />
        
        {/* Resize handle (bottom right) */}
        <div 
            className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
            onMouseDown={(e) => {
                e.stopPropagation()
                const startX = e.clientX
                const startW = w
                
                const onMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX
                    updateWidgetData(id, { w: Math.max(200, startW + deltaX) })
                }
                
                const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove)
                    window.removeEventListener('mouseup', onMouseUp)
                }
                
                window.addEventListener('mousemove', onMouseMove)
                window.addEventListener('mouseup', onMouseUp)
            }}
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-white">
                <polyline points="15 3 21 3 21 9"/>
                <polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
        </div>
      </div>
    </>
  )
})
