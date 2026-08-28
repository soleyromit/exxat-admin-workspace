# Course Eval Sync Up

**Date:** 2026-08-27
**Participants:** Vishal (product), Romit (design)
**Granola ID:** `ab12472a`
**Context:** Weekly course eval sync. Reviewed the newly-deployed single-cell analytics view results screen, then walked through settings screen structure: evaluation rules, faculty roles, academic calendar, communication, RBAC placeholder.

---

## Key directives

### 1. Remove distribution section from single-cell analytics view results

While reviewing the view results screen (reached via Surveys → View survey → View results), Vishal directed removing the "distribution" chart block — it repeats data already shown elsewhere.

> Vishal: "Then you have distribution. This course program and main perfect. We can remove this now. What do you think? It's repeated information."
> Romit agreed.

**No code found.** The distribution section referenced is part of the recently-deployed single-cell analytics prototype, which has not yet been merged into `apps/pce/admin/`. Added as T238 — apply once file is located.

### 2. Heat map vs accordion — pending design review

Romit has designed two layouts for the section breakdown in the view results screen: an accordion and a heat map.

> Romit: "I have created two different designs — one is this accordion based and one is heat map. I thought that heat map is more compact."
> Vishal: "As we discussed yesterday, let's review this with David and Vishaka and pick the best design out of both of them."

**⚠️ DESIGN-REVIEW REQUIRED.** Do not apply either approach until David + Vishaka review. Added as T239.

### 3. Tooltip to distinguish "my score" vs "program average"

On removing the distribution block, Vishal flagged that the remaining score display needs a tooltip so users can tell apart their score and the program average.

> Vishal: "Just make sure that you add some tooltip kind of a thing so that I know which one is my score and which one is program average."

**No code found** (single-cell analytics prototype not yet merged). Added as T240.

### 4. Settings structure — three tabs: Evaluation Rules | Academic Calendar | Communication

Vishal confirmed the settings screens use three tabs. RBAC grid exists as a placeholder only.

> Vishal: "So overall there would be one tab for evaluation rules, one tab for academic calendar, one tab for communication — three tabs. And what is missing? Okay role access grid is missing... you can keep this as placeholder, nothing to be changed."

**No code found** — settings screens are not yet in `apps/pce/admin/`. Added as T241.

### 5. Evaluation rules — remove "Custom" from frequency dropdown

In the evaluation rules screen, the frequency dropdown has a "Custom" option that should be removed.

> Vishal: "Custom we will not have."

**No code found** — evaluation rules screen not yet in codebase. Added as T242.

### 6. Evaluation rules — score configuration: editable numerics, not serial numbers

The Likert option score mapping (what numeric value each option earns) should be shown as editable numeric fields, not as a serial-number list. User sets these once at onboarding.

> Vishal: "You'll have to make a better view so that user intuitively feels that these are scores. Right now this looks like a serial number... the user can also edit this... they can Define because this is like a configuration that they are making on day one."

**No code found.** Added as T243.

### 7. Faculty roles to evaluate — redesign as scalable flat lookup (15–20 roles)

The current horizontal checkbox design for faculty roles doesn't scale. Prism has ~40 roles; the UI must accommodate a lookup where users select 2–3 from ~15–20 visible.

> Vishal: "This horizontally generally prism has 40 roles so horizontally it cannot scale. You have to think of a design where we can accommodate a lookup of 15–20 roles out of which I only select two roles to be evaluated."
> Vishal: "User is going to see those 15 roles as empty state and out of that the user will select one or two. That is the use case."

Course-type grouping of roles is deferred: "Let's forget course type for now — it will be a flat list."

**⚠️ DESIGN-REVIEW REQUIRED.** Added as T244.

### 8. Communication settings — remove reminder cadence component

The reminder cadence component should be removed from the communication settings screen. It moves to Phase 2.

> Vishal: "Reminder cadence we'll remove it. This will be in phase two."

**No code found.** Added as T245.

### 9. Communication settings — hide schedule and release section (Phase 2)

> Vishal: "Communication schedule and release — we don't need right now. This you can hide. This is in phase two."

**No code found.** Added as T246.

### 10. Rich text editor for email templates — raise with Himanshu

Email template body currently uses plain text input. Romit flagged that Prism supports rich text (bold, italic, font styles) in email templates. Vishal confirmed this needs to go to Himanshu since it's a DS / engineering gap.

> Romit: "In prism we are able to see this [rich text], so why can't I see it in our email template right now."
> Vishal: "If it is there in prism then Vill built it. You can check in exact surveys if exact survey supports it... this feedback you have to give to Himanshu."

**⚠️ ENGINEER FLAG.** Added as T247. Do not attempt to build a custom rich text editor — raise with Himanshu before designing.

### 11. Academic calendar — replicate Prism design, add "Add new term" button

> Vishal: "You've seen academic calendar in prism. You have to replicate the same design — same I would say our design system but replicate the same format. We will give them an add new term capability — it's a button where they can add any term they want."

**No code found.** Added as T248.

---

## Not addressed / deferred

- T209 (column order conflict) / T216 (past-terms table vs. button): not discussed in this session.
- Already-scheduled course filtering in push flow (T196): not discussed.
