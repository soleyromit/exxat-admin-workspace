---
name: exxat-ux-audit
description: >-
  Audit an EXISTING Exxat DS surface (route, file, component, customer-app
  path, or screenshot) against the senior-UX principles (P1–P20), modern SaaS
  patterns (M1–M12), and binding DS rules. Produces a structured findings
  report with Blocker / Issue / Nit severity, code citations, and a fix plan
  — and offers to auto-apply text-only Blocker fixes. Load when the user asks
  "audit X", "review the X page", "is this following DS?", "what's wrong with
  this screen", "do a UX review", or pastes a route URL with a problem.
user-invocable: true
---

# Exxat DS — UX audit (review existing design)

Companion to [`exxat-senior-ux/SKILL.md`](../exxat-senior-ux/SKILL.md). Where
senior-UX is **forward-looking** (design before code), this skill is
**backward-looking** (grade what already exists).

## When to load this skill (not senior-UX)

| Cue | Use this |
|-----|----------|
| "audit `/students/[id]`" / "review this page" / "what's wrong with X" | ✓ |
| "is this following the DS rules?" / "does this match Library?" | ✓ |
| User pastes a route URL with a symptom ("duplicate breadcrumb here") | ✓ |
| "find all the issues on the placements detail" | ✓ |
| PR review of a hub / detail / wizard already in code | ✓ |
| **"design a new X"** / "build a settings page" | ✗ — use `exxat-senior-ux` |

If both apply (e.g. "audit and rebuild"), do the audit first, then switch.

## The audit protocol (4 phases)

### 1. Locate — find the surface

Accept any of:

- **Route path:** `/students/[id]` → resolve to `app/(app)/students/[id]/page.tsx` and walk its imported client / component tree.
- **File path:** `components/student-details.tsx` (relative or absolute, monorepo OR customer app like `../test-9/...`).
- **Component name:** `StudentDetails` → grep for the export.
- **Screenshot:** extract IA from the image (per `exxat-no-image-pixel-copy.mdc`), then run the audit against the rendered source if available; otherwise report against the IA alone.

State the resolved entry point in the report so the user can verify scope.

### 2. Grade — run the 10-dimension pass

Walk all ten in order. Each dimension has concrete grep / Read signals listed
in §"Grep cheatsheet" below.

| # | Dimension | Source of truth |
|---|-----------|-----------------|
| 1 | **Navigation integrity** | P1, P2 + `exxat-breadcrumbs-no-back.mdc` |
| 2 | **Action hierarchy** | P3 + `exxat-page-header-actions.mdc` |
| 3 | **States (empty / error / loading)** | P5 + M8, M9 |
| 4 | **Keyboard + a11y** | P6, P7 + `exxat-accessibility.mdc`, `exxat-kbd-shortcuts.mdc` |
| 5 | **DS composition (no forks)** | P8 + `exxat-reuse-before-custom.mdc`, `exxat-data-tables.mdc`, `exxat-tabs-chrome.mdc`, `exxat-no-vaul.mdc`, `exxat-no-toast.mdc` |
| 6 | **Modern pattern adherence** | M1–M12 (`modern-saas-patterns.md`) |
| 7 | **Voice & tone** | `docs/voice-and-tone.md` + P9 |
| 8 | **Job alignment (IA shape)** | The relevant `docs/jobs/*.md` |
| 9 | **Token + SLDS discipline** | `exxat-token-discipline.mdc`, `exxat-no-slds-leakage.mdc`, `exxat-no-hex-color` lint rule |
| 10 | **Hub-specific (only if a hub)** | `exxat-data-tables.mdc`, `exxat-hub-supported-views.mdc`, `exxat-centralized-list-dataset.mdc`, `exxat-list-page-connected-views.mdc` |

### 3. Cite — every finding points at code

For each finding, capture:

- **Code reference** — file path + line numbers using the CODE REFERENCES
  block format from the editor (see citing_code rules).
- **Principle / pattern / rule** — `(P1)` or `(M4)` or `(exxat-no-toast.mdc)`.
- **Why it matters** — one sentence in plain language.
- **Fix** — concrete suggestion. For Blockers, the exact edit if possible.

**Never** report a finding without a code citation or, for screenshots, a
specific element of the IA. Vague findings ("status is unclear") are useless.

### 4. Report — markdown, in chat, in this exact shape

```
# UX audit: <entry point>

## Summary
**Status:** N blockers · N issues · N nits
**Job match:** <doc name> — ~X% alignment.
**Scope:** <files walked>

## Blockers (P1–P8 violations — fix before shipping)
### B1. <Title> (P<x>)
- **Where:** `<file>:<lines>`
- **What:** <one-sentence symptom>
- **Why:** <one-sentence rationale>
- **Fix:** <concrete edit>

## Issues (P9–P20 / Mx violations without stated reason)
### I1. <Title> (P<x> | M<x> | exxat-<rule>.mdc)
- **Where:** ...
- **What:** ...
- **Fix:** ...

## Nits (preferences / minor modern-anti-pattern signals)
### N1. <Title>
- ...

## What's working
- <Positive finding with citation>
- ...

## Fix plan
1. <Highest-impact Blocker fix>
2. ...
N. <Lowest-priority Nit>

## Next action
> Want me to apply the text-only Blocker fixes (B1, B2) now? Issues and Nits
> I'll leave for you to review.
```

