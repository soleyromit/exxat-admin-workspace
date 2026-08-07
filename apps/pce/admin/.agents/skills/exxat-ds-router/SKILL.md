---
name: exxat-ds-router
description: >-
  Entry skill for Exxat DS in Google Antigravity. Routes to surface archetype,
  token economy, senior UX brief gate, jobs, patterns, rules, and workflows.
  Load FIRST on any Exxat DS design or implementation task in this monorepo.
---

# Exxat DS — Antigravity router

**Platform:** Google Antigravity (`.agents/`). **Cursor mirror:** `.cursor/` (run `npx exxat-ui sync-extras` after rule/skill edits).

## Start here (in order)

1. **Constitution** — `.agents/rules/_constitution.exxat-ds.md` (always on)
2. **Surface packet** — `node scripts/agent-context-router.mjs <surface>` or skill `exxat-surface-router`
3. **Token budget** — `.agents/skills/exxat-token-economy/SKILL.md`
4. **UX router** (if archetype unclear) — `docs/exxat-ds/component-selection-guide.md`

## Surface → command

| User intent | Run / workflow | Skill |
| --- | --- | --- |
| New page / hub / IA change | `/design-brief` then `/build-hub` | `exxat-senior-ux`, `exxat-table-column-cells` |
| List / table / filter hub | `/build-hub` | `exxat-centralized-list-dataset`, `exxat-kpi` |
| Drawer / dialog / sheet | — | `exxat-overlays` |
| Sidebar / library scope | — | `exxat-sidebar-nav`, `exxat-primary-nav-secondary-panel` |
| Focus / exam lock | — | `jobs/focus-workflow.md` |
| A11y verification | `/a11y-ship` | `exxat-accessibility` |
| Review existing surface | `/ux-audit` | `exxat-ux-audit` |
| React health before commit | `/react-doctor` | `react-doctor` |
| DS primitive doc | — | `docs/exxat-ds/agents/ds-doc-author.md` |

## Surfaces (archetypes)

```bash
node scripts/agent-context-router.mjs list
```

Common: `hub-list`, `record-detail`, `overlay`, `focus-workflow`, `navigation`, `chart-dashboard`, `token-theme`, `accessibility`, `bug-fix`.

## Layer model

| Layer | Antigravity path | Cursor path |
| --- | --- | --- |
| L0 Constitution | `.agents/rules/` (4 always on) | `.agents/rules/` |
| L1 Router | `exxat-surface-router` skill + script | same |
| L2 Job doc | `docs/exxat-ds/jobs/*.md` | same |
| L3 Rule | `.agents/rules/*.md` | `.agents/rules/*.mdc` |
| L4 Skill | `.agents/skills/exxat-*/` | `.agents/skills/exxat-*/` |
| L5 Pattern | `docs/exxat-ds/*-pattern.md` | same |
| L6 Workflow | `.agents/workflows/*.md` | — (slash commands) |

**One boss per pattern** — do not duplicate checklists across rule, skill, pattern, and AGENTS.

## Index

- Machine index: `.agents/INDEX.yaml` + `docs/exxat-ds/INDEX.yaml`
- Parity map: `docs/exxat-ds/agents/antigravity-parity.md`
- Architecture: `docs/exxat-ds/agent-context-architecture.md`
