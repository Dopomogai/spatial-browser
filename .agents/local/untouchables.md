# Untouchables

CanvasOS-specific things that look weird but must NOT be changed without explicit human approval.

## App is currently broken on start

What it is and where: as of 2026-05-09, `npm run dev` fails to launch the app from the most recent development phase. The browser-widget functionality previously worked.

Why it's there: the breakage came in during an in-progress feature push and hasn't been root-caused.

What you should NOT do: assume the app runs end-to-end and "verify" features by inspecting only static code. Don't paper over the start error with a try/catch swallow.

What you should do instead: when a task touches startup, treat fixing the boot path as part of the task or as a blocking pre-requisite. The fix likely lives in the renderer entry path or in store hydration.

## `useCanvasStore.ts` is the domain model

What it is and where: `src/renderer/src/store/useCanvasStore.ts`, ~800+ lines. The single Zustand store that holds nodes, edges, viewport, panels, browser-widget state, supabase sync state.

Why it's there: a deliberate "one big store" choice over many small stores; cross-feature coordination (e.g., spawning a tab while the canvas is panning) is easier with shared state.

What you should NOT do: split it into many small stores casually. Don't add a parallel store for a new feature without checking whether existing slices already cover it.

What you should do instead: extend with new actions/selectors. If the file exceeds ~1500 lines, propose a split as its own refactor task with a plan.

## Supabase sync debouncing

What it is and where: there are debounce/throttle windows between local state changes and Supabase writes. The exact constants live in the store actions.

Why it's there: previous versions wrote on every state tick and flooded Supabase, blowing through quotas and creating race conditions during rapid edits.

What you should NOT do: lower or remove the debounce intervals to "make it feel snappier."

What you should do instead: if behavior feels laggy, audit the sync triggers (which actions write?) before changing the interval.

## tldraw legacy references

What it is and where: any code/docs/comments mentioning `tldraw`. The project started on tldraw before migrating to `@xyflow/react`.

Why it's there: incomplete cleanup during the migration.

What you should NOT do: silently re-introduce tldraw imports or "fix" stale docs by quoting tldraw APIs.

What you should do instead: update stale references to xyflow when you encounter them; flag if a piece of code looks like it's still relying on tldraw runtime.

## .env file (untracked)

What it is and where: `.env` at the repo root, holding `VITE_SUPABASE_ANON_KEY` and similar.

Why it's there: was tracked in git for a while; pre-budai cleanup (commit `1d9e8af`) untracked it and added to `.gitignore`.

What you should NOT do: re-add to git tracking. Don't log its contents.

What you should do instead: contributors copy `.env.example` (when one exists) and fill from a shared secret store. If the file is missing, the app will fail at runtime — that's expected.
