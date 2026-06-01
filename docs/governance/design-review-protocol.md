# Design Review Protocol — Sequential, Non-Negotiable

> Every UI-touching change follows this exact sequence. Not optional, not abbreviated.
> **Romit directive (2026-05-22):** compliance check + transcript check against every design, WCAG 2.1 AA, reading granola notes + MD files + prior prompts as sequential action.
> **Pairs with:** `docs/governance/design-anti-patterns.md`, `docs/governance/component-consistency.md`, `docs/governance/verification-discipline.md`

---

## Pre-task declaration (BEFORE Gate 1 — required for every file touch)

Before writing a single character of code, output this block:

```
File: <path>
Current DS violations: [list each — raw button, hardcoded color, etc. — or "none found"]
Hand-rolled with DS equivalent: [e.g. local DataTable copy → import from @exxatdesignux/ui]
WCAG issues (static read): [missing aria-hidden, aria-label gaps, etc. — or "none found"]
```

**Why this exists (Pattern J — 2026-06-01):** Starting edits without anchoring to the current file state causes hallucination about what was there before, misses existing violations, and makes "done" claims unverifiable. This block is the anchor.

If the file is new: write `new file — no pre-existing violations`.

---

## Gate 1 — Pre-Design Context Pull (BEFORE writing any JSX)

Run ALL of these before writing a single line of component code.

### 1a. Granola transcript query

```
query_granola_meetings(
  query: "<entity or feature being built>",
  participants: ["Aarti", "Vishaka", "Nipun"],   // adjust per context
  days_back: 30
)
```

If hits found: pull raw transcript with `get_meeting_transcript`. Extract:
- Product decisions (what Aarti/Vishaka explicitly said about this entity/feature)
- Scope constraints ("this is Phase 1 only", "don't include X")
- UX directives ("single line like Google search", "course-centric")
- Any pending open questions

**Do NOT use summary — always use raw transcript.** Per memory `feedback_granola_raw_transcripts.md`.

If no Granola hits: note this explicitly. Do not silently skip.

### 1b. Pattern docs — mandatory reads

Read ALL of these for the active product before any UI work:

| Doc | What it gates |
|---|---|
| `apps/<product>/docs/patterns/<product>-ui-patterns.md` | Per-product header shell, DataTable conventions, empty state formula, DS component map |
| `docs/governance/design-anti-patterns.md` | Banned patterns — uppercase tracking-wide, color-mix selection states, rounded-lg cards, py-20 generic empty states |
| `docs/governance/component-consistency.md` | Sidebar toggle, toolbarSlot requirement, Search conventions, Sheet/Dialog conventions |

### 1c. DS component check

