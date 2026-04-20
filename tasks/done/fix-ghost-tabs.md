# Fix V1 Ghost Tabs

## Description
When closing a tab physically on the canvas (using the MacOS red dot button), the tab disappears from the canvas but occasionally leaves an orphaned entry in the Zustands store, meaning it remains visible in the Top Tab bar component. Clicking the ghost tab then resurrects an errored, minimized tab.

## Status
Done. Re-bound the `editor.store.listen` payload in `SpatialCanvas.tsx` to automatically catch `[...updates.changes.removed]` shapes and broadcast an immediate `.removeWidget()` upstream.

## Linked PRs
- c4ce524