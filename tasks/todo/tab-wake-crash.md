---
title: "Tab Reactivation Crash (Context kFatalFailure)"
status: "todo"
priority: "high"
created_at: "2026-04-20"
---

# Issue
When waking a deeply slept or minimized widget, the native Chromium sandbox throws multiple terminal errors and occasionally fails:
```
[96905:0420/110117.572996:ERROR:gles2_command_buffer_stub.cc(298)] ContextResult::kFatalFailure: Failed to create context.
Error occurred in handler for 'GUEST_VIEW_MANAGER_CALL': Error:  (-3) loading 'https://www.gomidl.com/'
```
# Suspected Cause
This is a WebGL context restoration failure when `<webview>` elements are re-injected into the DOM rapidly or moved while hidden by React's virtual DOM diffing algorithm.

# Need to investigate
How React remounts the `webviewRef`. Instead of destroying the component node entirely during minimization, we may need to `display: none` or throttle `loadURL()`.