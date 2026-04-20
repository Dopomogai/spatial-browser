---
title: "Fix Tab Reopening Error (WebGL Context Failure)"
status: "in-progress"
priority: "high"
created_at: "2026-04-20"
---

# Issue
When reopening a minimized tab, the application throws:
`[ERROR:gles2_command_buffer_stub.cc(298)] ContextResult::kFatalFailure: Failed to create context.`
`Error occurred in handler for 'GUEST_VIEW_MANAGER_CALL': Error:  (-3) loading 'url'`

# Cause
Because `<webview>` is a multi-process Chromium component, rapidly toggling React components (from `display: none` or remounting them entirely) destroys the underlying GPU buffer and guest view manager context. When React remounts the `<webview>` component with the active `src`, Electron fails to reconnect the pre-existing Chromium guest process to the new DOM node.

# Possible Solution
Instead of unmounting/remounting the actual `<webview>` element when a widget switches to `minimized` or `sleeping` state, we must keep the `<webview>` mounted in the DOM at all times, but control its visibility via CSS opacity or `z-index`. This preserves the native Chromium renderer context and prevents the `ContextResult::kFatalFailure`.