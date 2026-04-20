# Profiles & Canvases Management
**Issue:** The user needs to create, name, and manage distinct canvases (like Miro boards containing tabs) and switch between profiles.
**Resolution:** Introduce the `spatial_workspaces` and `spatial_canvases` schemas cleanly into the app. Bind `CanvasesWidgetComponent`'s placeholder UI to Supabase API calls. Create a `New Profile` workflow within Electron to generate isolated user data paths.
