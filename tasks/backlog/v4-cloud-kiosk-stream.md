---
title: "V4: Enterprise Cloud Kiosk Stream"
status: "backlog"
priority: "low"
iteration: "v4"
created_at: "2026-04-20"
---

# Objective
Move the Spatial OS from a local Mac app to a cloud-hosted Ubuntu droplet, streamed losslessly to users via their browser. This is the B2B pivot.

# Implementation Details
- Deploy the Electron app headlessly on a dedicated Linux droplet.
- Use Guacamole or KasmVNC to stream the desktop to users via Chrome/Safari.
- Always-on AI: Because the OS runs on a server, the AI agent can work 24/7 even when the user closes their laptop.

# Example
User says: "Watch this stock dashboard tab all night, and if it hits $100, buy it." The AI keeps working on the cloud droplet.
