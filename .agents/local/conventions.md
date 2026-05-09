# Conventions (local)

CanvasOS-specific conventions. Merged with `.agents/base/conventions.md`; local wins on conflict.

## Stack snapshot

- **Renderer**: Electron + Vite + React + TypeScript. Canvas substrate is `@xyflow/react` (the project migrated from `tldraw` early on — treat any `tldraw` references in older docs/comments as legacy).
- **Backend**: FastAPI stub at `backend/agent/server.py`. Sync via Supabase.
- **Build**: `electron-vite` (config in `electron.vite.config.ts`).

## File naming

- React components — `PascalCase.tsx` (e.g., `BrowserWidgetNode.tsx`).
- Hooks — `useThing.ts`.
- Stores — `useThingStore.ts` (Zustand).
- Tests — colocated, `useThing.test.ts`.
- Everything else — `kebab-case` per base.

## Component structure (React)

- One component per file; default export at the bottom.
- Props interface above the component.
- Hooks at the top of the function body.
- JSX at the bottom.

## State management

- **Zustand** for shared state. The canvas state lives in `useCanvasStore.ts` — this is a large file and the de-facto domain model. Treat it as a hot zone: changes here cascade.
- Local component state for component-internal concerns (form fields, hover states, etc.). No new React contexts.

## Canvas / xyflow

- Nodes register through `nodeTypes` map; new node types must be defined there.
- Coordinates are canvas-space, not screen-space — be explicit when converting.
- Don't mutate node arrays directly; always go through store actions.

## IPC (Electron)

- Channels are typed; declare in `src/preload/index.d.ts` first, then implement on both sides.
- No direct `ipcRenderer` access in the renderer — go through the preload bridge.

## Tasks layout (exception)

CanvasOS predates budai. Existing tasks live in:
- `tasks/backlog/` — long-tail ideas (v2/v3/v4/v5 tagged).
- `tasks/todo/` — ready to pick up.
- `tasks/in-progress/` — actively being worked.
- `tasks/done/` — completed.

This differs from budai's default `tasks/{open,archive}/` with status in frontmatter. Keep the four-folder layout for now; the `bin/task` CLI must respect it (or migration happens later as its own task). When in doubt: a task's folder IS its status.

For new budai-managed tasks, still use the four folders, but include the standard budai frontmatter (`id`, `title`, `type`, `scope`, `status`, etc.) so bundle-building works.

## Testing

- Vitest, configured via electron-vite. Test runner not currently green — see `local/untouchables.md` for the broken-on-start status.
- New code aims for tests; legacy code is grandfathered until touched.

## Logging

- Renderer: prefer structured logs through a single helper rather than scattered `console.log`. (No central logger exists yet — flag if you add one.)

## Sensitive data

- Supabase keys live in `.env` (now untracked). Never commit, never log.
- The `VITE_SUPABASE_ANON_KEY` is the public anon key — not catastrophic if leaked but still rotate after exposure.

- pattern: `eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}`  # JWT shape
- pattern: `sb_[A-Za-z0-9]{20,}`  # Supabase service-role key shape
