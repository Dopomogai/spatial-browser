import React, { useEffect, useState } from 'react'
import { Tldraw, useEditor, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { BrowserWidgetShapeUtil } from '../shapes/BrowserWidget/BrowserWidgetShapeUtil'
import { useCanvasStore } from '../../store/useCanvasStore'

const customShapeUtils = [BrowserWidgetShapeUtil]

const CanvasContent = () => {
  const editor = useEditor()
  const { widgets, addWidget, updateWidget } = useCanvasStore()
  const [initialized, setInitialized] = useState(false)

  // Sync state from Zustand to TLDraw (initial load)
  useEffect(() => {
    if (!initialized && Object.keys(widgets).length > 0) {
      Object.values(widgets).forEach(widget => {
        const shapeId = createShapeId(widget.id)
        if (!editor.getShape(shapeId)) {
          editor.createShape({
            id: shapeId,
            type: 'browser_widget',
            x: widget.x,
            y: widget.y,
            props: {
              w: widget.w,
              h: widget.h,
              widgetId: widget.id
            }
          } as any)
        }
      })
      setInitialized(true)
    }
  }, [editor, widgets, initialized])

  // Sync TLDraw changes back to Zustand
  useEffect(() => {
    const unsubscribe = editor.store.listen((updates) => {
      // Check for shape updates (movement, resize)
      Object.values(updates.changes.updated).forEach((change) => {
        const [oldShape, newShape] = change as any
        if (newShape.type === 'browser_widget') {
          updateWidget(newShape.props.widgetId, {
            x: newShape.x,
            y: newShape.y,
            w: newShape.props.w,
            h: newShape.props.h
          })
        }
      })
      
      // Check for newly added shapes via Omnibar
      Object.values(updates.changes.added).forEach((newShape: any) => {
         // Not handled here to avoid infinite loops, adding is driven by Zustand
      })
    }, { source: 'user', scope: 'document' })

    return () => unsubscribe()
  }, [editor, updateWidget])

  // Viewport Intersection Check (The Sleeping Tab mechanism)
  useEffect(() => {
    const checkViewport = () => {
      const bounds = editor.getViewportScreenBounds()
      const buffer = 500 // 500px buffer zone
      
      Object.values(widgets).forEach(widget => {
        const shapeId = createShapeId(widget.id)
        const shape = editor.getShape(shapeId)
        if (!shape) return

        // Get absolute coordinates on canvas
        const shapePageBounds = editor.getShapePageBounds(shape)
        if (!shapePageBounds) return

        // Check if shape is inside the expanded viewport
        const isVisible = (
          shapePageBounds.maxX > (bounds.minX - buffer) &&
          shapePageBounds.minX < (bounds.maxX + buffer) &&
          shapePageBounds.maxY > (bounds.minY - buffer) &&
          shapePageBounds.minY < (bounds.maxY + buffer)
        )

        if (!isVisible && widget.interactionState === 'active') {
          updateWidget(widget.id, { interactionState: 'sleeping' })
        } else if (isVisible && widget.interactionState === 'sleeping') {
          updateWidget(widget.id, { interactionState: 'active' })
        }
      })
    }

    // Run check periodically
    const interval = setInterval(checkViewport, 1000)
    return () => clearInterval(interval)
  }, [editor, widgets, updateWidget])

  // Listen for new widgets added from Zustand and create shapes for them
  useEffect(() => {
    Object.values(widgets).forEach(widget => {
      const shapeId = createShapeId(widget.id)
      if (!editor.getShape(shapeId)) {
        editor.createShape({
          id: shapeId,
          type: 'browser_widget',
          x: widget.x,
          y: widget.y,
          props: {
            w: widget.w,
            h: widget.h,
            widgetId: widget.id
          }
        } as any)
      }
    })
  }, [widgets, editor])

  return null
}

export const SpatialCanvas: React.FC = () => {
  return (
    <div className="w-full h-full relative" style={{ background: 'transparent' }}>
      <Tldraw
        shapeUtils={customShapeUtils}
        components={{
          Toolbar: null,
          DebugMenu: null,
          ContextMenu: null,
          PageMenu: null,
          NavigationPanel: null,
          MainMenu: null,
          StylePanel: null,
          ZoomMenu: null,
          Minimap: null,
          HelperButtons: null,
          QuickActions: null,
          ActionsMenu: null,
          HelpMenu: null,
          SharePanel: null
        }}
        options={{
          maxPages: 1,
        }}
      >
        <CanvasContent />
      </Tldraw>
    </div>
  )
}