---
title: "Security & IPC Hardening"
status: "backlog"
priority: "high"
created_at: "2026-04-20"
---

# Objective
Prepare strict context isolation bounds for Electron and enforce `webSecurity` standards before generating the release build.

# Implementation Details
- Audit the IPC bridge in `preload`.
- Evaluate `src/main/index.ts` to ensure `webSecurity` is securely re-enabled.
- Ensure external sites loaded in `<webview>` tags are strictly compartmentalized and don't receive leakage from main process Node.js contexts.
