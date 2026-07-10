# CLAUDE.md — Workspace Portal

Workspace-wide portal for access & cross-product navigation.

## Identity

Romit Soley (Product Designer II, Exxat) owns this product.

## Product Status

- **Status:** active
- **Admin package:** `@exxat/portal`
- **Port:** 3100
- **DS:** `@exxatdesignux/ui` (canonical npm package)
- **Owner (PM):** Romit
- **Owner (Dev):** Romit
- **Priority:** high
- **Lifecycle:** Cross-stage

## Sequential Design Protocol (full spec: `docs/governance/design-review-protocol.md`)

**Before any JSX — Gate 1:**
1. `query_granola_meetings` for the entity/feature → `get_meeting_transcript` for each hit — extract decisions, scope constraints, UX directives
2. Read `docs/governance/design-anti-patterns.md` + `docs/governance/component-consistency.md`
3. Spawn `ds-adoption-reviewer` for any new component file

**After any UI-touching change — Gate 2:**
1. Self-review: `component-consistency.md §10` checklist (10 items)
2. Transcript alignment: implementation vs Gate 1 transcript decisions (✅ match / ⚠ assumption / ❌ contradiction)
3. Spawn `compliance-reviewer` — WCAG 2.1 AA + FERPA. **NEEDS-MORE blocks done claim.**
4. Spawn `state-review` for list/form/async pages. **NEEDS-MORE blocks done claim.**
5. Spawn `verification-reviewer` — all current patterns in `docs/governance/verification-discipline.md`. **NEEDS-MORE blocks done claim.**
6. Grep: `uppercase tracking-wide` · `py-20 text-center` · `color-mix(in oklch` — any hit = violation
7. Spawn `Explore` to grep-verify every claimed change exists — never claim done from session memory (Pattern G).
8. **Evidence block on every done claim** — axe-core path or "not run", DS import file:line per new component, grep result (Pattern I).
9. **Two-tier verdict (Pattern L):** `GREENLIGHT (static)` — code analysis only / `GREENLIGHT (runtime)` — interactions.mjs ran. List what was NOT verified.

**If a P1 flag or PRD change is mentioned:** read `docs/watch/digest-latest.md`

---

## Running the Dev Server

```bash
cd /Users/romitsoley/Work/apps/portal && pnpm dev
```

Dev server runs on port 3100.

---

## Design References

> Portal design references will be added as the product scope crystallizes.

---

## Quick Navigation

- Workspace rules: see parent `CLAUDE.md`
- DS reference: see `node tools/ds/source.mjs` (+ globals.css)
- Design spec: (pending)
