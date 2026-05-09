# DESIGN.md — Exxat Workspace Design Intelligence Spec

> Canonical scholastic spec. Every agent (Claude, MagicPatterns Agent 2.0, Pencil.dev, future tools) reads this first.
> Composes: foundations, patterns, profiles, quality gates, governance.
> Per-product extensions live at `apps/<product>/DESIGN.md`.

**Version:** 0.1.0 (2026-05-08)
**Owner:** Romit Soley (Product Designer II, Exxat)
**Workspace:** /Users/romitsoley/Work/
**Lineage:** Inspired by Google's open-sourced DESIGN.md initiative (May 2026).
**Industry stack:** Scholastic (this file) + Deterministic (Romit in canvas) + Stochastic (variant generation, P4)

---

## 1. Active Context

| Slot | Default | How to override |
|---|---|---|
| Active product | resolved per session | working dir = `apps/<product>/...` |
| Active app type | resolved per session | dir = `apps/<p>/admin/` or `apps/<p>/student/` |
| Active DS profile | follows app type | `docs/foundations/ds-profiles/{admin\|student}.md` |
| Active brand | `theme-one` (Lavender) | `setBrand("prism")` via useAppTheme |
| Active language | en-US | i18n is P7 |

When app-type changes, the matching DS profile auto-loads via SessionStart / UserPromptSubmit hooks.

---

## 2. Six Layers

| Layer | Responsibility | Source files | Auto-generated? |
|---|---|---|---|
| L0 Foundations | Tokens, components, DS surface | `exxat-ds/`, `studentUX/`, `docs/foundations/ds-snapshot.json`, `docs/foundations/ds-profiles/{admin,student}.md` | snapshot: yes; profiles: hand + auto-diff |
| L1 Patterns | Composition recipes (viz, states, forms, nav, IA, onboarding, async, dashboards, admin, ai, experience) | `docs/patterns/<category>/<name>.md` | hand-written |
| L2 Product UX | Strategy, personas, workflows, content per product | `apps/<product>/DESIGN.md`, `apps/<product>/docs/` | hand-written |
| L3 Process | Research, ADRs, telemetry, decisions | `docs/research/`, `docs/decisions/`, `docs/telemetry/`, plus per-product equivalents | intake skill writes |
| L4 Quality Gates | A11y (WCAG 2.2 AA), perf, DS conformance, visual regression | `docs/quality/{a11y,perf,visual}.md`, `scripts/`, `.claude/hooks/` | hand-written rules, automated checks |
| L5 Governance | Versioning, deprecation, contribution, ds-changelog | `docs/governance/{deprecation,contribution,versioning,ds-changelog}.md` | changelog: auto; rest: hand |
| L7 Storytelling | Stakeholder perspectives, product narrative, use cases (WHAT/HOW/WHY/persona/conditions/supported elements), AI layer per product, experience principles per product | `docs/storytelling-framework.md` (workspace) + `apps/<product>/docs/storytelling/` (per-product) | intake skill writes |

Every layer carries (Source, Check, Gate, Loop). Missing any of the four = documentation theater.

---

## 3. Three Axes

| Axis | What it is | Where it lives |
|---|---|---|
| **Scholastic** | Rules in agent-readable spec, enforceable in pipeline | THIS FILE + L0–L5 + hooks in `.claude/settings.json` |
| **Deterministic** | Designer is final authority, file is the work | Romit in editor / browser / Magic Patterns / Figma; `.tsx` in git |
| **Stochastic** | Agent emits variance per session, parallel exploration | `/design-variants <N>` (P4) using `superpowers:dispatching-parallel-agents` |

The scholastic spec validates BOTH deterministic outputs and stochastic outputs. One spec, multiple sources.

---

## 4. Rules Catalogue

Every gate cites a rule ID. Hook output references the ID so violations are auditable.

