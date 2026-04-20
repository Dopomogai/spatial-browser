---
title: "Context-Menu Close Escape"
status: "todo"
priority: "medium"
created_at: "2026-04-20"
---

# Issue
Once the canvas right-click context menu opens (the "Center View" / "Spawn Tab" floating box), clicking away or pressing Esc does not close it.

# Requirements
- Ensure `onClick` or `window` click listeners properly unmount the `contextMenuOpen` React state if the user clicks outside the box.