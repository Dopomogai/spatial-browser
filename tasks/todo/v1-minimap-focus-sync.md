# Minimap Focus & Viewport Sync

## Description
The minimap's focus area (the white viewport box) works weirdly. It does not update reactively when naturally panning around the canvas. It only updates/resets if the user double-clicks the canvas.

## Status
Todo

## Sub-tasks
- Ensure `editor.store.listen` or the camera movement hook correctly updates the local `viewportBounds` state in the Minimap component during continuous panning.