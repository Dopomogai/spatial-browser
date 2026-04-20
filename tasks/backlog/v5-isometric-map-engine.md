---
title: "V5: Gamified Isometric Map Engine"
status: "backlog"
priority: "low"
iteration: "v5"
created_at: "2026-04-20"
---

# Objective
Inject `Pixi.js` underneath the React canvas to enable a "Theme Toggle" that transforms the dot-grid background into gorgeous isometric maps (Ashram, Cyberpunk City, etc.).

# Implementation Details
- Add a Pixi.js rendering layer beneath TLDraw.
- Create a theme system with toggle in Settings: "Dot Grid" / "Ashram Map" / "Cyberpunk City."
- AI Outpainting: Users drag the canvas edge and ask the AI to generate a new "Marketing Office" building via Stable Diffusion API.
- NPC Agents: The AI becomes a physical pixel-art avatar that walks between "buildings" (widget clusters) when executing tasks.

# Depends On
- All V1–V4 infrastructure must be stable.
