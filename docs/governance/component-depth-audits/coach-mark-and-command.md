# CoachMark + Command — Opportunity audit (2026-05-11)

> Both components are DS-published with **zero workspace adoption** (`apps/pce/{admin,student}` and `apps/exam-management/admin` import 0 of `CoachMark` / `useCoachMark` / `CommandDialog` / `cmdk`).
>
> **Headline:** the answer is asymmetric. CoachMark is explicitly anti-patterned by both products and should stay un-adopted. Command (⌘K) has a hand-rolled precedent in the assessment-taker app and direct Vishaka backing — it should be promoted to a workspace-level palette.

---

## CoachMark

### Library reality
- Exports: `CoachMark`, `useCoachMark` (from `exxat-ds/packages/ui/src/index.ts`)
- Source: `exxat-ds/packages/ui/src/components/ui/coach-mark.tsx` (361 lines) + `exxat-ds/packages/ui/src/hooks/use-coach-mark.ts` (342 lines)
- Library demo: `http://localhost:4000/library/coach-mark`
- API surface:
  - Sizes `sm` (260) / `default` (320) / `lg` (400)
  - `useCoachMark({ flowId, steps[], delay?, enabled?, dependsOnDismissedFlowId?, force? })`: single-step or multi-step flow with prev/next/skip
  - Per-step CSS-selector `target`, side/align — Radix virtual anchor, auto scroll-into-view
  - SVG-mask spotlight overlay (line 102) with brand-deep ring + semi-transparent cutout
  - localStorage persistence under `exxat-coach-mark:<flowId>` (hook lines 16, 94-119)
  - Cross-flow choreography via `dependsOnDismissedFlowId` + `COACH_MARK_FLOW_COMPLETED_EVENT` window event
  - WCAG 2.1 AA: focus-steal prevented, Escape → skip, `aria-labelledby` / `aria-describedby` wired, `aria-live` step indicator, high-contrast (`hc:`) variants

### Existing onboarding patterns
**None.** Greps returned zero hits for `onboarding`, `first-time`, `welcome`, `introTour`, `tour`, `walkthrough`, `coachmark`, `hasSeenTour`, `hasOnboarded`. localStorage is only used for non-onboarding stores (assessment-draft, student-accommodation, communication-policy, faculty-session).

### Principles signal — CoachMark is anti-patterned
Both products list welcome tours as an anti-pattern:
- `apps/pce/docs/storytelling/experience-principles.md:113` — `| Welcome tour overlays | onboarding/RUBRIC.md |`
- `apps/exam-management/docs/storytelling/experience-principles.md:122` — same row

The cited rubric (`onboarding/RUBRIC.md`) doesn't exist yet, but the anti-pattern is in two canonical principles files. Principles call for on-demand contextual help (Tip / Banner / AskLeo) over scripted tours; new-coordinator setup is once-a-semester and handled out-of-product (training, docs, CS).

One narrow seam exists at PCE experience-principles:88 — `onboarding/lms-toggle-first-run.md` (school-admin LMS-toggle first-run, workspace ADR-002). That's a single decision moment, better served by `Banner` + `Sheet` than a CoachMark flow.

### Adoption candidates — re-evaluated
Each candidate the prompt suggested collides with the documented anti-pattern:

| Suggested | Page | Verdict |
|---|---|---|
| 11 entity tiles tour | `apps/pce/admin/app/(app)/admin/page.tsx` | **Skip.** Each tile already carries a `description` field (lines 27-72) that explains it. Overlaying 5 steps on self-describing tiles is the redundant-explanation anti-pattern. If 11 tiles read as overwhelming, the fix is IA grouping, not a tour. |
| Accommodations setup | `apps/pce/admin/app/(app)/admin/accommodations/page.tsx` | **Skip.** One-time-per-program (Vishaka exam-mgmt:64); empty state is the right channel. |
| AI gap analysis | `apps/exam-management/admin/components/ai-generate-modal.tsx` | **Maybe — single-step only.** Aarti's Phase-1 differentiator. A *single* CoachMark on the "AI generate" tile at `assessment-builder-client.tsx:540` is defensible as a feature-discovery hint. Don't make it a flow. |
| Course Overview drill-down | `apps/exam-management/admin/app/(app)/courses/[id]/course-detail-client.tsx` | **Skip.** Tabs are self-disclosing. |
| Analytics page | `apps/pce/admin/app/(app)/analytics/page.tsx` | **Skip.** Charts annotate themselves (memory `feedback_viz_first.md`). |

