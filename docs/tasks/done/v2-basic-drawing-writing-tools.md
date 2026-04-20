# Whiteboarding: Basic Drawing & Writing Tools
**Issue:** The user wants primitive drawing (pens, rectangles, groups) and writing (text) tools embedded within the spatial canvas, activated by specific shortcuts or buttons.
**Hypothesis:** `TLDraw` formerly managed all vector data. We must now re-build these nodes natively in `ReactFlow`.
**Actionable Fix:** 
1. Build a new `<TextNode/>` mapping `type: text` inside `SpatialCanvas.tsx` utilizing a transparent `<textarea>` block natively updating `data.text` via `onChange`.
2. Build an SVG drawing capture node mapping `onPointerMove`, persisting coordinates tightly to Zustand.
3. Build a region select or `GroupNode` mapping `type: group` allowing spatial boxes to encase tabs logically.
4. Expand the Omnibar UI to conditionally map tools (Pen, Text, Tab) using hardware triggers.
