---
name: design-critique
description: Use when user asks for design critique, design review, UX critique, a11y audit, or "what's wrong with this design". Reviews a design (described, screenshot-attached, or implemented as TSX) against the workspace's DESIGN.md §4 rules + DS conformance + WCAG 2.1 AA + the active product's storytelling/perspectives. Reports issues grouped by severity. Read-only — never edits. Mirrors the scope of Anthropic's `design` plugin but routes through OUR rule set instead of generic best-practice.
---

# Design Critique — DS-Aware, Workspace-Scoped

Critique a design against the workspace's actual rules and stakeholder perspectives — not generic best-practice, not the `frontend-design` plugin's "BOLD aesthetic" lens. Identify issues grouped by severity, cite the specific rule each violates, suggest fixes.

## When this skill fires

Triggers (UserPromptSubmit hook):
- "critique this design", "review this design", "audit this UI", "what's wrong with this"
- "is this accessible", "a11y check", "WCAG audit"
- "is this on-brand", "does this match our DS"
- User pastes a screenshot + asks for feedback

If the prompt mentions a specific file path, Read the file first.

## What you critique against

In priority order (cite rule + source for each finding):

### 1. Workspace `/DESIGN.md` §4 (43 rules across 7 categories)

| Family | Rules | Examples of violations |
|---|---|---|
| **DS-001..011** | Component-from-DS-only, no raw HTML, no fabricated APIs | Raw `<button>` instead of DS `<Button variant size>` |
| **A11Y-001..008** | Touch targets, focus rings, contrast, ARIA, color-not-only encoding | Icon-only Button without `aria-label` |
| **VIZ-001..005** | No progress bars (last resort), bullet > pie, no red, viz-first | Progress bar used for non-in-flight metric |
| **CONTENT-001..004** | Tone, terminology consistency, no jargon, action-oriented buttons | "Submit" instead of action verb; "release" instead of "share" |
| **INTAKE-001..004** | (governance, not visual) | (rarely critique-relevant) |
| **I18N-001..003** | Logical properties (`me-1` not `mr-1`), localized number/date formats | `marginRight` instead of `marginInlineEnd` |

### 2. Per-product `apps/<product>/DESIGN.md` extensions

If active product is detected (cwd `/apps/<product>/`), also load that product's DESIGN.md and critique against its specific rules.

### 3. Storytelling / stakeholder fit

For active product, check the design against:
- `apps/<product>/docs/storytelling/aarti-perspective.md` — does this respect Aarti's mental models? (e.g., curricular loop, match-then-extend parity, AI recommends/human decides)
- `apps/<product>/docs/storytelling/vishaka-perspective.md` — does this match Vishaka's workflow realism? (e.g., faculty-conservative, LMS-integration realism)
- `apps/<product>/docs/storytelling/experience-principles.md` — does this honor the product's principles?

### 4. WCAG 2.1 AA contrast + structure

- Contrast: text ≥4.5:1, large text ≥3:1, UI components ≥3:1, focus rings ≥3:1
- Touch targets: ≥44px on mobile (WCAG 2.5.5)
- Form fields: visible label, hint, error
- Headings: hierarchical (no h2 → h4 jumps)
- Focus order: logical, visible

### 5. DS token consistency

- All colors via `var(--token)` — never hex/rgb/oklch literal
- Spacing via DS tokens or Tailwind utilities
- Typography via DS classes — never inline `fontSize`

### 6. Cross-product signal alignment (`docs/RESEARCH-SIGNALS.md`)

If the design touches a Confirmed signal (S-01..S-04), flag any violation:
- S-01 AI-first thinking pattern (AI lane vs Pulled lane visually distinct)
- S-02 LMS-first integration default (admin lists assume LMS sync)
- S-03 Match-then-extend (no dropping ExamSoft features)
- S-04 Persona collapse (no finer than 3 tiers without justification)

## Output format

