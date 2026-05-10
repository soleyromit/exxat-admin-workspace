# DESIGN.md — Exxat Workspace Design Intelligence Spec

> Canonical scholastic spec. Every agent (Claude, MagicPatterns Agent 2.0, Pencil.dev, future tools) reads this first.
> Composes: foundations, patterns, profiles, quality gates, governance.
> Per-product extensions live at `apps/<product>/DESIGN.md`.

**Version:** 1.0.0 (2026-05-08)
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
- **DS-012** — Every admin app's `app/globals.css` MUST contain the DS overrides block (DS Tabs fix, sidebar token, datatable tokens) verbatim from `docs/foundations/admin-globals-template.css`. Without these, DS Tabs render with broken layout (wrong orientation, no underline indicator) and the sidebar/datatable lose their theme tokens on dark mode. *Gate:* `scripts/ds-globals-audit.py` in pre-commit (blocking, --strict). *Reason:* DS itself ships with broken Tailwind classes for Tabs (sets `data-orientation` but classes look for `data-horizontal`); each admin app must mirror the fix until exxat-ds patches upstream.
- **DS-013** — No raw `oklch()` literal in inline `style` props. Define a CSS variable in `globals.css` and reference it as `var(--token)`. *Gate:* PreToolUse (blocking, v0.3).
- **DS-014** — `white` keyword inside `color-mix()` is banned. CSS's bare `white` short-circuits theme — use `var(--background)` so dark mode honors the theme. *Gate:* PreToolUse (blocking, v0.3).
- **DS-015** — DS `Button` MUST specify explicit `variant=` prop (`default | outline | secondary | ghost | destructive | link`). Never rely on the implicit default. *Gate:* PreToolUse (warning-only, v0.3 — regex is heuristic).
- **DS-016** — `<Table>` inside a rounded wrapper (`rounded-{lg|xl|2xl}`) requires `overflow-hidden` on the wrapper, otherwise rounded corners don't clip the scroll container. *Gate:* PreToolUse (warning-only, v0.3).
- **DS-017** — DS-token color in inline `style` should be a Tailwind class. Prefer `text-foreground` / `text-muted-foreground` / `text-destructive` over `style={{ color: 'var(--foreground)' }}`. *Gate:* PreToolUse (warning-only, v0.3).

### A11Y — WCAG 2.2 AA + project rules
- **A11Y-001** (WCAG 4.1.2) — Icon-only `<Button size="icon*">` requires `aria-label`. *Gate:* PreToolUse (blocking, v0.2).
- **A11Y-002** (WCAG 2.4.7) — Focus rings may not be removed. `outline-none` requires `focus-visible:ring-*`. *Gate:* PreToolUse (blocking, v0.2).
- **A11Y-003** (WCAG 1.4.3) — Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large). Tokens use `--foreground`/`--muted-foreground` against background. *Gate:* contrast check on tokens; PreToolUse on inline overrides.
- **A11Y-004** (WCAG 1.3.1) — Decorative Font Awesome icons require `aria-hidden="true"`. *Gate:* Stop hook.
- **A11Y-005** (WCAG 2.5.5) — Min touch target 44px on mobile / student apps. Use `--control-height-touch`. *Gate:* Stop hook for student; visual review for admin.
- **A11Y-006** (WCAG 1.3.1) — `DialogTitle` / `SheetTitle` required. Visually-hidden titles use `className="sr-only"`. *Gate:* PreToolUse (warning-only — regex is heuristic, may have false positives across files).
- **A11Y-007** — Sidebar shell: `<SidebarProvider className="h-svh"> + <Sidebar variant="inset">` required in admin layout.tsx. *Gate:* PreToolUse on layout.tsx.
- **A11Y-008** (WCAG 1.4.1) — Color is never the only encoding. Pair color with shape, label, or icon (charts, status, alerts). *Gate:* code review.
- **A11Y-009** — Nav substructure must follow DS templates. Sidebar uses `Sidebar > SidebarContent > SidebarGroup > SidebarMenu > SidebarMenuItem > SidebarMenuButton`. Breadcrumb uses `Breadcrumb > BreadcrumbList > BreadcrumbItem > BreadcrumbLink`. Tabs uses `Tabs > TabsList > TabsTrigger` + `TabsContent`. Skipping levels or substituting custom elements breaks keyboard nav and screen-reader semantics. *Gate:* pattern review; ds-component-check skill loads templates from profile.