Always close with the **Next action** line so the user has one click forward.

## Severity rubric — read this before you label anything

### Blocker (B) — violates P1–P8 (always-follow)
Anything that ships as a bug. Examples:
- Duplicate way-back (breadcrumb + "Back to" button) — **P1**
- Record name as breadcrumb leaf + `PageHeader.title` + body `<h1>` — **P2**
- Two filled CTAs in the header — **P3**
- Missing `DialogTitle` / `SheetTitle` (even `sr-only`) — **P7**
- Contrast < 4.5:1 on body text — **P7**
- Touch target < 24×24 — **P7**
- Mouse-only action with no keyboard equivalent — **P6**
- No empty / error / loading state shipped for a list or detail — **P5**
- New shared primitive forked from `ui/`, `components/data-views/` or `templates/` without proof of ≥ 2 use cases — **P8**
- Pixel-copy of a competitor screenshot — **P4**

### Issue (I) — violates P9–P20 / Mx without a stated reason
Costly but not a bug. Examples:
- `toast()` for product feedback — **`exxat-no-toast.mdc`** / M6
- `vaul` import — **`exxat-no-vaul.mdc`**
- `TabsList` stretched full-width — **`exxat-tabs-chrome.mdc`** / M1
- Centered modal dialog where a `Sheet` would keep context — **M3 / `exxat-drawer-vs-dialog.mdc`**
- Status only in body, hidden from list / breadcrumb — **M4 / P13**
- Spinner overlay on initial load instead of `Skeleton` — **M9**
- Edit-bounces-to-form for a single field — **M5 / P15**
- Raw `<table>` or third-party data grid on a hub — **`exxat-data-tables.mdc`**
- Forked allow-list narrower than `FULL_HUB_SUPPORTED_VIEWS` without comment — **`exxat-hub-supported-views.mdc`**
- KPI strip with > 4 tiles — **`exxat-kpi-max-four.mdc`**
- `MetricItem` with wrong `trendPolarity` (up arrow on a "lower-is-better" metric) — **`exxat-kpi-trends.mdc`**

### Nit (N) — preferences / minor signals
Worth noting, not worth blocking. Examples:
- Missing `<Kbd>` hint on a primary CTA — **`exxat-kbd-shortcuts.mdc`**
- Color-only status communication without an icon or label — **M4 secondary**
- Empty-state copy doesn't match `voice-and-tone.md`
- Sparse density on a daily-power-user surface — **P14**
- No activity timeline on a record that changes over time — **M7**

If you can't decide between two tiers, pick the **lower** severity (Issue over
Blocker; Nit over Issue) and explain why. Over-flagging Blockers makes the
report ignorable.

## The 10-dimension grep cheatsheet

Use these as starting signals. Read the file before grading — greps surface
candidates, not verdicts.

### D1 — Navigation integrity

| Signal | What it might mean |
|--------|---------------------|
| `Back to` near a `SiteHeader.*breadcrumbs` in the same client | **B1: P1** duplicate way-back |
| `breadcrumbs` array whose last item label equals the `title` prop | **B2: P2** duplicate identity |
| `<h1>` inside a body component below a `PageHeader` | **B3: P2** duplicate H1 |

### D2 — Action hierarchy

| Signal | What it might mean |
|--------|---------------------|
| Two adjacent `Button variant="default"` in the actions slot | **B: P3** two primaries |
| Hand-built `<button>` in `PageHeader.actions` instead of DS `Button` | **I: `exxat-page-header-actions.mdc`** |

### D3 — States

| Signal | What it might mean |
|--------|---------------------|
| No `Skeleton` / Suspense boundary in a route loading path | **I: M9** spinner-on-load |
| Hub `renderEmpty` missing on a `ListPageTemplate` | **B: P5** |
| `<Spinner` / `animate-spin` overlay covering initial load | **I: M9** |

### D4 — Keyboard + a11y

| Signal | What it might mean |
|--------|---------------------|
| Icon-only `<Button>` without `aria-label` | **B: P7** |
| `DialogTitle` / `SheetTitle` missing on an overlay | **B: P7** |
| `role="tablist"` containing `role="button"` / `aria-haspopup` children | **B: `exxat-accessibility.mdc`** |
| Workflow primary button without `Kbd` + `Shortcut` (form/sheet/dialog) | **I: `exxat-kbd-shortcuts.mdc`** |
| Bare `<table>` in product hub | **B: `exxat-data-tables.mdc`** + **P7** (scope/headers) |

### D5 — DS composition (no forks)

| Signal | What it might mean |
|--------|---------------------|
| `import.*from ['"]sonner` or `toast(` call | **I: `exxat-no-toast.mdc`** |
| `import.*from ['"]vaul` or local `components/ui/drawer` | **I: `exxat-no-vaul.mdc`** |
| `TabsList.*className=['"].*w-full` | **I: `exxat-tabs-chrome.mdc`** |
| `slds-` class names / `<lightning-` elements | **B: `exxat-no-slds-leakage.mdc`** |
| New `ProfileHero` / `RecordHeader` / `EntityHead` component duplicating `PageHeader` | **B: P8** |
| Custom face-rail / avatar group beside `PageHeader collaboration` | **I: `exxat-collaboration-access.mdc`** |

