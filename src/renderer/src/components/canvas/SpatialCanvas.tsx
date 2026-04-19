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