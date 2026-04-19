import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/src/components/canvas/SpatialCanvas.tsx'

with open(file_path, 'r') as f:
    content = f.read()

new_content = content.replace(
    "// Listen for new widgets added from Zustand and create shapes for them",
    """// Viewport Intersection Check (The Sleeping Tab mechanism)
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

  // Listen for new widgets added from Zustand and create shapes for them"""
)

with open(file_path, 'w') as f:
    f.write(new_content)