### VIZ — Visualization Discipline
- **VIZ-001** — Progress bars are last resort. More than one `<Progress>` or `width: ${n}%` per `.tsx` requires justification comment OR pattern reference from `docs/patterns/viz/`. *Gate:* PreToolUse. *(Memory-backed)*
- **VIZ-002** — Viz first, text annotates. Outliers/comparisons drawn on the viz; do not enumerate in prose. *Gate:* code review + UserPromptSubmit reminder. *(Memory-backed)*
- **VIZ-003** — Chart color must use `--chart-1` … `--chart-5`. Conditional thresholds use `--conditional-rule-{green,yellow,blue,red,purple,orange}`. No raw chart colors. *Gate:* PreToolUse.
- **VIZ-004** — No red (`--destructive`, hue ~25) in score/rating/performance viz. Use amber/orange (`--chart-4`, `--chart-5`) for "below threshold". *Gate:* code review. *(Memory-backed: Aarti)*
- **VIZ-005** — Viz selection rubric (in `docs/patterns/viz/RUBRIC.md`) must be consulted for every analytics card. *Gate:* PreToolUse on dashboard / analytics file paths.
- **VIZ-006** — Cohort comparison must show pairing or distribution, never duo-numbers. Comparing cohort A to B requires slope-paired (per entity), distribution-overlay, or grouped bullet. Two large numbers side-by-side is forbidden in dashboard contexts. *Pattern:* `docs/patterns/viz/slope-paired.md`. *Gate:* code review.
- **VIZ-007** — Faceted views default to small multiples, not dropdowns. When a screen offers "filter by [faculty / cohort / term / program]" to swap a single chart, the default view must instead be small multiples of that facet. The dropdown becomes an optional drill-down. *Pattern:* `docs/patterns/viz/small-multiples.md`. *Gate:* code review.
- **VIZ-008** — Activity-over-time spanning ≥30 days uses calendar heatmap. Line/bar permitted only when day-of-week is irrelevant (e.g., monthly totals). Healthcare-program admin work has strong weekday/weekend cadence; line charts smooth it away. *Pattern:* `docs/patterns/viz/calendar-heatmap.md`. *Gate:* code review.
- **VIZ-009** — Sequential stages (≥3 stages with attrition between them) must use Sankey/flow viz, not separated count cards. Drop-off is the story. *Pattern:* `docs/patterns/viz/progression-sankey.md`. *Gate:* code review.
- **VIZ-010** — Single-metric dashboard cards must include AT LEAST ONE of: sparkline (≥3 points), bullet-vs-target, delta-from-cohort, or n-of-total. Bare big-number with optional arrow-delta is forbidden in dashboard contexts. *Gate:* code review. *(Closes the duo-numbers loophole.)*
- **VIZ-011** — Banned chart types: gauges/dials, donut/pie with >5 slices, exploded pies, 3D anything, dual y-axis line charts, stacked bars with >4 stacks. (Few + Tufte canon, confirmed by 2026-05-09 viz audit.) *Gate:* code review + PreToolUse pattern check.

