# Agent context architecture

**Audience:** maintainers, reviewers, AI agents wiring new DS patterns.

**Index:** [`INDEX.yaml`](./INDEX.yaml). **UX router:** [`component-selection-guide.md`](./component-selection-guide.md).

---

## Layer model

| Layer | Cursor | Claude Code | Purpose | Load when |
|-------|--------|-------------|---------|-----------|
| **L0 Constitution** | `.cursor/rules/_constitution.exxat-ds.mdc` + product-context + product-routing + ux-discovery-protocol | `.claude/rules/` (same files) | Ten commandments, precedence | Every turn (4 files) |
| **L1 Surface router** | `exxat-surface-router` / `scripts/agent-context-router.mjs` → `exxat-token-economy` skill | Same skill; same helper in package CLI | What archetype am I touching? | First design/code turn |
| **L1b UX router** | `component-selection-guide.md` | Same path | Resolve ambiguous surface choices | Only when archetype is unclear |
| **L2 Job doc** | `jobs/*.md` | Same (`docs/exxat-ds/jobs/` in consumers) | User intent + UX checklist | After router picks surface |
| **L3 Scoped rule** | `.cursor/rules/exxat-*.mdc` (glob) | `.claude/rules/exxat-*.mdc` | Binding MUST/MUST NOT | Editing matching paths |
| **L4 Skill** | `.cursor/skills/exxat-*/SKILL.md` | `.claude/skills/exxat-*/SKILL.md` | Procedure, grep, checklist | Task needs depth |
| **L5 Pattern doc** | `*-pattern.md` | Same | Why + architecture narrative | Human / deep dive |
| **L6 Ship gate** | `accessibility-ship-checklist.md`, `AGENTS.md` §13 | Same | Pre-merge | Before PR |

**One boss per pattern:** do not duplicate the same bullets across rule, skill, pattern, job, and AGENTS.

---

## Artifact contract

| Adding… | Create / update |
|---------|-----------------|
| New binding constraint | Scoped `.mdc` (≤80 lines) + link from constitution table if universal |
| New user journey | `jobs/<slug>.md` + row in `component-selection-guide` §0 |
| New shell type | Job doc + `*-pattern.md` + scoped rule with globs |
| Procedure / audit steps | Skill only |
| Narrative / examples | Pattern doc only |

---

## PR checklist — agent context changes

Reviewers use this when a PR touches `.cursor/`, `docs/jobs/`, or pattern docs.

- [ ] **No new `alwaysApply: true`** without design-system review (target: 4 files only — see `INDEX.yaml` → `rules.always_on`).
- [ ] **New pattern** has job doc OR updates existing job — not rule-only.
- [ ] **Rule** is ≤80 lines of MUST/MUST NOT; detail lives in pattern/skill.
- [ ] **Glob** covers real consumer paths (`apps/web/...` rewritten on vendor for `{components,lib,src}/**`).
- [ ] **`component-selection-guide.md` §0** updated if surface type is new.
- [ ] **`INDEX.yaml`** updated (jobs, patterns, rules, task_router).
- [ ] **No duplicate** of same checklist across rule + skill + AGENTS §.
- [ ] **`pnpm --filter @exxatdesignux/ui vendor:consumer-extras`** run if shipping to npm consumers (mirrors `.cursor/` → `.claude/` in builder + `generated-starter`).
- [ ] **Hooks** preferred over new always-on prose for enforcement (brief-gate, react-doctor).

---

## Maintainer workflow (monorepo → npm)

```bash
# After changing .cursor/rules, .cursor/skills, or apps/web/docs/{jobs,patterns,INDEX}:
pnpm --filter @exxatdesignux/ui vendor:consumer-extras

# Before publish (builder → generated-starter):
pnpm sync-ui-template
```

**Consumer apps** refresh with `npx exxat-ui sync-extras` — see `consumer-upgrade-checklist.md`.

---

## Always-on files (do not expand without review)

1. `_constitution.exxat-ds.mdc`
2. `exxat-product-context.mdc`
3. `exxat-product-routing.mdc`
4. `exxat-ux-discovery-protocol.mdc`

Everything else: **scoped** or **on demand**.

---

## Consolidated skills (prefer over loading many small skills)

| Skill | Covers |
|-------|--------|
| `exxat-kpi` | trends, max-four, flat-band |
| `exxat-overlays` | drawer vs dialog, page vs drawer, no-vaul |
| `exxat-sidebar-nav` | secondary panel vs drill-in, library IA |

Legacy skills remain as redirects; new work loads consolidated skill.

---

## Enforcement (hooks > prose)

| Hook | Role |
|------|------|
| `exxat-brief-gate.mjs` | Blocks design edits without brief checkpoint |
| `react-doctor.sh` | Post-edit React/a11y regressions on staged files |

Do not add always-on rules to replace hooks.

---

## Google Antigravity mirror

Cursor remains the **source of truth** for rules and Exxat skills. Antigravity copies live under **`.agents/`**.

| Cursor | Antigravity |
| --- | --- |
| `.cursor/rules/*.mdc` | `.agents/rules/*.md` |
| `.cursor/skills/exxat-*/` | `.agents/skills/exxat-*/` |
| — | `.agents/workflows/*.md` (slash commands) |
| `apps/web/docs/` jobs + patterns | shared |

**Sync:** `pnpm sync-antigravity` after editing `.cursor/rules` or `.cursor/skills/exxat-*`.

**Entry:** `.agents/skills/exxat-ds-router/SKILL.md` · **Map:** `apps/web/docs/agents/antigravity-parity.md`

Hand-maintained (not overwritten by sync): `.agents/workflows/`, `.agents/skills/exxat-ds-router/`.
