---
title: "Deleted Tab Ghosting Bug"
status: "todo"
priority: "high"
created_at: "2026-04-20"
---

# Issue
When deleting a widget from the literal canvas (clicking the Red Mac window control or pressing Del), the tab stays lodged inside the `TopTabBar` component.
Clicking it spawns it entirely back into existence.

# Cause
The `editor.deleteShape(shape.id)` is not properly sweeping the state inside Zustand via a `beforeDelete` event, or the hook inside `SpatialCanvas.tsx` listener isn't watching TLShape deletion payloads to cross-post `removeWidget(id)` to the Store array.

# Required Fix
Bind `useCanvasStore.getState().removeWidget()` to shape deletions within TLDraw's listener.