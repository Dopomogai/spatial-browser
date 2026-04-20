# Canvas Context Menu Spawning

## Description
Spawning a new tab from the Top Bar works correctly, but using the Right-Click Context Menu on the Canvas -> "Spawn Tab Here" fails to instantiate a new tab in the 3D space.

## Status
Todo

## Sub-tasks
- Trace the `spawn-tab-center` or coordinate-specific spawn event from the canvas context menu.
- Ensure the event correctly hits the Zustand store or TLDraw shape creation bridge.