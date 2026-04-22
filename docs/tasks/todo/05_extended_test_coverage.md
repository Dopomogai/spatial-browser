# Implementation Plan: Extended Spatial Test Coverage

## Objective
Aggressively expand the automated test coverage for the React Flow V1.5 foundation to ensure zero regressions on core UX mechanics.

## Layer 2: E2E React Flow DOM Tests (Integration Expansion)

**Target:** `src/renderer/src/e2e/ui_controls.spec.ts`

**Framework:** Playwright (Electron Environment)

**Coverage Goals:**

### 1. Top Bar & Navigation Assertions
- **Action:** Launch app and locate the Top Bar minimal toggle chevron.
- **Action:** Click the toggle.
- **Assert:** The DOM structure transitions from the full tab header layout to the minimal OS header layout.
- **Action:** Click the Settings button.
- **Assert:** The `#system-widget-settings` DOM element correctly mounts and is visible on canvas.

### 2. Settings Application Integrity
- **Action:** Launch app, open Settings widget.
- **Action:** Click the Theme toggle switch (mapping to Warm/Dark mode).
- **Assert:** The root HTML `data-theme` attribute updates to the matched value.
- **Action:** Provide a click event to the "Canvas Grid" switch.
- **Assert:** The React Flow `<Background>` elements correctly mount/unmount from the underlying canvas DOM.

### 3. Context Menu Trap Verification (The Native Dismissal Bug)
- **Action:** Launch app. Open a native UI popup menu (e.g., Omnibar dropdown or Context Menu).
- **Assert:** The popup menu is visible to Playwright.
- **Action:** Dispatch a raw device-level click inside the boundaries of an active Chromium `<webview>` node on the canvas.
- **Assert:** The native UI popup menu successfully unmounts/hides, proving the global event listener trap on the Electron/React boundary correctly caught the webview interaction and dismissed the shell UI.

## Execution Requirements
Write the Playwright specs logically isolating these three test suites so that when native Mac E2E testing runs, the V1.5 UI is bulletproof.