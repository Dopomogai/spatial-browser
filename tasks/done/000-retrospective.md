# Retrospective: task 000 — first manual end-to-end budai journey

**Date:** 2026-05-09
**Task:** Fix broken-on-start regression
**Outcome:** ✅ passed (commit `0ac3dc3` on main)
**Roles run:** Librarian → Planner → Implementer → Verifier → Judge (5/5)
**Duration:** ~2 hours wall-clock (lots of human review between steps)

This was budai's first manual single-role validation against a real task in a real consumer repo. Goal wasn't a heroic fix — it was to learn which parts of the spec hold up under contact and which need iteration before automated runs become viable.

## What worked

- **The five-role spec held together.** No role escalated, no AC was unreachable, no role's spec contradicted another's. A single-attempt journey through Librarian → Planner → Implementer → Verifier → Judge produced a real commit and four real follow-up tasks. The plumbing exists.
- **The bundle format paid off.** The Librarian's bundle (21k tokens, 7 source files + 3 related closed tasks + conventions + glossary + untouchables) gave the Planner everything it needed without re-reading the repo from scratch. The Planner's tool calls were 12 vs. the Librarian's 27 — bundle is doing real work.
- **The Planner's "delete don't rename" call.** The Planner saw both the `flushSyncQueue → flushSpatialEvents` mismatch AND the duplicate-flusher problem and chose to delete App.tsx's flusher entirely, killing two bugs with the same diff. That's the kind of decision a vague plan would have lost; the seven-section format forced the explicit "Approach" reasoning.
- **AC5 (no out-of-scope files) actually constrained the Implementer.** The Implementer's diff was exactly the three files the plan named, despite encountering tempting drive-by fixes (`saveProfileAs`, `setTopTabBarVisible`, `toggle-maximize`). It punted them via a Claude-native chip mechanism — wrong routing (F016) but right discipline.
- **Tighter prompt for Step 2 worked.** Librarian needed ~70 lines of manual scaffolding; Planner needed ~25; Implementer/Verifier/Judge similar. The fetched system prompt (~335 lines from `compose_system_prompt`) does the heavy lifting. Validates the F007 thesis: skill specs that embed standard heuristics let prompts stay short.
- **Human gates caught real things.** The bundle review surfaced two latent bugs (`saveProfileAs`, `setTopTabBarVisible`) that became follow-up tasks. The smoke-test review surfaced two pre-existing UI regressions (topbar, minimap) the original crash had been masking. These wouldn't have been visible in an automated run that just checked the AC.

## What didn't work (and is now in budai's promoted-tasks queue)

- **Manual glue was constant.** ~6 frontmatter flips, ~2 worktree creations, ~1 patch generation, ~3 task moves between folders. All mechanical. All human-typed. F015 (P0).
- **Per-task prompt scaffolding** for the Librarian was real (~25 lines of "App.tsx is files-to-touch with priority 100…"). The Planner showed this is fixable by tightening the skill spec; F007 is now task-008.
- **`bin/agent dispatch_claude_code` is a placeholder.** Every role spawn went through Claude Code's host Agent tool because budai's runner doesn't actually invoke `claude`. F008 is now task-009.
- **`chars/4` token math is slop.** Librarian estimated 21,350; tiktoken would give a different number. Doesn't bite at 21k/84k but will at 80k/84k. F001 is now task-007.
- **Worktrees don't seed `.env`.** Smoke test showed misleading `MISSING_KEY` 401s in the implementer worktree because gitignored config didn't propagate. F017 (P1).
- **Out-of-scope agent observations route to Claude UI chips, not budai's findings.** Self-evolvement gets bypassed by the host harness. F016 is in the queue.
- **Tester role/skill doesn't exist.** Implementer ran tests, Verifier re-ran them, but neither was positioned to *write missing tests*. F018 (P1).
- **`bin/task` doesn't support the four-folder layout.** Hand-created every task file. F009 is now task-004.
- **Cross-repo `librarian sync` is a placeholder.** Manual `cp -R base/` would hurt at 3+ consumers. F012 (P0 once we have ≥2).
- **`audit-docs` only runs in sweeper mode.** No first-class "audit-docs" task type. F011 (P1).
- **Header-update convention is implicit.** The Planner correctly inferred that `@gotchas` had to be trimmed alongside code changes, but no role spec tells agents this. F014 (P2).

