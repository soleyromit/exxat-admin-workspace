# Journey 3 — Evaluator (Preceptor / Clinical Faculty / Lab Instructor) and Admin Reviewer

**Hat:** UX + interaction. **Prototype screen:** *Preceptor Evaluation* ("the form an evaluator opens from their emailed link") and *Review & Approve*.
Persona anchor: *High-Stress Clinical Preceptor* — **tokenised email link, no password wall, one-screen form, large radios, save per field-change, no sidebar / no app shell** `[exxat-domain-context P3]`. **The prototype shows the evaluator page inside the Prism shell with the admin sidebar** because it is a demo; the shipped surface must be shell-free. `[INFER, consistent with REQ EV-01]`

## Why this journey exists / so what

This is where **authority enters the record**. A friction-heavy preceptor experience means no evidence; a loose one means evidence nobody trusts. The preceptor must never decide *how* a skill is evaluated `[EV-03]`, only record an outcome against the program's criteria.

## Evaluator arc

```
Email link ─▶ Open form (no login, no account) ─▶ See student context (+self-eval) ─▶ Answer per skill ─▶ Comment? ─▶ Submit
                                                                                                                       │
                              told immediately: "counts now" OR "held for administrator approval" ◀────────────────────┘ [EV-07]
```

| # | Step | REQ | PROTO observation |
|---|---|---|---|
| 1 | Receive request by email, open directly | EV-01 | "Evaluations sent" list (demo of mailbox): student, course, requested date, evaluator+role, skill chips, **Open link** |
| 2 | See what the program configured for the skill; cannot alter it | EV-03 | Form header "Evaluate student skills — {student} · {course} · evaluated by {name} (role)"; per skill: "n. Skill — Model · Achievement: …" |
| 3 | See student-supplied details and self-evaluation as context | EV-04 | Block "Supplied by the student"; self-evaluation shown where configured (observed in admin review; not seen on this form for the demo skills) |
| 4 | Complete several skills in one sitting, each with own outcome + feedback | EV-05 | Skills numbered 1, 2…; each has its own controls |
| 5 | Mandatory feedback enforced | EV-06, SC-14 | IV Insertion: "YOUR COMMENT *" "This program requires a comment on this skill."; Foley: "(OPTIONAL)"; **Submit evaluation disabled until all answers + mandatory comment present** (verified) |
| 6 | Told whether it counts or waits | EV-07 | Per-skill badge "Goes to review" before submit; after submit: result table — Skill / Recorded / Qualifies? / Progress / Status ("Held for review · Awaiting review" vs "4/3 qualifying evaluations · Achieved") |

Role validity: preceptor at placement site, faculty, lab instructor; valid roles depend on where the skill was performed `[EV-02]`. Whether roles are a fixed set or program-defined is **OD-06**.

### Evaluator-side observations to question

1. The post-submit table reveals **the student's progress and achievement status** to the evaluator ("4 / 3 qualifying evaluations — Achieved"). REQ says nothing about evaluators seeing achievement. Possible over-disclosure (FERPA / bias). `[INFER]` → raise.
2. Delegator link semantics: `[CALL 09-23]` says "delegator links are always unique" and open a form (FAST). Expiry, reuse, revocation, multi-skill link = **not specified**; notifications/reminders for incomplete evaluations are **out of scope** `[REQ §14]` but practically essential. Flag.
3. QR-code route was mentioned on the call `[CALL 09-23]`; **not in REQ**. Do not design it.

## Reviewer (administrator) arc

```
Open queue ─▶ pick item ─▶ compare self-eval vs evaluator ─▶ expand full responses ─▶ optional note ─▶ Approve | Return
```

| Step | REQ | PROTO |
|---|---|---|
| Queue shows only skills that require approval | AR-01, SC-15 | "Evaluations appear here only for skills where the program turned on administrator review." Cards: student — skill, course · setting (location) · date by evaluator (role), "Qualifies" badge, student-supplied fields, evaluator outcome + comment, self-eval, agreement sentence |
| Agreement | AR-02 | "Student and preceptor recorded different outcomes — worth a conversation before approving." / "recorded the same outcome." |
| Full responses | AR-03 | "See the full responses" (expands per-question responses; observed it reveals the demonstration scale) |
| Note | AR-04 | "REVIEW NOTE — Optional. Kept with the evaluation." |
| Approve / Return | AR-05, AR-06 | Approve button; **Return to preceptor** → banner "Returned IV Insertion for Rina Okonkwo to the preceptor. It does not count until resubmitted." |

### Contradiction to resolve before building

REQ AR-05: *returned … goes back for correction*; RV-01: *student must be able to correct and resend a submission that was returned to them*; PROTO student history: "Returned by the reviewer … please correct and resend" with **Revise and resend** for the **student**. But the admin button reads "Return to preceptor" and the banner says "to the preceptor". Either (a) the student corrects and resends (REQ-consistent) or (b) the preceptor re-does the evaluation. **Choose (a) unless Sankalp says otherwise; fix the label.** Logged as `DEFECT-03` in `07-gaps…`.

## Evaluator/reviewer failure modes

| Failure | Handling |
|---|---|
| Evaluator is unavailable (left clinic) | Student resend to another evaluator `[RV-04]` |
| Evaluator submits blank mandatory comment | Block `[EV-06]` |
| Reviewer sees disagreeing outcomes | Note + decision; both assessments retained `[AR-02, AR-04]` |
| Evaluator's role invalid for setting | Student told why at send time `[ST-08]`, never at evaluator end |

## Moments of truth

1. First tap from email → form renders instantly, no sign-in prompt, readable on a phone.
2. Submit confirmation says "counts / pending approval" (EV-07) — no ambiguity.
3. Reviewer can reach a decision without leaving the queue (AR-01..04 on one card).
