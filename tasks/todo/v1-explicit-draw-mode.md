# Explicit Draw Mode vs. Canvas Navigation

## Description
Double-clicking the canvas accidentally enters a TLDraw text-input/drawing state, which also weirdly triggers the map focus reset. If we want drawing features, they need to be gated behind an explicit "Draw Mode" toggle button, leaving the default canvas state strictly for spatial navigation and window management.

## Status
Todo

## Sub-tasks
- Disable double-click text creation in TLDraw config.
- Create a UI toggle (toolbar) for "Spatial Mode" vs "Whiteboard Mode".
- Only allow non-widget shape creation when "Whiteboard Mode" is active.