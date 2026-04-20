import re

with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/components/canvas/SpatialCanvas.tsx", "r") as f:
    content = f.read()

old_block = """    const handleSpawnSettings = () => {
        const viewport = getViewport()
        const scale = viewport.zoom
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const centerXV = windowWidth / 2
        const centerYV = windowHeight / 2"""

new_block = """    const handleSpawnSettings = () => {
        const id = `settings_widget_${Date.now()}`
        const viewport = getViewport()
        const scale = viewport.zoom
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const centerXV = windowWidth / 2
        const centerYV = windowHeight / 2"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open("/root/Documents/GitHub/spatial-browser/src/renderer/src/components/canvas/SpatialCanvas.tsx", "w") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Could not find old block")
