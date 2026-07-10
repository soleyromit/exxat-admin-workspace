# PCE Surface Design Process (standing pipeline — do not re-instruct)

This is the default, repeatable process for **any** PCE course-evaluation surface
(page, hub, dashboard, wizard, sheet, settings section). Romit should not need to
restate these steps — running this pipeline is the baseline expectation whenever
the task is to design/build/redesign a PCE surface.

> Authority chain: frozen **requirements** (Granola + PRD) are product's; the
> **design solution** is Romit's, Mobbin-driven. The **live deployed app IA**
> (`pce-three.vercel.app`) is the design base, not the local `dev` nav.
> See [[feedback_pce_design_workflow]], [[project_pce_team_monil_pm]].

## The pipeline

| # | Step | Tool / artifact | Gate |
|---|------|-----------------|------|
| 0 | **Self-brief** | `MEMORY.md` + `docs/governance/verification-discipline.md`; confirm the **live IA** is the base | state known failures up front |
| 0.5 | **Audit what exists** | `grep` components for the domain nouns; read sibling pages (`/analytics`, the wizards) + `docs/specs/` prior briefs; map build-vs-exists → **reuse / extend / reconcile, never duplicate** | a NEW route is the last resort |
| 1 | **Granola** | `get_meeting_transcript` (raw, never summaries) for the feature | decisions = frozen input |
| 2 | **Mobbin** | `search_flows` / `search_screens` per **job type** (not domain); cite every `mobbin_url` | min 3 analogies |
| 3 | **Design Contract** | `exxat-design-contract` skill → §0 Spec Parse · §1 Mobbin · §2 UX analogy · §3 DS components (verified via `node tools/ds/source.mjs`) · §4 states · §5 WCAG · §6 banned · Scope boundary | no JSX until contract written |
| 4 | **Spec / plan** | append a per-surface section to `docs/specs/<date>-<module>.md`: requirement → analogy → spec → DS map → states → plan | documented before build |
| 5 | **Build** | DS components only · `var(--token)` · `'use client'` · FA `aria-hidden` · amber not red (Aarti) | hooks block on violations |
| 6 | **Review gate** | spawn `ds-conformance-reviewer` + `state-review` + `verification-reviewer`; paste **literal** verdicts; fix every actionable finding | NEEDS-MORE blocks "done" |
| 7 | **Visual pass** | capture every rendered state (default/loading/empty/error/dialog) with a Playwright capture under `tools/visual-check/`; fix what renders wrong | runtime confirmation |
| 8 | **Verdict** | two-tier GREENLIGHT (static / runtime) + evidence block (tsc delta, route HTTP, DS import file:line, grep, screenshots) | honest "not verified" list |

## Outputs every surface produces
1. Mobbin analogy list (cited URLs)
2. Design Contract block (in chat / PR)
3. Per-surface spec section in `docs/specs/`
4. Reviewer verdicts (literal)
5. Visual-pass screenshots (`/tmp/visual-check/<surface>/`)
6. Two-tier verdict + evidence block

## Notes
- Build **on** the live IA; never re-architect nav without it being the design (live IA or an approved brief). See [[feedback_no_unauthorized_consolidation]].
- Separate **frozen** (data points, personas, build order, naming) from **design** (layout, hierarchy, density, interaction).
- Subagent reviewers can misread a diff base — verify their cross-file claims before acting (Pattern G).
- Implementation may run on Sonnet against a pinned contract; judgment/design on Opus. See [[feedback_design_on_opus_implement_on_sonnet]].
