# Disable Accidental Keyboard Shortcuts

## Description
When typing immediately after clicking the background canvas, tldraw accidentally triggers keyboard shortcuts (eg, drawing a circle when typing "c").

## Status
Done. Stripped `allowedShapeTypes` strictly to only our custom `browser_widget` arrays and forced `editor.setCurrentTool('select')` on mount so users cannot draw shapes over windows.

## Linked PRs
- 5746586