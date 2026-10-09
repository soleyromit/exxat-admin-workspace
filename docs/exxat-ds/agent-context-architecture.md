# Agent context architecture

**Audience:** maintainers, reviewers, AI agents wiring new DS patterns.

**Index:** [`INDEX.yaml`](./INDEX.yaml). **UX router:** [`component-selection-guide.md`](./component-selection-guide.md).

---

## Layer model

| Layer | Cursor | Claude Code | Purpose | Load when |
|-------|--------|-------------|---------|-----------|
| **L0 Constitution** | `_constitution` + product-context + product-routing + ux-discovery-protocol + copy-discipline | `.claude/rules/` (same files) | Ten commandments, precedence | Every turn (**5** files) |
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

- [ ] **No new `alwaysApply: true`** without design-system review (target: 5 files only — see `INDEX.yaml` → `rules.always_on`).
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
5. `exxat-copy-discipline.mdc`

Everything else: **scoped** or **on demand**.

---

## Coverage model — not one rule per component

The registry has **~130** primitives/templates. Agents do **not** get a dedicated
rule + skill + agent role for each slug. That would explode always-on tokens and
duplicate the catalog.

| Need | Where it lives |
|------|----------------|
| “Does this primitive exist / how do I import it?” | `component-map.json` + Design System catalog doc (`lib/design-system/component-docs/`) |
| “How do I build this *job*?” | `jobs/*.md` + `component-selection-guide.md` |
| Binding MUST/MUST NOT for a *family* | Scoped `.cursor/rules/exxat-*.mdc` (forms, Leo, hubs, overlays, …) |
| Step-by-step procedure | Skill (`exxat-kpi`, `exxat-overlays`, …) |
| Why / narrative | `*-pattern.md` |

**Add a new scoped rule only when** a recurring agent failure needs a hard
constraint (example: `exxat-form-fields`, `exxat-leo-icon-motion`). Prefer
catalog docs + the component map for ordinary primitive usage.

---

## Sync targets (source of truth: `.cursor/`)

| Target | Path | Sync |
|--------|------|------|
| Cursor | `.cursor/rules`, `.cursor/skills`, `.cursor/hooks` | edit here |
| Claude Code | `.claude/` | `pnpm sync-claude` |
| Google Antigravity | `.agents/` (rules as `.md`) | `pnpm sync-antigravity` |
| npm consumers | `packages/ui/consumer-extras/` | `pnpm --filter @exxatdesignux/ui vendor:consumer-extras` |
| Generated starter | `packages/ui/generated-starter/.cursor` + `.claude` + `.agents` | same vendor + `pnpm sync-ui-template` |

**One command after agent-context edits:**

```bash
pnpm sync-agent-context   # template + claude + antigravity + vendor + validate
pnpm agent:context:validate
```

---

## Inventory (workspace)

| Kind | Location | Count (approx) |
|------|----------|----------------|
| Rules | `.cursor/rules/*.mdc` | 63 (5 always-on) |
| Skills | `.cursor/skills/*/SKILL.md` | ~37 |
| Hooks | `.cursor/hooks/` + `hooks.json` | 5 scripts |
| Jobs | `apps/web/docs/jobs/` | 7 |
| Patterns | `apps/web/docs/*-pattern.md` | ~29 |
| Catalog docs | `apps/web/lib/design-system/component-docs/` | ~35 files (families + primitives) |
| Agent roles | `apps/web/docs/agents/` + `.claude/agents/` | 4 (hub-builder, a11y-guardian, ds-doc-author, senior-ux) |
| Antigravity workflows | `.agents/workflows/` | 6 slash commands |

---

## Consolidated skills (prefer over loading many small skills)

| Skill | Covers |
|-------|--------|
| `exxat-kpi` | trends, max-four, flat-band |
| `exxat-overlays` | drawer vs dialog, page vs drawer, no-vaul |
| `exxat-sidebar-nav` | secondary panel vs drill-in, library IA |
| `exxat-surface-router` | archetype → minimum file set |
| `exxat-token-economy` | pre-flight + deny-list |

Legacy skills remain as redirects; new work loads consolidated skill.

---

## Enforcement (hooks > prose)

| Hook | Event | Role |
|------|-------|------|
| `exxat-session-status.mjs` | sessionStart | Reminds image = IA only + router |
| `exxat-image-ia-gate.mjs` | beforeSubmitPrompt | Flags screenshot/mockup prompts |
| `exxat-brief-gate.mjs` | preToolUse (edits) | Blocks design edits without brief |
| `exxat-ds-check.mjs` | postToolUse | DS fingerprint / anti-rebuild checks |

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
