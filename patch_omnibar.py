import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/src/App.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Move Omnibar INSIDE the Tldraw component where the editor context exists
new_content = content.replace(
    "<Omnibar />",
    ""
)

with open(file_path, 'w') as f:
    f.write(new_content)

canvas_path = '/root/Documents/GitHub/spatial-browser/src/renderer/src/components/canvas/SpatialCanvas.tsx'

with open(canvas_path, 'r') as f:
    canvas_content = f.read()

# Inject Omnibar into SpatialCanvas
canvas_new_content = canvas_content.replace(
    "import { useCanvasStore } from '../../store/useCanvasStore'",
    "import { useCanvasStore } from '../../store/useCanvasStore'\nimport { Omnibar } from '../ui/Omnibar'"
)

canvas_new_content = canvas_new_content.replace(
    "<CanvasContent />\n      </Tldraw>",
    "<CanvasContent />\n        <Omnibar />\n      </Tldraw>"
)

with open(canvas_path, 'w') as f:
    f.write(canvas_new_content)