Before importing any component, confirm it exists in `docs/watch/ds-snapshot.json`:
- Exact import path
- All available variants and sizes
- What DS already handles (don't re-implement)

If building a new component file: spawn `ds-adoption-reviewer` subagent.

### 1d. Storytelling fit check

For the active product, verify:
- Does this feature appear in Aarti's mental model? Check `apps/<product>/docs/storytelling/aarti-perspective.md` if present
- Does this violate any scope constraint from recent ADRs? Check `apps/<product>/docs/decisions/`
- Does this match the product's `experience-principles.md`?

---

## Gate 2 — Post-Design Compliance (AFTER every UI-touching change, before claiming done)

Run ALL of these in sequence. Do not claim the change is done until every gate returns PASS or explicit acknowledgment of known gap.

### 2a. Self-review against 10-point checklist

From `docs/governance/component-consistency.md §10`:

```
□ SiteHeader (EM) or inline header with SidebarTrigger (PCE) present?
□ toolbarSlot with row count on every DataTable?
□ emptyState prop provided and entity-specific?
□ selectable on all list page DataTables?
□ External SearchInput (EM) or searchable prop (PCE)?
□ Sheet uses showOverlay={false} + showCloseButton={false}?
□ No toast() — LocalBanner only?
□ No uppercase tracking-wide more than once per screen?
□ No raw <button> — DS Button with variant + size?
□ All FA icons aria-hidden="true"; icon-only buttons have aria-label?
```

### 2b. Transcript alignment cross-check

Cross-reference the design decisions made in Gate 2 against the Granola transcripts pulled in Gate 1a.

For each design decision, ask:
- Does this match what was discussed? (Feature present in transcript = match)
- Is this contradicted? (Transcript says "no X" but we built X = block)
- Is this unaddressed? (No transcript mention = note as assumption, not block)

Output format:
```
Transcript alignment:
✅ Single-search-bar pattern — Aarti: "single line like Google search" (May 13)
✅ No filter controls — Aarti: "I don't want filters and grid and everything" (May 13)
⚠ Term filter chip — not in transcript; added per BASE-ENTITIES.md convention
❌ Progress bar for completion — Aarti: "no bars in tables" (May 19/20)
```

### 2c. WCAG 2.1 AA compliance — visual-check runner + `compliance-reviewer`

> **Pattern I (2026-06-01):** Paste the subagent's literal first line of output — "GREENLIGHT" or "NEEDS-MORE: [first violation]". Claiming "I ran compliance-reviewer" without pasting output = not run.

**Step 1 — Run the visual-check tools** (requires dev server at the product's port):

```bash
# PCE admin (port 3005)
node tools/visual-check/run.mjs              # default-state screenshots + axe
node tools/visual-check/interactions.mjs     # 12 interaction states per route

# Exam management admin (port 3001)
BASE_URL=http://localhost:3001 node tools/visual-check/run.mjs /students /faculty /courses
BASE_URL=http://localhost:3001 node tools/visual-check/interactions.mjs /students
```

Results land in `/tmp/visual-check/` (static) and `/tmp/visual-check/interactions/` (interaction states).

**Step 2 — Spawn `visual-review` subagent** to analyze the screenshots + axe output.

**Step 3 — Spawn `compliance-reviewer`** for static code analysis. It checks:
- Contrast ratios (text ≥4.5:1, UI ≥3:1, focus rings ≥3:1)
- Touch targets (≥44px on mobile — `icon-sm` is at risk)
- `aria-hidden="true"` on all FA icons
- `aria-label` on all icon-only Buttons
- Form fields: visible label + `aria-required` + `aria-invalid` + `FieldError`
- Skip links present on pages with substantial content
- Heading hierarchy (no h2 → h4 jumps)
- `role="status"` + `aria-live="polite"` on dynamic count changes

The subagent returns GREENLIGHT or NEEDS-MORE. A NEEDS-MORE blocks the claim of done.

### 2d. FERPA / HIPAA check (PCE only)

From PCE `pce-ui-patterns.md §9-10`:
- No student identifier + response text in same rendered component
- Free-text clinical responses never displayed outside moderation screen
- No student names linked to answers in any export path
- Clinical survey templates cannot include patient name/DOB/MRN fields

If any of these are violated: block the change. Do NOT claim done.

### 2e. State coverage — spawn `state-review`

For any page that fetches async data, renders a list/grid, or accepts form input:
- Loading state handled?
- Empty state entity-specific (not generic "No results")?
- Error state surfaced to user?
- Validation state (aria-invalid + FieldError) on all required fields?
- Disabled state via DS prop (not opacity)?
- Focus state visible at all interactive elements?

Spawn the `state-review` subagent. NEEDS-MORE blocks the claim of done.

### 2f. Verification patterns — spawn `verification-reviewer`

The `verification-reviewer` applies Patterns A-F from `docs/governance/verification-discipline.md`:
- A: "Clean" ≠ "fine" — state what was and wasn't checked
- B: Fix the class of bug everywhere, not just the reported instance
- C: Enumerate full scope before starting
- D: Compare against canonical (import ≠ correct use)
- E: Adversarial self-review of own recent changes
- F: State coverage (loading/empty/error/validation/submission/disabled/focus)

Returns GREENLIGHT or NEEDS-MORE. NEEDS-MORE adds discipline log entry.

### 2g. Anti-pattern scan

Grep the changed files for banned patterns:

```bash
# Workspace-wide bans
grep -n "uppercase tracking-wide\|rounded-lg border border-border bg-card\|px-3 py-2.5\|color-mix(in oklch" <changed-files>

# Exam-management only (PCE canonical empty state uses py-20 text-center per pce-ui-patterns.md §4)
if exam-management: grep -n "py-20 text-center" <changed-files>
```

Any hits = violation. Fix before claiming done.

**PCE exception:** `py-20 text-center` is the canonical PCE empty state pattern (defined in `apps/pce/docs/patterns/pce-ui-patterns.md §4`). Do NOT flag it in PCE files.

### 2h. Self-reflection (end of every response)

3-5 bullets:
- What did I do well in this design?
- What mistakes or near-misses occurred?
- What would I check next time that I skimmed this time?

Per memory `feedback_end_of_response_reflection.md`.

---

## Shortcut trigger map

| User phrase | Gate sequence |
|---|---|
| "build a page for X" | ALL gates: 1a → 1b → 1c → 1d → [build] → 2a → 2b → 2c → 2d (PCE) → 2e → 2f → 2g → 2h |
| "update the design" | Skip 1c/1d if no new components. Run all post gates. |
| "fix this UI" | Skip pre-gates. Run 2a → 2b → 2c → 2e → 2f → 2g → 2h |
| "add a column / field" | Run 2a → 2c → 2g → 2h at minimum |
| "does this look right" | Run design-critique skill + 2b (transcript alignment) |

---

## What blocks a "done" claim

Any of these means the change is NOT done:
- `compliance-reviewer` returns NEEDS-MORE
- `state-review` returns NEEDS-MORE
- `verification-reviewer` returns NEEDS-MORE
- Transcript alignment shows ❌ (implementation contradicts transcript)
- Anti-pattern scan hits banned patterns
- FERPA/HIPAA violation found (PCE)

A NEEDS-MORE with a known, documented exception (override ADR written) = acceptable with the ADR cited.

---

## Document map — what to read when

| Situation | Read |
|---|---|
| Building any list page | `component-consistency.md` §2 (DataTable), §4 (Search) |
| Building a form / sheet | `component-consistency.md` §6 (Sheet), §7 (Dialog) |
| Building any chart/viz | `design-anti-patterns.md` §Progress & Viz + VIZ-001..005 |
| Referencing a product decision | Pull Granola transcript — never use summaries |
| Building exam-management UI | `apps/exam-management/docs/patterns/ui-patterns.md` |
| Building PCE UI | `apps/pce/docs/patterns/pce-ui-patterns.md` |
| Building portal UI | `docs/BASE-ENTITIES.md` + `docs/CLAUDE-DS-REFERENCE.md` |
| Any new component file | `ds-adoption-reviewer` subagent first |
| Claiming a change done | `verification-reviewer` + `compliance-reviewer` + `state-review` |

---

## Source

- Romit directive: 2026-05-22 — "compliance check, transcript checks against any design you make as part of the sequential action so that it's WCAG 2.1 AA compliant and ensures you have taken everything into consideration by reading through granola notes, any corresponding md files, and any current or previous prompts containing pasted information"
- Infrastructure: existing `compliance-reviewer`, `verification-reviewer`, `state-review`, `visual-review` subagents; `intake`, `design-critique` skills
- Verification discipline: `docs/governance/verification-discipline.md` Patterns A-F