### A11Y — Accessibility (extension; A11Y-001..009 above)
- **A11Y-010** — `<img>` and `<Image>` MUST have `alt`. Decorative images use `alt=""`. Maps to **WCAG 1.1.1**. *Gate:* PreToolUse regex on TSX. *Pattern:* `docs/patterns/a11y/landmarks.md`.
- **A11Y-011** — Form inputs require an associated label: `<Label htmlFor>` + matching `id`, or `aria-label`/`aria-labelledby`. **Placeholder is not a label.** Maps to **WCAG 3.3.2 + 4.1.2**. *Gate:* PreToolUse on `<Input>`/`<Select>`/`<Textarea>`. *Pattern:* `docs/patterns/a11y/form-error-announce.md`.
- **A11Y-012** — Admin `app/(app)/layout.tsx` MUST include a skip-to-main link before the sidebar nav: `<a href="#main">Skip to content</a>` + `<main id="main" tabIndex={-1}>`. Maps to **WCAG 2.4.1**. *Gate:* PreToolUse on admin layout files. *Pattern:* `docs/patterns/a11y/skip-link.md`.
- **A11Y-013** — Async status changes (banner appears, save succeeds, validation fails) wrapped in `aria-live`. Polite for non-critical, assertive for blocking errors. Banners default to `role="status"`. Maps to **WCAG 4.1.3**. *Gate:* code review + DS audit. *Pattern:* `docs/patterns/a11y/live-region.md`.
- **A11Y-014** — Link/button text must convey purpose without surrounding context. Banned as standalone text: "click here", "read more", "learn more". Icon-only `<a>`/`<Link>` requires `aria-label`. Maps to **WCAG 2.4.4 + 4.1.2**. *Gate:* PreToolUse regex. (Mirrors A11Y-001 for `<a>`.)
- **A11Y-015** — Drag operations (DragHandleGrip, kanban reorder) MUST have a non-drag alternative — DropdownMenu with "Move up" / "Move down" / "Move to…", or arrow-key reorder. Maps to **WCAG 2.5.7 (new in WCAG 2.2)**. *Gate:* code review on files importing `DragHandleGrip`. *Pattern:* `docs/patterns/a11y/drag-alternative.md`.
- **A11Y-016** — Sticky / fixed / floating UI must not obscure focused element when keyboard-navigating. Use `scroll-padding-top` matching sticky height. Maps to **WCAG 2.4.11 (new in WCAG 2.2)**. *Gate:* code review on `position: sticky`/`fixed`. *Pattern:* `docs/patterns/a11y/focus-not-obscured.md`.
- **A11Y-017** — Non-text UI contrast ≥ 3:1 against adjacent colors: form-field borders, focus rings, icon-only buttons, chart axes/legends. Use `--border-control-3` / `--border-control-35` only for fields. Maps to **WCAG 1.4.11**. *Gate:* token contrast audit (CI script) + code review. *(Distinct from A11Y-003 text contrast.)*
- **A11Y-018** — Modal/Sheet/Drawer MUST trap focus while open and restore focus to opener on close. DS `Dialog`/`Sheet` from `@exxat-ds/ui` already handle this; **raw `<div role="dialog">` is BANNED.** Maps to **WCAG 2.1.2 + 2.4.3**. *Gate:* PreToolUse banning raw `role="dialog"`. *Pattern:* `docs/patterns/a11y/modal-focus-trap.md`.
- **A11Y-019** — Page heading hierarchy: exactly one `<h1>` per route, no heading levels skipped (h2 → h4 forbidden). Sidebar/nav not counted. Maps to **WCAG 1.3.1 + 2.4.6**. *Gate:* Stop hook AST scan. *Pattern:* `docs/patterns/a11y/landmarks.md`.

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
- **INTAKE-005** — Raw transcripts MUST be read line by line, not summarised or skimmed. Before making any screen change from a transcript, extract ALL directives using the five-category checklist: (1) headline decisions, (2) role-specific visibility changes, (3) layout/proportion directives, (4) scope expansions ("not just X — any Y"), (5) missing data fields Aarti expected to see. Skipping any category is a process violation. *Gate:* manual review; enforced in `.claude/routines/design-sync-instructions.md`.
- **INTAKE-006** — After extracting all directives from a transcript, cross-check each against the current screen implementation before marking it done. "Done" means the screen was read AND the directive was verified present in the code — not just that it was documented. *Gate:* manual verification step before each PR.

