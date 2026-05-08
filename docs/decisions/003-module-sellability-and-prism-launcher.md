---
type: decision
date: 2026-05-08
product: workspace
status: Accepted
source: granola
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
granola_meeting: 4e1c850e-d760-4d05-81a1-a52287b9ae21
---

# ADR-003 — Independent module sellability + Prism module launcher

## Status

Accepted (Aarti, 2026-05-08)

## Context

Exxat's commercial direction is shifting away from "buy the whole Prism suite" toward "buy the modules you need." Aarti made this explicit in the 2026-05-08 review:

> "Going forward, I'm going to be with or without prism. It's going to be with or without clinic. With or without compliance… each product is independently sellable."

The current Prism main dashboard (combined students + faculty + courses view) assumes the full suite is purchased. Customers who buy only Exam Management or only PCE shouldn't land on a dashboard for products they don't have.

## Decision

1. Every product (Exam Management, PCE, Patient Log, Skills Checklist, Learning Contracts) must be standalone-sellable. No cross-product dependencies in core flows.
2. The current Prism main dashboard is replaced by a **module launcher**: a landing page that lists each module the customer has, each opening in a new tab.
3. Because Prism is Angular and the new modules are React, modules open in **new browser tabs** rather than embedded routes.
4. Romit owns the module launcher design (separate workstream from the 5 product modules).

Each product's own landing page must work without assuming the user came from Prism. No shared chrome assumptions.

## Alternatives considered

- **Bundled Prism only** (current state) — rejected per Aarti's commercial direction.
- **Embed React modules in Angular Prism via micro-frontend** — rejected because of tech-stack split risk and slower iteration.
- **In-place SPA (no new tab)** — rejected because state isolation between Angular Prism and React modules is hard; new tab is the simplest contract.

## Consequences

- Positive: Each product owns its full UX without negotiating with Prism's chrome.
- Positive: Sales motion simplifies — sell one module, deliver one module.
- Positive: Tech-stack divergence (React modules, Angular Prism) becomes a feature, not a problem.
- Negative: Cross-module nav requires a tab switch. Users with multiple modules will have multiple tabs open.
- Negative: Auth must work across tabs (likely SSO; needs verification with engineering).
- Follow-up: Module launcher design — get Aarti to forward the Prism modules diagram (R10), then design.
- Follow-up: Each product's DESIGN.md should note "no Prism chrome assumptions" in its principles section.
