# Full-Screen Focus Mode for Tabs

## Description
The green macOS window control button inside the widget header currently does nothing. It should be wired to trigger a "Focus Mode" that maximizes the browser tab to take up the full screen/canvas, temporarily hiding or pushing away the spatial environment.

## Status
Todo

## Sub-tasks
- Implement a `focus` or `fullscreen` interaction state alongside `active`, `minimized`, and `sleeping`.
- When triggered, animate the widget's bounds to match the window innerWidth/innerHeight, centering the camera perfectly on it.
- Disable panning while in focus mode.