## Validations (things this run confirmed empirically)

1. **Index-only relevance scoring is sufficient** for picking files. Reading source files is needed only to embed content into the bundle body — that's mechanical and should be deterministic (F005 → task-008).
2. **Tighter prompts produce equal-or-better outputs** when the spec is good. The Planner step (~99s, 12 tool calls) outperformed the Librarian step (~564s, 27 tool calls) in throughput per scaffolding-line.
3. **Single human at all gates is sustainable for one task.** It would be exhausting at three concurrent tasks. Auto-approve criteria (`trivial: true ∧ fan-out: 1 ∧ no-new-ADR`) would handle ~half of the gates we hit, in retrospect.
4. **Failures from missing infrastructure don't break the journey** — they just force human glue. Knowing what's glue is the point of running this.

## Findings → tasks mapping

The findings inbox had 19 entries by end-of-journey. Status (per the parallel budai-onboarding work):

| Tier | Findings | Tasks (in budai/tasks/todo/) |
|---|---|---|
| Tier 1 (this-run quick-wins) | budget bump 80→84k, bundle filename | applied directly in CanvasOS manifest + bundle rename; ALSO promoted to budai task-007 for skill-spec encoding |
| Tier 2 (budai changes) | F001-F010, F014-F018 | promoted to budai task-004 through task-009 (and others) — running through budai's own five-role journey next |
| CanvasOS-side | F019 (topbar/minimap pre-existing bugs) | spawned as canvas-001 / canvas-002 follow-ups; canvas-003 (toggle-maximize), canvas-004 (saveProfileAs) added by Judge + human |
| Glue we hand-applied | F003 (manifest budget), F002 (bundle filename), F017 (.env seeding) | done inline this run; tasks captured the systematized fix |

## What I'd recommend before the second journey

1. **Land at least task-004 (`bin/task` four-folder support) and task-009 (real `dispatch_claude_code`)** before the next manual run. Both are P0/P1 ergonomics; without them every run wastes ~10 min on glue. Everything else can wait.
2. **Don't fan-out > 1 yet.** Anonymized peer review + judge-blind ranking adds significant complexity; we don't have signal that it's needed for the kind of task we run today. Validate it on a task where two reasonable approaches actually diverge (e.g., a refactor with multiple valid shapes).
3. **Run the second journey on budai itself** — pick one of the promoted tasks (e.g., task-007 deterministic-token-and-bundle-basics) and run it through the five roles dogfooded against budai's own repo. That's the strongest possible validation: if budai can ship its own improvements through its own workflow, the loop closes.
4. **Capture audit-docs as task 001 of CanvasOS** before fixing canvas-001/2/3/4. The current docs (`docs/`, `ARCHITECTURE.md`, `SPATIAL_BROWSER_MASTER_PLAN.md`) likely have stale references the canvas-* tasks would benefit from cleaning up. Cheap, parallelizable.

## Surprises worth remembering

- The Implementer expanded `@why` for `SpatialCanvas.tsx` to mention RemoteAgentWidget/GoogleSheetWidget/etc. — but on inspection, that expansion was already in main from the original header-writing pass. False alarm; flagged because it could have been scope creep.
- The Judge deviated from its brief when committing — used `git add <paths>` instead of the brief's suggested `git commit -am` to avoid sweeping in unrelated `manifest.yaml` changes. The deviation was correct; this is the kind of judgment call we want from the role.
- The user (parallel agent track) did F013 (budai-on-budai onboarding) AND promoted all 19 findings to actual budai `tasks/todo/` while this journey was mid-flight. So the next journey can start immediately on budai's own backlog without a separate onboarding step.