### Adoption plan — CoachMark
| Candidate | Page | Effort | Priority |
|---|---|---|---|
| Single-shot CoachMark on "AI generate" affordance | `assessment-builder-client.tsx` (anchor `data-coach="ai-generate-tile"` near line 540) | ~2h (1 step, localStorage key `ai-generate-first-discovery`) | **P3 — optional.** Only if Aarti or pilot faculty ask "how do I find AI generate?" |
| Everything else | n/a | n/a | **Do not build.** Anti-pattern. |

**Recommendation:** Leave CoachMark un-adopted. Technically excellent component (focus trap, spotlight, cross-flow deps, HC variants) but products have rejected tour-shaped onboarding.

---

## Command (⌘K palette)

### Library reality
- Exports: `Command`, `CommandDialog`, `CommandInput` (`default` pill / `palette` flat header), `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`
- Source: `exxat-ds/packages/ui/src/components/ui/command.tsx` (232 lines), built on `cmdk` + Radix Dialog
- Library demo: `http://localhost:4000/library/command`
- API surface:
  - `CommandDialog` mounts fixed-top (`top-[max(1rem,8vh)]`), 42rem→4xl responsive width, transparent overlay (no scrim — non-blocking visual)
  - `CommandInput variant="palette"` — flat header for `CommandDialog`; `variant="default"` — pill `InputGroup` for embedded usage
  - `CommandList` — `max-h-72`, no-scrollbar
  - `CommandGroup` — labeled section, `cmdk-group-heading` uppercase muted-foreground styling
  - `CommandItem` — production-hardened: explicit `data-selected="true"` matching, HC + forced-colors handling (lines 188-201)
  - `sr-only` Title/Description for AT readers; cmdk owns ↑/↓/Enter; ⌘K is consumer's responsibility

### Existing global-search affordances
**Two precedents — both in the student-facing assessment-taker, not admin.**

- `apps/exam-management/assessment-taker/src/components/CommandPalette.tsx` (274 lines) — hand-rolled ⌘K using DS `Dialog` + raw `<input>` + manual ↑/↓/Enter. **Does NOT use DS `Command`.** Features: typed PaletteItem (assessment/resource/competency/course/page), keyword fuzzy match, Ask-Leo mode triggered by `?` or `ask ` prefix, `Kbd`-chip footer. This is the reference shape — but should be rebuilt on `CommandDialog` to inherit a11y + HC + cmdk keyboard for free.
- `apps/exam-management/assessment-taker/src/components/NavShell.tsx:29,46-60,74` — wiring: global `(metaKey || ctrlKey) && key === 'k'` listener + sidebar "Search or ask Leo · ⌘K" button. The pattern (sidebar entry + global keyboard) is the right shape.

### Principles signal — Command is on-pattern
Vishaka's exam-mgmt perspective anchors search behavior:
- `apps/exam-management/docs/storytelling/vishaka-perspective.md:66` — `Faculty search by course number first ("301 tox" → toxicology) | Course code is primary search key`
- `apps/exam-management/docs/storytelling/vishaka-perspective.md:87` — `Course code on cards | Faculty search by code first (Prism convention)`

Faculty navigate by typing, not clicking. ⌘K matches this 1:1 — open, type `301 tox`, Enter.

PCE Vishaka perspective is still scaffolded (no direct PCE-specific search ask), but PCE has 50+ navigable surfaces today (11 admin entities + `MOCK_SURVEYS` + `MOCK_TEMPLATES` + `/analytics`, `/moderation`, `/programmatic-surveys`, `/surveys`, `/templates`, `/my-surveys`).

### High-impact adoption candidates

#### Candidate 1: PCE admin global jump (P1)
- **Mount:** `apps/pce/admin/app/(app)/layout.tsx` (alongside `<TooltipProvider>`)
- **Keyboard:** `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'` — copy NavShell.tsx:46-58
- **Sidebar entry:** `SidebarMenuButton` near top of `apps/pce/admin/components/app-sidebar.tsx`, tooltip `Search · ⌘K`
- **Item sources:** `MOCK_SURVEYS` and `MOCK_TEMPLATES` from `apps/pce/admin/lib/pce-mock-data.ts:129`; the 11 entities from `apps/pce/admin/app/(app)/admin/page.tsx:23-72` `ENTITIES` (already typed `EntityTile[]` with `title`/`description`/`href`/`icon`); static items for `/analytics`, `/moderation`, `/my-surveys`
- **Groupings:** Surveys / Admin entities / Templates / Pages
- **Effort:** ~6-8h
- **Why:** PCE admin IA is broad and shallow. Sidebar click is 3-4 clicks per switch; ⌘K + 3-5 chars + Enter is one motion.