### PERF — Performance Budgets (P7)
- **PERF-001** — Core Web Vitals budgets per app type: LCP ≤ 2.5s (1.5s for assessment-taker), INP ≤ 200ms (100ms for assessment-taker), CLS ≤ 0.1 (0.05 for assessment-taker). *Gate:* Lighthouse CI per PR. See `docs/quality/perf.md`.
- **PERF-002** — Initial bundle size budgets: admin ≤ 250KB, student ≤ 200KB, assessment-taker ≤ 150KB. Routes lazy-load beyond initial. *Gate:* CI bundle-size check.
- **PERF-003** — Use `next/image` for layout-impacting images (admin/student). Raw `<img>` only for decorative/tiny imagery. *Gate:* code review.
- **PERF-004** — Font loading via documented Typekit + Font Awesome references only; no new font sources without ADR. *Gate:* code review.
- **PERF-005** — Server components by default; `'use client'` opt-in only when interactivity, browser APIs, or React hooks needed. *Gate:* code review.
- **PERF-006** — Hot-path sub-bundles: assessment-taker exam delivery <100KB to first paint, mobile eval form <60KB, module launcher <500ms tile-status fetch. *Gate:* per-app build report.

### I18N — Internationalization Readiness (P7)
- **I18N-001** — All user-facing strings live in message catalogs (`apps/<product>/<app-type>/messages/<locale>.json`); no hardcoded strings in components. *Gate:* code review. Phase 1 = en-US only; architecture must be ready.
- **I18N-002** — Locale resolution at school-configuration level; no per-user override Phase 1. *Gate:* architecture review.
- **I18N-003** — CSS uses logical properties (`padding-inline-start`, `margin-inline-end`, `text-align: start`) instead of physical (`left`/`right`); Tailwind logical classes (`ps-*`, `pe-*`, `me-*`, `start-*`, `end-*`) are first-class. *Gate:* code review.
- **I18N-004** — New locale activation requires ADR documenting locale, glossary owner, QA path. *Gate:* governance.

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

This file is at **v1.0.0** as of 2026-05-08 — all 10 phases (P0–P8 + P5.5) complete. Next bumps will be from P4+ pattern additions, rule additions, or DS submodule updates that warrant schema-level acknowledgment.

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
| P6 — Process & telemetry | **complete** (2026-05-08) | Telemetry write helper (`.claude/hooks/_telemetry.py`); 4 event types (`session.start`, `userpromptsubmit`, `pretooluse.pass`, `pretooluse.violation`) emitted by all 3 hooks; analyzer (`scripts/telemetry-report.py`) with weekly/quarterly/JSON modes; schema + privacy + retention docs at `docs/telemetry/README.md`; events file gitignored; quarterly governance review wired in `docs/governance/exceptions.md` |
| P7 — Performance & i18n | **complete** (2026-05-08) | PERF-001..006 + I18N-001..004 in DESIGN.md §4; `docs/quality/perf.md` (per-app-type CWV + bundle budgets); `docs/quality/i18n.md` (catalog architecture, locale resolution, RTL prep); `.github/workflows/lighthouse.yml` (CWV CI gates with per-app matrix) |
| P8 — Platform-agnostic packaging | **complete** (2026-05-08) | `scripts/export-design-spec.py` produces `docs/exports/v<version>/` machine-readable bundle (rules.json + triggers.json + patterns.json + products.json + ds-snapshot.json copy + meta.json + README); schema doc at `docs/governance/spec-schema.md`; consumer guide at `docs/governance/agent-portability.md`; Google DESIGN.md alignment tracker at `docs/governance/google-design-md-alignment.md`; DESIGN.md bumped to v1.0.0 |
