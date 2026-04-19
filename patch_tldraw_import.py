import os

file_path = '/root/Documents/GitHub/spatial-browser/src/renderer/src/components/canvas/SpatialCanvas.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Explicitly import from tldraw to try and bypass dynamic import issues
if "import { Tldraw, useEditor, createShapeId } from 'tldraw'" in content:
    new_content = content.replace(
        "import { Tldraw, useEditor, createShapeId } from 'tldraw'",
        "import { Tldraw, useEditor, createShapeId, DefaultCanvas } from 'tldraw'"
    )
    with open(file_path, 'w') as f:
        f.write(new_content)
