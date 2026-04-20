---
title: "MacOS Build Packaging"
status: "backlog"
priority: "medium"
created_at: "2026-04-20"
---

# Objective
Configure `electron-builder` to package a polished, distributable macOS `.dmg` release wrapper.

# Implementation Details
- Setup macOS app icons (`spatial-browser/resources/icon.icns`).
- Update the builder config with provisioning and appropriate `build` scripts in `package.json`.
- Test the output `.app` and `.dmg`.
