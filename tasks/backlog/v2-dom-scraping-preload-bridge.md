---
title: "V2: DOM Scraping & Preload Bridge"
status: "backlog"
priority: "high"
created_at: "2026-04-20"
---

# Objective
Implement the internal extraction mechanism to silently pull raw text (Accessibility Tree) and structure from every webview without disrupting the user, laying the foundation for Photographic Memory.

# Implementation Details
- Expand the `preload/index.ts` script to inject a lightweight Content Script.
- Set up an IPC pipeline to extract `document.body.innerText`, structural semantic tags, and meta-data whenever a tab goes to sleep or actively changes.
- Ensure the extraction process is non-blocking to prevent UI jank.