### DS — Design System Conformance
- **DS-001** — No raw `<button>` in `apps/**/*.tsx`. Use DS `Button` with explicit variant + size. *Gate:* PreToolUse.
- **DS-002** — No hex / rgb() / hsl() literals in `apps/**`. Use CSS custom properties (`var(--token)`). *Gate:* PreToolUse.
- **DS-003** — No inline `boxShadow:` / `box-shadow:`. Use DS shadow tokens or `shadow-{sm,md,lg}` utilities. *Gate:* PreToolUse.
- **DS-004** — No raw `<table>` in `apps/**/*.tsx`. Use `Table` (admin) or `DataTable` (student). *Gate:* PreToolUse.
- **DS-005** — No `toast()` / Sonner in admin apps. Use `LocalBanner` / `SystemBanner`. (Student apps: allowed per studentUX rules.) *Gate:* PreToolUse.
- **DS-006** — No edits to `exxat-ds/` or `studentUX/` (read-only submodules). *Gate:* PreToolUse.
- **DS-007** — Component imports must match the active DS profile. Admin: `@exxat/ds/packages/ui/src`. Student: `@exxat/student/components/...`. *Gate:* PreToolUse after profile load.
- **DS-008** — Tailwind color utilities outside the semantic allowlist (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-card`, `bg-popover`, etc.) are banned. *Gate:* PreToolUse.
- **DS-009** — DS components may not have visual treatments (shadow, border, hover bg, padding, gradient) beyond what the DS source defines, unless documented as an exception. *Gate:* code review; long-term AST diff against component defaults.
- **DS-010** — Before importing any DS component, the import must resolve in `docs/foundations/ds-snapshot.json` for the active profile (203 admin exports + 54 student primitives + 46 shared as of v0.2.0). Hallucinated components are blocked. *Gate:* PreToolUse (blocking, v0.2).
- **DS-011** — No inline typography literals (`fontSize`, `fontWeight`, `fontFamily` as raw values in `style={{}}`). Use Tailwind classes (`text-xs`, `font-semibold`) or token references (`var(--text-xs)`, `var(--font-sans)`). *Gate:* PreToolUse (blocking, v0.2).

### A11Y — WCAG 2.2 AA + project rules
- **A11Y-001** (WCAG 4.1.2) — Icon-only `<Button>` requires `aria-label`. *Gate:* Stop hook.
- **A11Y-002** (WCAG 2.4.7) — Focus rings may not be removed. `outline-none` requires `focus-visible:ring-*`. *Gate:* Stop hook.
- **A11Y-003** (WCAG 1.4.3) — Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large). Tokens use `--foreground`/`--muted-foreground` against background. *Gate:* contrast check on tokens; PreToolUse on inline overrides.
- **A11Y-004** (WCAG 1.3.1) — Decorative Font Awesome icons require `aria-hidden="true"`. *Gate:* Stop hook.
- **A11Y-005** (WCAG 2.5.5) — Min touch target 44px on mobile / student apps. Use `--control-height-touch`. *Gate:* Stop hook for student; visual review for admin.
- **A11Y-006** (WCAG 1.3.1) — `DialogTitle` / `SheetTitle` required. Visually-hidden titles use `className="sr-only"`. *Gate:* Stop hook.
- **A11Y-007** — Sidebar shell: `<SidebarProvider className="h-svh"> + <Sidebar variant="inset">` required in admin layout.tsx. *Gate:* PreToolUse on layout.tsx.
- **A11Y-008** (WCAG 1.4.1) — Color is never the only encoding. Pair color with shape, label, or icon (charts, status, alerts). *Gate:* code review.
- **A11Y-009** — Nav substructure must follow DS templates. Sidebar uses `Sidebar > SidebarContent > SidebarGroup > SidebarMenu > SidebarMenuItem > SidebarMenuButton`. Breadcrumb uses `Breadcrumb > BreadcrumbList > BreadcrumbItem > BreadcrumbLink`. Tabs uses `Tabs > TabsList > TabsTrigger` + `TabsContent`. Skipping levels or substituting custom elements breaks keyboard nav and screen-reader semantics. *Gate:* pattern review; ds-component-check skill loads templates from profile.

### VIZ — Visualization Discipline
- **VIZ-001** — Progress bars are last resort. More than one `<Progress>` or `width: ${n}%` per `.tsx` requires justification comment OR pattern reference from `docs/patterns/viz/`. *Gate:* PreToolUse. *(Memory-backed)*
- **VIZ-002** — Viz first, text annotates. Outliers/comparisons drawn on the viz; do not enumerate in prose. *Gate:* code review + UserPromptSubmit reminder. *(Memory-backed)*
- **VIZ-003** — Chart color must use `--chart-1` … `--chart-5`. Conditional thresholds use `--conditional-rule-{green,yellow,blue,red,purple,orange}`. No raw chart colors. *Gate:* PreToolUse.
- **VIZ-004** — No red (`--destructive`, hue ~25) in score/rating/performance viz. Use amber/orange (`--chart-4`, `--chart-5`) for "below threshold". *Gate:* code review. *(Memory-backed: Aarti)*
- **VIZ-005** — Viz selection rubric (in `docs/patterns/viz/RUBRIC.md`) must be consulted for every analytics card. *Gate:* PreToolUse on dashboard / analytics file paths.

### CONTENT — Voice, Glossary, Errors
- **CONTENT-001** — Use the glossary in `apps/<product>/docs/content.md`. New terms added via intake before use. *Gate:* content-lint Stop hook.
- **CONTENT-002** — Empty states propose action; never "No data". *Gate:* content-lint.
- **CONTENT-003** — Error messages explain what happened, why, and what to do. *Gate:* content-lint.
- **CONTENT-004** — Tone matches active DS profile: admin = clinical-formal; student = supportive-empowering. *Gate:* code review.

### INTAKE — Living Context
- **INTAKE-001** — Granola transcripts pulled when user references a meeting → saved to `apps/<product>/docs/research/meetings/`. *Gate:* UserPromptSubmit fires Granola MCP.
- **INTAKE-002** — Decisions detected ("decided", "going with", "the answer is") → ADR at `docs/decisions/<NNN>-<title>.md`. *Gate:* UserPromptSubmit fires intake skill.
- **INTAKE-003** — New terminology proposed → glossary addition with confirmation before persisting. *Gate:* intake skill.
- **INTAKE-004** — Designer overrides ("ignore the rule", "exception here") → captured as ADR + pattern exception + DESIGN.md amendment if generalizable. *Gate:* P5.

---

## 5. Triggers (auto-firing)

Pointer: `docs/triggers.md` (workspace canonical map). Loaded at SessionStart, re-evaluated on UserPromptSubmit.

| User pattern | Fires |
|---|---|
| "design / build / new screen / new page" | brainstorming → Mobbin → Granola → frontend-design |
| Figma URL | claude_ai_Figma `get_design_context` |
| Magic Patterns URL | Magic Patterns `read_artifact_files` |
| Library/SDK reference | context7 |
| Meeting/person reference | Granola `query_granola_meetings` (intake) |
| `.tsx` edit in `apps/**` | ds-check + react-best-practices reminder |
| "fix / debug / why isn't" | systematic-debugging |
| "ship / merge / done / PR" | verification-before-completion → requesting-code-review |
| 3+ steps | writing-plans → executing-plans |
| 2+ independent tasks | dispatching-parallel-agents |
| "switch to student / studentUX" | load student profile |
| "switch to admin / Exxat-DS" | load admin profile |
| Granola transcript pasted | intake skill routes |

---

## 6. DS Profile Switching

When app-type or DS context changes, the matching profile auto-loads:

- `docs/foundations/ds-profiles/admin.md` — Exxat-DS (`@exxat/ds/packages/ui/src`)
- `docs/foundations/ds-profiles/student.md` — StudentUX (`@exxat/student/components/...`)

Each profile defines: imports, CSS, fonts, tokens, components available/unavailable, page templates, tone, density, a11y emphasis, required reading. Loaded as `<system-reminder>` to the session.

---

## 7. Per-Product Extension

Each product has `apps/<product>/DESIGN.md` extending this file. It overrides/adds at L2:
- product strategy (north star, principles, success metrics)
- personas
- workflows
- content (voice, glossary, error catalog)
- design references (Figma, Magic Patterns)

It MUST NOT redefine L0/L4 rules — those are workspace-global. Exceptions go through ADR.

```
apps/<product>/
├── DESIGN.md                  # extends root DESIGN.md
├── CLAUDE.md                  # already exists
└── docs/
    ├── strategy.md
    ├── personas.md
    ├── content.md
    ├── workflows/<flow>.md
    ├── design-refs.md
    ├── research/meetings/      # intake writes here
    ├── decisions/              # intake writes here
    └── specs/                  # attachments
```

---

## 8. Versioning & Changelog

- DESIGN.md uses semver. Bump on rule add/remove/change.
- Per-product DESIGN.md: independent semver, references workspace version.
- DS submodule changes: auto-emit diff to `docs/governance/ds-changelog.md` (post-merge hook).
- Rule changes: require ADR in `docs/decisions/`.

This file is at v0.1.0. Will move to v1.0.0 when P1 hooks are wired and tested.

---

## 9. How Any Agent Should Use This File

1. Read this file at session start.
2. Resolve active context from §1.
3. Load the active DS profile from `docs/foundations/ds-profiles/`.
4. Load any per-product `apps/<product>/DESIGN.md`.
5. Before generating: check rule catalogue (§4) for applicable rules.
6. Before claiming complete: validate against gates (§4 + L4).
7. On context input (transcript, attachment, decision): route via intake (§4 INTAKE rules).

---

## 11. Cross-Product Entity Universe

Source: ADR-001 (2026-05-08 Aarti). Master entities live ONCE at program level; each module subsets them.

| Entity | Owner | Used by |
|---|---|---|
| Master courses | Admin | All 5 products |
| Terms (master list) | Admin | All 5 products |
| Course offerings (course × term × faculty) | Admin | All 5 products |
| Students | Admin (via LMS sync where on) | All 5 products |
| Faculty | Admin | All 5 products |
| Permissions / role assignments | Admin | All 5 products |
| Content areas | Admin | Exam Mgmt, PCE, future curriculum products |
| Competencies | Admin | Exam Mgmt, PCE, Skills Checklist (likely) |
| Standards (accreditation) | Admin | Exam Mgmt, PCE |
| Accommodations (master list) | Admin | All 5 products (ADR-006) |
| Assessment types | Admin | Exam Mgmt primarily |

**Implication for module design:** every module shows its own student / faculty / course / term entity views (data shared, views per-module). Views may filter — e.g., faculty in Exam Mgmt sees only courses they're assigned to.

---

## 12. Module Sellability + Prism Launcher

Source: ADR-003. Each of the 5 products must be standalone-sellable. Prism main dashboard is replaced by a module launcher; React modules open in **new tab** from the Angular Prism shell.

**Implication for design:** every product's landing page must work without assuming the user came from Prism. No cross-product chrome. Romit owns the module launcher design (separate workstream).

---

## 13. Phase-1 Persona Collapse

Source: ADR-004. Phase 1 collapses to **3 view tiers** for every product:

- **Admin** — covers PD / committee chair / curriculum chair / dept chair / director / coordinator
- **Faculty** — covers full + adjunct + course director / instructor variants
- **Student** — covers all student roles

Per-product DESIGN.md may document additional sub-archetypes for design context, but **Phase 1 ships 3 views**, not 8+.

---

## 14. AI-First Thinking Pattern

Source: ADR-005. Every analytics surface splits content into two lanes:

- **Pulled** — trends, averages, comparative metrics, distributions. Predictable, computed from data.
- **AI** — themes, insights, action plans. Dynamic, extracted from user-authored content (open-text responses, etc.) without forcing a preset taxonomy.

**Implication for viz patterns (P3):** patterns must visually distinguish "pulled" vs "AI" content. AI content gets a recognizable affordance (icon, badge, tone) so users know it's machine-generated.

---

## 15. LMS-Integration-First Default

Source: ADR-002. Architecture assumes LMS integration is on. When on, the manual add controls for course / term / offering / student are **disabled**. School configuration toggle (set at admin onboarding) flips the assumption.

Today ~5% of customers integrate. Aarti wants this to flip to ~95% with the new modules.

**Implication for design:** every admin master-list screen has two states — "LMS-on" (read-only, sync indicator) and "manual" (CRUD). Default UI assumes LMS-on; manual is the exception.

---

## 16. Rollout Status

| Phase | Status | Notes |
|---|---|---|
| P0 — Keystone | **complete** (v0.1.0, 2026-05-08) | This file + 4 memory rules |
| P1 — Scholastic enforcement | **complete** (2026-05-08) | Hooks (session-start, user-prompt-submit, pre-tool-use), DS snapshot (333 tokens, 142 components), viz patterns (RUBRIC + heatmap + strip + bullet), profile auto-load |
| P2 — Living context | **complete** (2026-05-08) | intake skill, ADR scaffolding, transcript-paste detector, per-product DESIGN.md + docs/ for all 5 products. First exercise: 2026-05-08 Aarti audit produced 6 workspace ADRs + 2 product ADRs + cross-product entity universe (§11) |
| P3 — Pattern library + L7 Storytelling | **in progress** (2026-05-08) | 8 RUBRICs (states/forms/nav/ia/onboarding/async/dashboards/admin); 10 patterns (audit-driven + standard); workspace `docs/content.md` glossary. **L7 Storytelling layer added:** `docs/storytelling-framework.md` + per-product `docs/storytelling/` (real content for Exam Mgmt + PCE from 7-meeting Aarti/Vishaka audit; scaffolds for patient-log / skills-checklist / learning-contracts) |
| P4 — Stochastic variance | **complete** (2026-05-08) | `/design-variants <N> <brief>` slash command + `docs/patterns/process/design-variants.md` pattern + trigger wired in user-prompt-submit hook + RUBRIC for process patterns |
| P5 — Designer override loop | **complete** (2026-05-08) | `intake:override` action in intake skill + override ADR template (`docs/decisions/_override-template.md`) + exception ledger (`docs/governance/exceptions.md`) + rule-citation surfacing trigger + INTAKE-004 wired in user-prompt-submit hook |
| P5.5 — DS conformance hardening | **complete** (2026-05-08) | DS-010 hook (per-export verification — 203 admin exports tracked); DS-011 typography rule; A11Y-009 nav substructure; PreToolUse v0.2 blocking mode for DS-001..011; submodule post-merge auto-regen of ds-snapshot.json; ds-component-check skill; CI typecheck workflow for `apps/**/*.tsx` |
| P6 — Process & telemetry | not started | ADR + telemetry registry |
| P7 — Performance & i18n | not started | Perf budgets, localization |
| P8 — Platform-agnostic packaging | not started | Track Google DESIGN.md schema |
