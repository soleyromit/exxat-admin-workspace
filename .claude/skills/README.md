# `.claude/skills/` — Index + Anti-Recommendations

Workspace skills (invocable via Skill tool, slash command, or auto-fired by triggers).

## Active skills

| Skill | Purpose |
|---|---|
| `intake` | Granola transcript distillation (decisions, glossary, personas, ADRs) |
| `research-intake` | rr-insights distillation (research insights, themes) |
| `ds-component-check` | Verify a DS component before importing it |
| `ds-check` | DS rule audit on TSX files (R1-R12), read-only |
| `design-variants` | Stochastic design — N parallel agents in worktrees |
| `design-critique` | Design review against DESIGN.md §4 + DS + WCAG + stakeholder perspectives |
| `practices-audit` | Recurring audit of Claude Code best practices |
| `cross-page-audit` | After fixing any UI pattern, audit all sibling pages for the same issue — 8 known recurring patterns pre-loaded |

## Anti-recommendations — do NOT install or invoke

These exist in the broader Claude ecosystem but **conflict with our discipline**. Documented here so future-us / future-collaborators don't accidentally pull them in.

### `frontend-design` (Anthropic-Verified plugin) — ⚠ DO NOT INSTALL

- **What it does:** generates "distinctive, production-grade" UI with bold aesthetics, custom fonts, asymmetric layouts. Explicitly anti-Inter, anti-purple-gradient.
- **Why we skip it:** directly fights our DS discipline. It will tell Claude to:
  - Avoid `Inter` (our `--font-sans`)
  - Use Playfair / serif display fonts where we use `ivypresto-text`
  - "Vary aesthetics every time" (we want token-locked consistency)
  - Use asymmetric layouts (we use DS-prescribed grid)
- **Source:** `claude.com/plugins/frontend-design` + `github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md`
- **Tracked in:** `docs/governance/claude-practices.md` "Product design with Claude" section

### `superpowers:test-driven-development` — skip for design work

- **Why we skip it:** TDD is for production code shipping. Our work is stakeholder-review prototypes. Adopting TDD would slow design iteration without commensurate value.
- **Could revisit if:** we start maintaining live shipping code in this workspace.

### `superpowers:dispatching-parallel-agents` / `using-git-worktrees` — already specialized

- **Why we skip:** our `design-variants` skill is the design-specific instantiation of these. The generic versions add noise without new capability.

## Recommended-but-opt-in (not yet adopted)

These would help but require a workflow change. Adopt at user's call.

| Skill | Source | When to adopt |
|---|---|---|
| `superpowers:brainstorming` | locally cached | When next ambiguous design brief lands; pairs naturally with `intake` |
| `superpowers:verification-before-completion` | locally cached | Wrap design-output claims; complements `ds-check` |
| `superpowers:writing-plans` + `subagent-driven-development` | locally cached | At next 5+ screen prototype |

## Adding a new skill

1. Create `.claude/skills/<name>/SKILL.md` with frontmatter (`name:` + `description:` minimum)
2. Body: workflow, output format, honest discipline rules
3. If skill should auto-fire: add trigger to `.claude/hooks/user-prompt-submit.py` + `docs/triggers.md`
4. Add row to this README's "Active skills" table
5. Run `python3 scripts/architecture-audit.py` to verify frontmatter

## Why anti-recommendations are tracked here

So a future audit doesn't conclude "we should adopt X" without context. Each anti-row has:
- What the skill does
- Why we skip it
- Source
- Conditions under which to revisit

This prevents silent re-introduction of conflicting discipline.
