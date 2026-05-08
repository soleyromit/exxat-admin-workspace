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
| L1 Patterns | Composition recipes (viz, states, forms, nav, IA, onboarding, async) | `docs/patterns/<category>/<name>.md` | hand-written |
| L2 Product UX | Strategy, personas, workflows, content per product | `apps/<product>/DESIGN.md`, `apps/<product>/docs/` | hand-written |
| L3 Process | Research, ADRs, telemetry, decisions | `docs/research/`, `docs/decisions/`, `docs/telemetry/`, plus per-product equivalents | intake skill writes |
| L4 Quality Gates | A11y (WCAG 2.2 AA), perf, DS conformance, visual regression | `docs/quality/{a11y,perf,visual}.md`, `scripts/`, `.claude/hooks/` | hand-written rules, automated checks |
| L5 Governance | Versioning, deprecation, contribution, ds-changelog | `docs/governance/{deprecation,contribution,versioning,ds-changelog}.md` | changelog: auto; rest: hand |

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
- **DS-010** — Before importing any DS component, the import must resolve in `docs/foundations/ds-snapshot.json` for the active profile. Hallucinated components are blocked. *Gate:* PreToolUse.

### A11Y — WCAG 2.2 AA + project rules
- **A11Y-001** (WCAG 4.1.2) — Icon-only `<Button>` requires `aria-label`. *Gate:* Stop hook.
- **A11Y-002** (WCAG 2.4.7) — Focus rings may not be removed. `outline-none` requires `focus-visible:ring-*`. *Gate:* Stop hook.
- **A11Y-003** (WCAG 1.4.3) — Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large). Tokens use `--foreground`/`--muted-foreground` against background. *Gate:* contrast check on tokens; PreToolUse on inline overrides.
- **A11Y-004** (WCAG 1.3.1) — Decorative Font Awesome icons require `aria-hidden="true"`. *Gate:* Stop hook.
- **A11Y-005** (WCAG 2.5.5) — Min touch target 44px on mobile / student apps. Use `--control-height-touch`. *Gate:* Stop hook for student; visual review for admin.
- **A11Y-006** (WCAG 1.3.1) — `DialogTitle` / `SheetTitle` required. Visually-hidden titles use `className="sr-only"`. *Gate:* Stop hook.
- **A11Y-007** — Sidebar shell: `<SidebarProvider className="h-svh"> + <Sidebar variant="inset">` required in admin layout.tsx. *Gate:* PreToolUse on layout.tsx.
- **A11Y-008** (WCAG 1.4.1) — Color is never the only encoding. Pair color with shape, label, or icon (charts, status, alerts). *Gate:* code review.

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

## 10. Rollout Status

| Phase | Status | Notes |
|---|---|---|
| P0 — Keystone | **complete** (v0.1.0, 2026-05-08) | This file + 4 memory rules |
| P1 — Scholastic enforcement | **complete** (2026-05-08) | Hooks (session-start, user-prompt-submit, pre-tool-use), DS snapshot (333 tokens, 142 components), viz patterns (RUBRIC + heatmap + strip + bullet), profile auto-load |
| P2 — Living context | **in progress** (2026-05-08) | intake skill, ADR scaffolding, transcript-paste detector, per-product DESIGN.md + docs/ for all 5 products (real content for PCE + exam-management; scaffolds for patient-log / skills-checklist / learning-contracts) |
| P3 — Pattern library completion | not started | states/forms/nav/IA/onboarding/async + content.md |
| P4 — Stochastic variance | not started | `/design-variants` workflow |
| P5 — Designer override loop | not started | Override → spec amendment |
| P6 — Process & telemetry | not started | ADR + telemetry registry |
| P7 — Performance & i18n | not started | Perf budgets, localization |
| P8 — Platform-agnostic packaging | not started | Track Google DESIGN.md schema |