### D6 — Modern pattern adherence

| Signal | What it might mean |
|--------|---------------------|
| Centered `Dialog` for export / properties / invite | **I: M3** (use Sheet) |
| Edit-via-route for single field | **I: M5** (inline edit) |
| Status only on detail (missing from row / board card) | **I: M4** |
| Multi-step compose flow inside a Dialog | **I: M3** (use route at ≥ 3 steps) |
| AI feature auto-runs on record open | **I: M12** |

### D7 — Voice & tone

| Signal | What it might mean |
|--------|---------------------|
| "Persist", "Materialize", "Submit" where "Save" / "Send" fits | **N: P9** |
| Empty state wall-of-text + multiple CTAs | **I: M8** |
| Apologetic / passive copy in errors | **N: voice-and-tone.md** |

### D8 — Job alignment

Read the relevant `docs/jobs/*.md` and grade the IA shape against it:

- **Record detail** → identity → status → 2-col card grid → activity. Tabs only if ≥ 4 sections / 20+ fields.
- **List hub** → toolbar / view tabs / `DataTable` / centralized `useTableState`.
- ...

Cite the section number in `jobs/*.md` for any mismatch.

### D9 — Token + SLDS discipline

| Signal | What it might mean |
|--------|---------------------|
| `#[0-9a-fA-F]{3,8}` hex literal in app code | **B: `exxat-token-discipline.mdc`** + ESLint `exxat-ds/no-hex-color` |
| `--slds-*` / `var(--slds-*)` | **B: `exxat-no-slds-leakage.mdc`** |
| `--deprecated-*` or any token marked `deprecated: true` in `tokens/hooks-index.json` | **I: token taxonomy** |

### D10 — Hub-specific (only if the surface IS a hub)

| Signal | What it might mean |
|--------|---------------------|
| `<DataTable>` mounted in `ListPageTemplate.renderContent` instead of `<HubTable>` | **I: `exxat-data-tables.mdc`** |
| Forked mock array per view (table mock + tree mock + board mock) | **I: `exxat-centralized-list-dataset.mdc`** |
| `supportedViewTypes={["table"]}` on a primary hub | **I: `exxat-hub-supported-views.mdc`** |
| `KEY_METRICS_KPI_COUNT_MAX` exceeded (>4 KPIs) | **I: `exxat-kpi-max-four.mdc`** |
| `MetricItem` without `trendPolarity` on lower-is-better metric | **I: `exxat-kpi-trends.mdc`** |

## Auto-fix policy

After the report, propose a **Next action** at the bottom. The default offers
auto-fix on **Blockers** that meet ALL of:

- Edit is **text-only** (no architectural change).
- Edit is **single-file** OR **≤ 3 files** that move in lock-step (e.g. remove
  body Back button + trim breadcrumb array in the client).
- Edit doesn't change **route shape** / **API contract** / **component
  hierarchy**.

Examples of auto-fixable Blockers:

- Remove a redundant "Back to <parent>" button.
- Trim the `breadcrumbs` array to ancestors-only.
- Demote one of two filled CTAs to `variant="outline"`.
- Add a missing `sr-only` `DialogTitle` / `SheetTitle`.
- Replace `<button>` with `<Button>` in a header.

Examples that are **NOT** auto-fixable (propose only, ask first):

- Modal → Sheet conversion (M3) — touches overlay primitives + URL state.
- Route → Sheet conversion (or vice versa) — IA change.
- New job-doc creation when none matches.
- KPI architecture refactor (>4 tiles → flat band + secondary stats).
- Replacing a forked primitive with composition — needs design review.
- Anything that touches > 3 files.

Always wait for a "yes" before applying.

## Push back (same posture as senior-UX)

- Refuse to audit "everything in the repo at once" — request a single surface.
- Don't grade a screenshot as if it were code unless source is provided too.
- Don't over-flag Blockers; lean toward Issue when in doubt.
- If the user wants the **fix plan** without seeing the report, still output
  the report — the report IS the plan's audit trail.

## See also

- [`exxat-senior-ux/SKILL.md`](../exxat-senior-ux/SKILL.md) — the forward
  persona (the §5 self-audit is the seed of this skill)
- [`exxat-ux-principles.mdc`](../../rules/exxat-ux-principles.mdc) — P1–P20
- [`exxat-ux-discovery-protocol.mdc`](../../rules/exxat-ux-discovery-protocol.mdc) — brief gate
- [`modern-saas-patterns.md`](../../../apps/web/docs/modern-saas-patterns.md) — M1–M12
- [`docs/jobs/`](../../../apps/web/docs/jobs/) — job IA references
- [`exxat-token-economy/SKILL.md`](../exxat-token-economy/SKILL.md) — minimum file set per task
- All `exxat-*.mdc` rules — concrete enforcement per pattern
