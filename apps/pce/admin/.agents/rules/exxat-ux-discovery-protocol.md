---
description: Exxat DS — STOP before code on any surface design (new, rebuild, redesign, replace); output a design brief and WAIT for user go-ahead
activation: always_on
---

<!-- Synced from .agents/rules/exxat-ux-discovery-protocol.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — UX discovery protocol

## IMAGE ATTACHED — highest priority

If the user's message includes an **image** (screenshot, mockup, legacy UI capture) **and** asks to build, match, redesign, or "make it like this":

1. **Do NOT write code** in this turn — even if the image looks like a complete spec.
2. **Load `exxat-senior-ux`** and post the design brief with **`Image reference (IA only)`**, **`DS mapping`**, and **`Visual chrome: unchanged from DS`** lines.
3. **MUST NOT** use `frontend-design` or any skill whose goal is visual matching — **`exxat-no-image-pixel-copy.md`** wins.

## STOP — read before you write any file

If the user's prompt asks you to **design, create, build, rebuild, redesign,
replace, redo, refresh, modernize, re-imagine, or "make a new version of"**
any **page, route, screen, hub, detail view, wizard, settings section,
dashboard, dialog, sheet, drawer, panel, layout, or significant component**:

1. **Do NOT write code, do NOT edit files, do NOT call edit tools yet.**
2. **Output the design brief** (template below) in chat.
3. **Wait for the user to reply** with `yes` / `proceed` / `ship it` / edits.
4. **Only then** move to implementation.

If your next tool call would be `write_file`, `str_replace`, `create_file`,
or any code-mutating action **and** you have not posted a brief and received
go-ahead, you are violating this rule. **Stop and post the brief.**

## When this gate fires (and when it doesn't)

This gate fires on **any task that decides what a surface should look like
or how it works** — whether the surface exists today or not. Treat
"replace what we have" and "create from scratch" identically — both need a
brief, because both make a design decision.

**Fires (brief required):**

- "Create a new student detail page."
- "Rebuild the dashboard."
- "Redesign the settings screen instead of what we have."
- "Make a new version of the placements table."
- "Replace the current onboarding flow."
- "Build a wizard for adding a site."
- "Design a sheet for inviting collaborators."
- User attaches a screenshot / mockup / Figma link and asks to "build this".

**Does NOT fire (brief not required, edit freely):**

- Single-class restyle of an existing surface that already follows DS rules.
- Copy / label edits.
- Bug fixes (a11y violation, broken state, wrong data).
- Dependency bumps, ESLint passes, type fixes, test-only changes.
- Adding a new column / filter to an *existing* `HubTable` that doesn't
  change the page's IA.

When in doubt, ask: **"Am I deciding what this surface should be?"** Yes →
brief. No → edit.

## MUST

0. **Output the brief, then WAIT.** The brief is a checkpoint, not a
   preamble. Do not bundle the brief and the first file edit in the same
   turn. After posting the brief, end your turn with an explicit
   "Ready to build — confirm or edit." prompt. Resume only on the user's
   next message.
1. **No code without a confirmed brief.** "Confirmed" means the user wrote
   `yes`, `proceed`, `ship it`, `LGTM`, `build it`, accepted edits, or asked
   a follow-up that implies acceptance. Silence is not consent.
2. **Cite a reference.** Every brief names **one repo reference** + **two
   modern SaaS analogues** (Linear / Notion / Stripe / Figma / Vercel /
   Linear / Airtable / Coda / Height / etc.) that solve the same
   **job-to-be-done**. Cite the SaaS analogues by product name + pattern
   codes from `docs/exxat-ds/modern-saas-patterns.md` (e.g.
   `Linear issue detail (M1, M4, M7)`).
3. **Name principles + breaks.** Brief lists the principles applied
   (`exxat-ux-principles.md`) and any deviations with one-sentence reasons.
   **Never-break** principles (P1–P8) cannot be deviated from.
4. **One assumption per gap.** If the user can't or won't answer, state the
   assumption inline; never invent silently.
5. **Sync the brief to the implementation.** PR / commit message references
   the job doc (`docs/exxat-ds/jobs/`) and any principle break.

## MUST NOT

- **Skip the brief because the prompt sounds like a refactor.** "Rebuild",
  "redesign", "replace", "instead of what we have", and "from scratch" are
  design decisions, not refactors. Brief required.
- **Post a brief and then write 8 files in the same turn.** That's not a
  brief — that's a press release. End the turn after the brief.
- Generate files before the brief.
- Ask more than **3** questions in one batch.
- Ask questions whose answer is already in the prompt, the file tree, or
  `docs/exxat-ds/jobs/`.
- Use uploaded screenshots as the implementation spec
  (`exxat-no-image-pixel-copy.md`).
- Plan or say **"match the screenshot"**, **"visual parity"**, or simplify DS
  chrome to mimic an uploaded legacy image.
- Invoke **`frontend-design`** (or similar aesthetic skills) to reproduce upload
  pixels when **`exxat-senior-ux`** + this rule apply — DS mapping wins.