#### Candidate 2: Exam-mgmt admin global jump (P1)
- **Mount:** `apps/exam-management/admin/app/(app)/layout.tsx`
- **Sidebar entry:** `apps/exam-management/admin/components/app-sidebar.tsx` near line 153 (brand row)
- **Item sources:** courses from `courses-client.tsx` (subtitle = course code — Vishaka's primary key); QB folders from `qb-state.tsx`; assessments from `assessment-draft-store.tsx`; faculty/students top-N; static items for Accommodations / Competency / Analytics / Settings
- **Groupings:** Courses / Question bank / Assessments / Faculty / Students / Pages
- **Effort:** ~8-10h
- **Why:** literal Vishaka pattern — `301 tox` → Enter. Today there is no global search.

#### Candidate 3: Rebase assessment-taker palette on DS Command (P2)
- **Target:** `apps/exam-management/assessment-taker/src/components/CommandPalette.tsx` (already wired via NavShell)
- **Migration:** swap hand-rolled list (lines 156-189) and key handling (96-116) for `<CommandDialog><CommandInput variant="palette"/><CommandList><CommandGroup><CommandItem/></CommandGroup></CommandList></CommandDialog>`. Keep Ask-Leo body (lines 218-273) and footer hint row.
- **Effort:** ~3-4h. Drops ~60 LoC, inherits cmdk keyboard + HC handling.
- **Why:** validates DS Command against the most demanding existing use case (mode-switching, type-prefix routing) before the admin builds — and gives all three palettes one keyboard/a11y posture.

#### Candidate 4: Embedded `CommandInput variant="default"` in QB pickers (P3)
- **Target:** `apps/exam-management/admin/components/qb/*` dialogs that today filter known lists with raw `<Input>` + custom logic
- **Effort:** ~2h per surface
- **Why:** the `default` variant is purpose-built for inline filter-a-known-list inputs; keeps one keyboard/selection model across the app.

### Adoption plan — Command
| Candidate | Mount | Effort | Priority |
|---|---|---|---|
| 1. PCE admin global ⌘K | `apps/pce/admin/app/(app)/layout.tsx` + sidebar | 6-8h | **P1** |
| 2. Exam-mgmt admin global ⌘K | `apps/exam-management/admin/app/(app)/layout.tsx` + sidebar | 8-10h | **P1** |
| 3. Re-base assessment-taker palette on DS Command | `apps/exam-management/assessment-taker/src/components/CommandPalette.tsx` | 3-4h | **P2** |
| 4. Embedded `CommandInput` in QB pickers | `apps/exam-management/admin/components/qb/*` | 2h × N | **P3** |

---

## What this audit can't see

- Whether Aarti has appetite for ⌘K. Her recorded directives center on workflows, not navigation chrome — Vishaka's signal is the strongest backing. PCE-specific Vishaka conversation still pending.
- Whether ⌘K conflicts with any browser/OS shortcut users actually hit. Convention is broad (Slack/Linear/Notion/GitHub); no documented friction in the workspace.
- Whether faculty keyboard-navigate at all. "Search by code first" implies typing, but the medium (palette vs. nav-bar search input vs. URL bar) hasn't been validated. A nav-bar search field might serve the same JTBD with lower discoverability cost.
- Whether the rubric at `onboarding/RUBRIC.md` (cited by both anti-pattern tables, doesn't exist) would soften the welcome-tour stance.

---

## Recommended next 3 actions

1. **Rebase assessment-taker palette on DS Command** (Candidate 3) first. Validates DS Command against the most demanding existing use case (Ask-Leo, type-prefix routing) and produces the reference for the admin palettes.
2. **Build the PCE admin ⌘K palette** (Candidate 1). Smallest surface, mock data already shaped (`ENTITIES` at `apps/pce/admin/app/(app)/admin/page.tsx:23`, `MOCK_SURVEYS` / `MOCK_TEMPLATES` at `apps/pce/admin/lib/pce-mock-data.ts:129`), principles support it. Then mirror into exam-mgmt admin (Candidate 2).
3. **Leave CoachMark un-adopted.** Don't chase the 5 onboarding candidates — both products' principles anti-pattern welcome tours. If single-affordance discovery is needed (e.g., AI generate), use `Tip` or `Banner`. Reserve CoachMark for the still-hypothetical school-admin LMS-toggle first-run (workspace ADR-002), and only after the rubric at `onboarding/RUBRIC.md` is written.
