---
title: "V2: Local Vector Embedding Engine (Photographic Memory)"
status: "backlog"
priority: "high"
created_at: "2026-04-20"
---

# Objective
Build a lightweight, private Vector Database inside the Desktop app to facilitate the "Cmd+Brain" Semantic Recall feature.

# Implementation Details
- Integrate a local SQLite-vec database and ONNX runtime to inference a lightweight model (e.g., `MiniLM`) locally on macOS.
- Hook into the DOM Extraction pipeline: Generate embeddings for ripped webpage content and store them alongside the X/Y canvas coordinates and screenshot URLs.
- Build the "Cmd+K" query system: Use Cosine Similarity to find matches and dispatch events to pan the TLDraw camera directly to the relevant sleeping widget.
