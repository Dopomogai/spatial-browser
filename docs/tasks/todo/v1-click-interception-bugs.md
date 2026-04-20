# Pointer Events & Interception Bugs (Tabs & Settings)

## Description
Several UI elements are failing to receive pointer events properly due to overlapping transparent layers or incorrect state toggles:
1. **Minimized Tabs:** Can be dragged nicely, but clicking them does NOT expand them back to full view. They only expand after being dragged.
2. **Settings Widget:** Spawns correctly, but everything inside is unclickable (except dropdowns).
3. **Double Menus:** Still experiencing double menus (Chromium vs Canvas levels).

## Status
Todo

## Sub-tasks
- Fix `onClick` vs `onPointerDown` stopPropagation on the Minimized Tab pill.
- Ensure `pointerEvents: 'auto'` is properly set on the inner content of the Settings Widget.
- Finalize the native right-click suppression hook.