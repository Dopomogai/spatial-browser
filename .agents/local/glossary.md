# Glossary

CanvasOS-specific terms.

## canvas

The infinite 2D surface that hosts widgets. Implemented via `@xyflow/react`. "The canvas" usually refers to the rendered surface plus its viewport state (pan/zoom).

## node

An xyflow-rendered element on the canvas. Every widget is a node. Don't confuse with DOM nodes or with backend nodes — when ambiguous, say "canvas node."

## widget

A user-visible interactive element placed on the canvas. Examples: browser widget (a webview), shape widgets, tab widgets. Implemented as a node type registered in `nodeTypes`.

## browser widget

The flagship widget — an embedded Electron webview that the user can drop on the canvas as a draggable, resizable browser tab. Source under `src/renderer/src/components/shapes/BrowserWidget/`.

## tab

A browser-widget instance. Multiple tabs can coexist on the canvas. The user can navigate, reload, and close tabs independently.

## panel

A floating UI surface separate from the canvas — toolbars, sidebars, modals. Panels live above the canvas in z-order and are not nodes.

## shape

A non-browser widget type — e.g., notes, drawings. Shapes are nodes too; "shape" is reserved for the lighter-weight, non-webview variants.

## viewport

The pan/zoom state of the canvas. Stored in the canvas store; persists to Supabase.

## supabase sync

The background process that mirrors local store state to a Supabase project. Debounced; see `local/untouchables.md` for the why.

## spatial browser

The product name. Sometimes shortened to "the browser" — but the broader product is "CanvasOS" (the spatial-browser is its first incarnation).

## xyflow

The current canvas library (`@xyflow/react`). Treat as canonical; "tldraw" mentions in older code/docs are legacy from the pre-migration era.
