---
title: "V2: Python WebSocket Controller & Stagehand Sync"
status: "backlog"
priority: "high"
created_at: "2026-04-20"
---

# Objective
Create the standalone Python AI backend that communicates with the Electron app via WebSockets, taking advantage of the exposed `9222` debugging port to manipulate active `<webview>` tabs using Playwright/Stagehand.

# Implementation Details
- Build a Python WebSocket client/server that connects to the `main.ts` Node process.
- Map the "Ghost Mouse" capabilities: Listen for natural language intents and use Stagehand to execute physical clicks, typing, and interactions on specific `webview` instances.
- Enable smooth handoff (The "Emergency Brake"): Detect local mouse movement to instantly pause the Python Playwright agent and return control to the user.
