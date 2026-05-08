---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: conversation
session: 3a956245-97ab-422a-8fdd-11351d2c631f
---

# ADR-000 — Record architecture decisions

## Status

Accepted

## Context

The Exxat DS workspace spans 5 products with 10 Next.js apps, two read-only DS submodules, custom Claude harness (hooks, skills, MCPs), and an evolving design intelligence spec at `/DESIGN.md`. Decisions made over the past month — DS submodule strategy, brand selection (One vs Prism), persona-switching behavior, autopilot vs manual flow for PCE, etc. — live only in chat transcripts and PR descriptions. Future agents and future humans cannot recover them without re-reading hundreds of messages.

The DESIGN.md L3 Process layer requires `docs/decisions/` exist. Rule INTAKE-002 routes detected decisions to ADRs. Without an ADR practice, the rule has nowhere to write.

## Decision

We will record architecture decisions as ADRs in `docs/decisions/<NNN>-<slug>.md` (workspace) and `apps/<product>/docs/decisions/<NNN>-<slug>.md` (per-product). The intake skill drafts ADRs from conversation signals (decision keywords, transcript paste) with confirm-before-write. Format follows Michael Nygard's lightweight ADR convention, adapted to our frontmatter standard.

ADRs are append-only. Status moves from Proposed → Accepted → (sometimes) Superseded. We do not edit historical decisions in place; we supersede them.

## Alternatives considered

- **No ADRs, rely on PR descriptions** — rejected because PR scope rarely matches decision scope; cross-cutting decisions get fragmented across many PRs.
- **One central decisions.md** — rejected because diff noise and merge conflicts grow with team size; per-decision files give clean history per-decision.
- **Notion/Linear instead of git** — rejected because the agent harness reads from the file system; off-system decisions can't be enforced or referenced by hooks.

## Consequences

- Positive: Decisions become greppable, agent-readable, and reviewable in the same PR as the change they motivate.
- Positive: Future Claude sessions resolve "why did we…" questions by reading ADRs instead of relying on memory.
- Negative: Adds writing overhead — the intake skill must minimize this with confirm-then-write rather than asking the user to author from scratch.
- Follow-up: The intake skill must be tuned over the first 5–10 ADRs to avoid false positives ("decided to grab coffee" should not trigger an ADR).