- Treat a feature list as a job. Ask: *what decision does this enable?*

## When the user attaches an image

See **IMAGE ATTACHED — highest priority** above. Sidebar example: legacy screenshot shows 6 nav items → add links in `navigation.tsx`; do not fork `AppSidebar` styling to match the upload.

## Question bank by surface type

Pick **at most 3** questions whose answers change the design. Skip the rest.

### Record / entity detail
1. Who reads this most — power admin (dense, keyboard-first) or occasional
   user (cozy, guided)?
2. How is it reached — list, deep link, notification, search? (Drives
   breadcrumb + back-affordance model.)
3. Section tabs needed, or single-scroll page? (Field count > ~20 or rich
   children → tabs.)

### Hub / list page
1. Dense comparison (table) or visual browse (board / gallery)?
2. Per-record actions, bulk actions, or both?
3. Will users filter / sort / customize columns, or is the view fixed?

### Wizard / compose flow
1. One screen with sections, or multi-step (>3 decisions)?
2. Are intermediate steps savable as drafts?
3. Submit is destructive, or always reversible?

### Settings / preferences
1. User scope (personal), workspace (shared), or both?
2. Search needed (>20 settings) or flat list?
3. Apply-on-change or explicit Save?

### Dashboard / analytics
1. One critical KPI or a comparison set (≤4)?
2. Read at a glance, or drill into details?
3. Time range fixed, or user-controlled?

### Overlay (drawer / dialog / sheet)
1. Does the user need the hub visible behind them? (Yes → sheet; no → route.)
2. Blocking confirmation, or reversible? (Blocking → dialog; reversible → sheet.)
3. Will it grow to ≥3 steps? (Yes → consider route instead.)

## Brief template (copy verbatim)

```
Problem:            <one sentence — the user's pain, not the feature>
User & frequency:   <persona, frequency, expertise>
Job-to-be-done:     <the decision or action this enables>
Pattern:            <route | sheet | dialog | inline> + IA shape
Reference (repo):   <file path>
Reference (modern): <product 1 + Mx>, <product 2 + Mx>
Principles applied: <P-codes from exxat-ux-principles>
Deviations:         <principle + one-sentence reason, or "none">
Out of scope:       <what this does not do, deliberately>
Open questions:     <max 2; ideally 0>
```

## Examples

**Good:**
> Problem: Coordinators can't tell at a glance which students are
> non-compliant before placement.
> User & frequency: Program coordinator, daily, keyboard-first.
> Job-to-be-done: Identify and act on at-risk students in < 30s per record.
> Pattern: route `/students/[id]` + identity row + status row + 2×2 card grid.
> Reference (repo): `components/library-table.tsx` for IA cadence.
> Reference (modern): Linear issue detail (M1, M4, M7); Stripe customer
> record (M4, M11).
> Principles applied: P1, P2, P3, P5, P6, P13, P19.
> Deviations: none.
> Out of scope: inline editing (v2), bulk message (lives on list).
> Open questions: none.

**Bad (silent generate):**
> *Agent writes 4 files without explanation.*

**Bad (vague prompt accepted):**
> User: "make a settings page". *Agent writes generic form.* Should have
> asked: scope (personal/workspace), search needed, apply-on-change vs Save.

## Closing artifact: the design → engineering handoff

When the build is complete (files written, surface working in dev), produce
**one filled-in handoff document** before declaring the task done.

**Template** lives at:

- Workspace: `docs/exxat-ds/templates/handoff.md` (or workspace root if not yet copied — copy from `packages/ui/consumer-extras/templates/handoff.md`)
- Consumer apps (after `exxat-ui sync-extras`): `docs/exxat-ds/templates/handoff.md`

**Fill it in** with the actual primitives, tokens, icons, and shortcuts the
build used. Save the filled copy at:

- `docs/exxat-ds/handoff/<surface-slug>.md` (workspace)
- `docs/exxat-ds/handoff/<surface-slug>.md` (consumer)

Attach the filled handoff to the PR description (or paste inline). The
engineer reads it once, runs `exxat-ui audit <generated-file>` to verify
the floor, and is done.

**MUST sections:** 1 (job-to-be-done), 3 (pattern + IA), 5 (DS components
used), 6 (tokens), 8 (a11y checklist — every box ticked), 11 (keyboard map),
12 (any deviations from P9–P20).

If the handoff is incomplete or hand-wavy, the design task is not finished.

## See also

- `.agents/skills/exxat-senior-ux/SKILL.md` — the persona + full protocol
- `.agents/rules/exxat-ux-principles.md` — principles + when to break
- `docs/exxat-ds/jobs/` — canonical references per job type
- `docs/exxat-ds/modern-saas-patterns.md` — pattern codes (M1–M12)
- `.agents/rules/exxat-no-image-pixel-copy.md` — IA from screenshots only
- **Closing artifact:** `packages/ui/consumer-extras/templates/handoff.md`
