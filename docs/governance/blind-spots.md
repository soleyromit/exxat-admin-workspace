# Harness Blind Spots — Tracked Self-Critique

> What the design-intelligence harness can't catch, and the workarounds we've built or owe.
>
> Maintained as the workspace's honest self-assessment. When a new failure mode is found that the harness missed, add a row here. When a workaround ships, mark it. The point is to NOT silently accept gaps.
>
> Per Romit 2026-05-10 adversarial review: the harness optimizes for what's easy to regex (strings, imports, attribute presence) and misses everything semantic (visual feel, navigation flow, governance).

## Schema

| # | Blind spot | Why it happens | Workaround status | Workaround |
|---|---|---|---|---|

## The 10 blind spots (2026-05-10 adversarial review)

| # | Blind spot | Why | Status | Workaround |
|---|---|---|---|---|
| 1 | I anchor on the question asked, not the systemic problem behind it | Path of least resistance — fix the one thing shown rather than auditing the class of issue | ⏳ partial | When a failure surfaces, audit the whole category (e.g., dead-link bug found → run dead-link-audit on full tree, not just the one route) |
| 2 | "Audit passes" gives false confidence — the rule SET is incomplete | Clean output with shallow rules feels like clean product | ❌ owed | Build `scripts/audit-coverage.py`: lists what each audit doesn't check. Run before ever claiming "all clean." |
| 3 | I read source files, not rendered output — source compiles fine while visual is catastrophic | Regex on TSX strings is what the harness sees | ❌ owed | Playwright + screenshot diff per route, weekly. Real eyes on real renders. |
| 4 | I treat token usage as binary — page using `--muted` is "compliant" even if zero brand tokens render | DS conformance defined as "imports correct" not "brand visible" | ✅ shipped 2026-05-10 | `scripts/brand-presence-audit.py` + DS-018 rule |
| 5 | I don't validate cross-references — *"same as exam-mgmt"* claim was wrong, nobody checked | Trust the spec without verifying | ✅ shipped 2026-05-10 | DS-019 brand-governance ADR + `docs/decisions/007` documents brand-by-product table; cross-product claims must be source-verified |
| 6 | I commit the rule, not the fix — add regex to PreToolUse, pre-existing violations remain | Rule-shipped feels like progress | ❌ owed | Every new rule MUST ship with: regex + one-time codemod + before/after count. Hard process rule. |
| 7 | I conflate "documented" with "enforced" — adding to DESIGN.md without a gate | Effort feels like outcome | ⏳ partial | New `docs/governance/rule-enforcement.md` registry to ship: every rule + its gate (regex / script / human review / NONE). NONE = theater. |
| 8 | I don't audit governance — decisions like *"PCE = lavender"* have no ADR trail | Governance feels heavy for fast iteration | ⏳ partial | DS-019 added (brand governance via ADR). Other product-config decisions (default term, primary persona, mock data state) need similar ADR coverage. |
| 9 | I default to "ship-velocity > thoroughness" — long sessions, lots of commits feels productive | Reward signal is wrong | ⏳ self-discipline | Before any product-code commit, run brand-presence-audit + dead-link-audit. Surface results in commit msg. |
| 10 | I miss the "compared to what" baseline — no diff against prototype Aarti approved or against exam-mgmt | The reference is in the user's head | ❌ owed | Add `scripts/cross-product-diff.py` — render a route in exam-mgmt + same-shape route in pce, screenshot both, fail if structural diff. |
| 11 | Dead-link audit (2026-05-10) doesn't trace through variable assignments — `router.push(drilldownHref)` not caught | Regex matches literals only, not variable-defined templates | ⏳ partial | Refine `scripts/dead-link-audit.py` to follow `const X = \`...\`` declarations. Limitation noted. |

## How to use this file

1. **Before claiming an audit is clean:** open this file. Scan for blind spots that overlap your audit. If your audit doesn't cover them, your "clean" is partial.

2. **When a new failure surfaces:** add a row. Don't fix silently.

3. **When a workaround ships:** mark `✅ shipped` and link to the script / commit / rule.

4. **At the end of every architectural session:** read this file once. Have any of the blind spots converted from `❌ owed` to `✅ shipped`? If not, are we sure we did real work?

## What this is NOT

- A list of bugs in the product. Those go in issue trackers.
- A list of TODOs. TODOs are scoped work. These are systematic patterns.
- Something to make me feel better. The point is the opposite — track real failures so they don't quietly recur.
