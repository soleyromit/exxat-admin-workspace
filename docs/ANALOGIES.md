# Product Analogies Registry

> Curated catalog of UI/interaction patterns from third-party products + our own competitors. Loaded on demand by UserPromptSubmit hook when prompt mentions "analogy", "reference", "like X does", "how does X handle…".
>
> **Reduces hallucination by:** giving design tasks a verified pattern reference instead of re-derivation. Each entry has a source + date + last-verified field. Stale entries are flagged before reuse.

## Schema

| Field | Meaning |
|---|---|
| `id` | Stable `ANALOGY-NNN` |
| `domain` | Interaction domain (question display, bulk ops, navigation, comparison, …) |
| `scope` | `platform` (applies to 2+ products) · `product` (one product, due to unique constraint) |
| `reference` | Third-party product the pattern lives in |
| `pattern` | One-line description of *what* the pattern does and *why it works* |
| `applies_to` | Workspace product IDs from `docs/PRODUCTS.md` |
| `source` | Where the analogy was validated. Honest values: `aarti-perspective.md` · `vishaka-perspective.md` · `<granola-id>` · `<rr-insight-path>` · `well-known-pattern` (only for category-defining UI patterns like Linear's K-bar) · `[INFERENCE]` (educated guess, no source) |
| `date_added` | When this row was added |
| `last_verified` | When source was last re-checked. **Re-verify any row > 90 days old before reuse.** |

## Honest source rules (CRITICAL — don't relax)

- `[INFERENCE]` rows MUST NOT be the sole basis for a design recommendation. They're starting points. Either find a source within the session or flag the limitation in your output.
- `well-known-pattern` is reserved for category-defining UI (Linear command palette, Notion multi-select, ExamSoft cross-out). Don't stretch it to cover "I think most products do this."
- When a row is used in a design recommendation, surface its `source` + `last_verified` to the user so they can judge confidence.

## Registry

| id | domain | scope | reference | pattern | applies_to | source | date_added | last_verified |
|---|---|---|---|---|---|---|---|---|
| ANALOGY-01 | Question display | platform | TypeForm | One question per screen reduces cognitive load on long assessments | `exam-management` | well-known-pattern | 2026-05-09 | 2026-05-09 |
| ANALOGY-02 | Answer elimination | product | ExamSoft | Strikethrough on rejected options reduces working-memory load during MCQ | `exam-management` | aarti-perspective.md (parity discipline) | 2026-05-09 | 2026-05-09 |
| ANALOGY-03 | Form creation | platform | SurveyMonkey, Typeform | Drag-drop builder + live preview sets DCE expectation for self-serve forms | `faas` | [INFERENCE] | 2026-05-09 | 2026-05-09 |
| ANALOGY-04 | Reviewer comparison | platform | Figma | Side-by-side comment mode — comparing without view-switching | `faas`, `exam-management` | [INFERENCE] | 2026-05-09 | 2026-05-09 |
| ANALOGY-05 | Progress / completion | platform | Duolingo, Apple Fitness | Progress ring = non-anxiety completion indicator; works when target is fixed | `exam-management`, `skills-checklist` | well-known-pattern | 2026-05-09 | 2026-05-09 |
| ANALOGY-06 | Command palette | platform | Linear, Raycast, VS Code | ⌘K jump-anywhere — replaces nav traversal in dense admin surfaces | all admin apps | well-known-pattern | 2026-05-09 | 2026-05-09 |
| ANALOGY-07 | Priority / deficiency filter | platform | Linear | Surface critical items via dedicated filter — not full-list scanning | `skills-checklist`, `faas`, `exam-management` | well-known-pattern | 2026-05-09 | 2026-05-09 |
| ANALOGY-08 | Bulk operations | platform | Notion, Linear, Gmail | Multi-select + floating action bar — select N → act once | `exam-management`, `faas`, `skills-checklist` | well-known-pattern | 2026-05-09 | 2026-05-09 |

## Cross-product reuse

The "applies_to" column drives reuse. Before designing a new pattern in any product:

1. Search this registry for the domain
2. If a row exists with this product in `applies_to`, prefer it
3. If a row exists for a sibling product, evaluate whether to add this product to `applies_to` (cross-product principle)
4. If no row exists, propose adding one — fetch from Mobbin MCP if needed → add row → cite in your design output

## Adding a new analogy

When the user references a pattern from a third-party product:

1. **Confirm-before-write** (per INTAKE-002/003 — same discipline as Granola intake)
2. Identify scope: does this apply to 1 product or 2+?
3. Source honestly: name the storytelling file, Granola ID, rr-insight, or mark `well-known-pattern` / `[INFERENCE]`
4. Add row above, dated today
5. Re-link the citing artifact to the row's `id`

## Maintenance

- **Quarterly re-verify:** rows > 90 days old need source re-check before reuse
- **Sunset:** if a third-party product changes its pattern, update or sunset the row (don't silently leave it)
- **Promote to DESIGN.md rule:** if 3+ products use the same analogy, consider promoting it to a workspace pattern in `docs/patterns/<category>/` and a DESIGN.md §4 rule

## Why this registry exists

Per `docs/governance/context-architecture.md` — design hallucination's biggest source is "I think product X does it like this." Registering analogies with sources turns that guess into a verifiable claim. When the source is `[INFERENCE]`, the registry makes that guess *visible to the user* so they can correct it.
