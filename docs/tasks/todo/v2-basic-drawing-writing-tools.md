# Whiteboarding: Basic Drawing & Writing Tools
**Issue:** The user wants primitive drawing (pens, rectangles) and writing (text) tools embedded within the spatial canvas, activated by specific shortcuts or buttons.
**Resolution:** This is entirely new functionality since stripping `TLDraw` for `ReactFlow`. We need to introduce new Node types for basic SVG drawing overlays (`<svg>` pointer captures) and plain `<textarea>` nodes for text, then integrate them.