```
# Design critique — <subject>

Reviewed against:
- /DESIGN.md §4 (43 rules)
- apps/<product>/DESIGN.md (if active)
- apps/<product>/docs/storytelling/* (if active)
- WCAG 2.1 AA
- docs/RESEARCH-SIGNALS.md (Confirmed S-NN)

## Critical issues — block ship
- [DS-007] Raw `<button>` element used. → DS `<Button variant size>`
- [A11Y-001] Icon-only Button missing `aria-label`. → Add aria-label.
- [VIZ-004] Red used in score viz. → Aarti dislikes red in score/rating viz; use amber.

## High — fix before review
- [VIZ-001] Progress bar used for non-in-flight metric. → Bullet with target marker.
- [DS-002] Inline `fontSize: 12` on non-icon element. → `text-xs`.

## Medium — improve
- [CONTENT-001] "Release survey" button label. → "Share survey" (matches Aarti's tone).
- [I18N-001] `marginRight: 4` used. → `marginInlineEnd` or `me-1`.

## Stakeholder fit
- ✅ Respects S-01 AI-first thinking — AI lane visually distinct.
- ⚠ Curricular loop framing missing in step header. Aarti emphasized this 2026-05-07.
- ⚠ Three faculty roles shown — workspace ADR-004 caps at 1 in Phase 1.

## Strengths (preserve)
- Bullet vs target chart pattern correctly applied (VIZ-PATTERN-003).
- Sidebar uses `--brand-tint` correctly.
- Touch targets all ≥44px.

## Sources cited
- /DESIGN.md §4
- apps/<product>/DESIGN.md
- apps/<product>/docs/storytelling/aarti-perspective.md (if active)
- docs/RESEARCH-SIGNALS.md
- docs/patterns/<applicable>/<pattern>.md
```

## What you don't do

- **Don't suggest a redesign.** Critique is "what's wrong"; redesign is the user's call. Only suggest the specific fix per finding.
- **Don't fabricate rule numbers.** Cite real DS-NNN / A11Y-NNN / VIZ-NNN / CONTENT-NNN. If you're unsure of a rule code, look it up in DESIGN.md before citing.
- **Don't recommend pulling in `frontend-design`-style aesthetic critiques** ("more bold", "asymmetric"). That's hostile to our DS — see `claude-practices.md` "Product design with Claude" section.
- **Don't write any code.** This skill is read-only.
- **Don't critique what the user didn't ask about.** Stay scoped to their question.

## Honesty rules

- **Severity matters.** A `--brand-color` typo isn't critical; raw `<button>` is. Get severity right; don't flag everything as critical.
- **Cite sources** for every finding (rule path or storytelling quote). Unsourced critique = noise.
- **Acknowledge strengths** at the end. A pure-negative critique demoralizes; reinforcing what works helps the designer iterate.
- **If you can't critique without seeing the design** (no file path, no screenshot, ambiguous description), ask one clarifying question.

## Telemetry

```bash
python3 -c "import sys; sys.path.insert(0, '/Users/romitsoley/Work/.claude/hooks'); \
  from _telemetry import emit; emit('skill.invocation', skill='design-critique', \
  outcome='<completed|partial|cancelled>', findings_count=<N>)"
```

## Skip the skill when

- The user is asking "how should I design X" — that's intent:design (use brainstorming first)
- The user has already implemented and just wants a sanity check that builds — that's `ds-check`
- The user wants praise for their work — say so, don't pretend to critique

## Why this skill exists

The Anthropic-Verified `design` plugin (claude.com/plugins/design) covers this scope but uses generic best-practice — not our DS rules, not Aarti's mental models, not our 43-rule DESIGN.md. This skill mirrors its scope while routing through OUR specific rule set + stakeholder perspectives. Result: critiques that speak the workspace's language, cite the workspace's rules, and respect the workspace's history.

Documented in `docs/governance/claude-practices.md` under "Product design with Claude."
