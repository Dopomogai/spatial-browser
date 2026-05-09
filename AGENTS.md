# AGENTS.md — CanvasOS spatial-browser

The entry point for any AI agent landing on this repo. Read this end-to-end before doing anything.

## What this repo is

CanvasOS spatial-browser is a desktop application that turns the screen into an infinite 2D canvas where browser tabs and widgets coexist as draggable, resizable nodes — a spatial alternative to the conventional tabbed browser.

Current phase: **alpha**. The app currently fails to launch from the latest development phase (regression from a recent push); browser-widget features previously worked. Onboarding budai is happening before further feature work so future fixes route through a multi-agent workflow.

This repo is the first consumer of [budai](https://github.com/Dopomogai/budai), the multi-agent operating system pinned in `.agents/manifest.yaml`.

## Where things live

```
spatial-browser/
├── src/
│   ├── main/                # Electron main process
│   ├── preload/             # preload bridge (typed IPC)
│   └── renderer/src/
│       ├── components/      # React components (PascalCase)
│       │   └── shapes/      # canvas widget node types
│       ├── store/           # Zustand stores (useCanvasStore.ts is the domain model)
│       └── App.tsx          # renderer entry
├── backend/agent/           # FastAPI stub for agent dispatch
├── docs/                    # human-facing design docs
├── tasks/{backlog,todo,in-progress,done}/  # task files (folder == status — local exception)
├── .agents/                 # budai operating system
│   ├── manifest.yaml        # pinned budai version + included roles/skills/workflows
│   ├── base/                # registry-pulled (read-only)
│   ├── local/               # CanvasOS-specific overrides + extensions
│   └── index/               # generated source-file index (gitignored runtime data)
└── electron.vite.config.ts  # build config
```

## The two-minute system tour

A user wants a new browser tab on the canvas. They drag-create a node; the node is registered in the canvas store (`useCanvasStore.ts`); the BrowserWidget React component renders an Electron webview inside the xyflow node frame; the user can navigate, resize, and reposition. Every meaningful state change debounces into Supabase so the canvas survives restarts. Panels (toolbars, sidebars) float above the canvas and are not nodes themselves. The xyflow library is the canvas substrate (the project migrated from tldraw early on; ignore stale tldraw references). The single Zustand store coordinates across features — splitting it is a known untouchable.

## Conventions

See [`.agents/local/conventions.md`](.agents/local/conventions.md) for repo-specific conventions and [`.agents/base/conventions.md`](.agents/base/conventions.md) for the language-agnostic baseline.

Key points:

- React components are PascalCase; everything else kebab-case.
- Zustand for shared state — no new React contexts.
- IPC channels declared in `src/preload/index.d.ts` first, both sides implement.
- xyflow is canonical for canvas; treat tldraw mentions as legacy.
- Tasks layout is the four-folder legacy variant (`backlog/todo/in-progress/done`), not budai's default.

## Tasks workflow

Tasks live under `tasks/<status-folder>/`. Status is the folder, not frontmatter — a CanvasOS-specific exception per `local/conventions.md`.

To pick up a task: `git mv tasks/todo/<id>.md tasks/in-progress/`.
To complete: `git mv tasks/in-progress/<id>.md tasks/done/`.

Workflow types per `.agents/base/workflows/`: `feature`, `bug`, `refactor`, `audit`. New budai-managed tasks should include the standard budai frontmatter so the Librarian can build bundles from them.

## Pre-flight before declaring done

```bash
bin/preflight        # repo-state validation (when wired up)
npm run test         # vitest — note: not currently green
npm run typecheck    # tsc
bin/postflight       # output validation
```

Until `bin/preflight` and `bin/postflight` exist locally, fall back to running `npm run test && npm run typecheck` manually. The budai CLI scripts live in `/Users/andrewsolovei/Documents/GitHub/budai/bin/`; symlink or copy as Phase 1 progresses.

## Untouchables

Things that look weird but must NOT change without discussion. See [`.agents/local/untouchables.md`](.agents/local/untouchables.md). Top entries:

- The app is broken on start right now — don't paper over.
- `useCanvasStore.ts` is the single domain model — don't split casually.
- Supabase sync debouncing — don't lower the intervals to "feel snappier."
- tldraw is legacy — don't reintroduce.
- `.env` is intentionally untracked.

## Glossary

Domain terms (canvas, node, widget, browser widget, tab, panel, shape, viewport, supabase sync, spatial browser, xyflow). See [`.agents/local/glossary.md`](.agents/local/glossary.md).

## Index

When the Librarian regenerates the source index, it lands at:
- [`.agents/index/detailed.md`](.agents/index/detailed.md) — file-by-file purpose, role, exports, gotchas.
- [`.agents/index/tree.md`](.agents/index/tree.md) — flat tree.

Both are gitignored runtime data; regenerate via `bin/librarian index`.

## Working with budai

This repo runs on [budai](https://github.com/Dopomogai/budai) — a five-role multi-agent operating system (Planner, Implementer, Verifier, Judge, Librarian) with versioned skills and workflows.

Key concepts:
- **Roles** in `.agents/base/roles/` — five role definitions plus their permissions and escalation rules.
- **Skills** in `.agents/base/skills/` — eight reusable procedures (build-task-bundle, peer-review, audit-docs, run-preflight, capture-evidence, discover-standards, regenerate-index, promote-lesson).
- **Workflows** in `.agents/base/workflows/` — multi-role orchestration (ship-feature, fix-bug, refactor, audit-repo).
- **Bundle** — context file built per-task by the Librarian; the bundle is what an agent reads, not the whole repo.
- **Council** — a multi-attempt fan-out record with anonymized peer review and a judge verdict.

If you're an agent reading this for the first time: read this file end-to-end, then `.agents/local/conventions.md` and `local/untouchables.md`, then your assigned task and its bundle. The bundle gives you 95% of what you need.

For framework background, start with [budai/docs/00-overview.md](https://github.com/Dopomogai/budai/blob/main/docs/00-overview.md) and [docs/08-the-journey.md](https://github.com/Dopomogai/budai/blob/main/docs/08-the-journey.md) (the task lifecycle).
