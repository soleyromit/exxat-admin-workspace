# Onboarding Pattern Rubric

> Binds workspace ADR-002 (LMS-integration-first default).
> Onboarding is one-time; design for the "I'll never see this again" reality. No five-step welcome tours.

---

## The three onboarding moments

| Moment | When | Pattern |
|---|---|---|
| **First-run school config** | Admin sets up the school's instance | (P3) `lms-toggle-first-run.md` — central decision: LMS on or off |
| **First-visit per persona** | A faculty / student lands on a module they haven't used | Persona-tier landing should be self-explaining (no overlay tour required) |
| **First-use per feature** | New surface within an established product | Inline coach mark (DS `CoachMark` component) — see DS docs |

---

## The LMS toggle is the keystone

Per ADR-002, every new module assumes LMS-integration-on. The school admin's first-run decision flips that assumption. Every downstream onboarding moment depends on this:

- LMS-on schools → roster sync is automatic, manual add controls disabled, faculty land on a populated state
- LMS-off schools → admin must populate master lists, faculty land on empty state with admin-action prompts

`lms-toggle-first-run.md` covers the school-level toggle UI.

---

## Welcome-tour rule

**Don't.** No five-step "welcome to Exam Management" overlay tours. Reasoning:

- Users dismiss them, then can't find them again
- They become outdated faster than the underlying UI
- They don't replace good IA — if a screen needs a tour to be understandable, the screen is wrong

**Use instead:**
- Self-explaining empty states (CONTENT-002)
- Inline DS `CoachMark` for one-off "did you know" moments
- Documentation links in context, not modal walkthroughs

---

## Anti-patterns

- ❌ Multi-step welcome tour overlay
- ❌ Tooltip-on-load that the user must dismiss
- ❌ "Take the tour" prompt on every login until dismissed
- ❌ First-run flows that block product use until completed
- ❌ Nested onboarding (school onboarding → admin onboarding → faculty onboarding) — collapse into one decision per moment

## Pattern catalogue (this folder)

P3 (this round):
- `lms-toggle-first-run.md` — school-level LMS-on/off decision (ADR-002)

P4+ (later): `coach-mark-feature-intro.md`, `empty-state-as-onboarding.md`
