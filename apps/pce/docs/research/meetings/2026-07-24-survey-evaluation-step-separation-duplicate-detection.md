---
type: meeting
date: 2026-07-24
product: pce
participants: [Romit Soley, Monil]
source: granola
granola_id: 10d48960-e5e8-4346-98cb-820bf2db1415
---

# Survey evaluation workflow — step separation and duplicate detection — 2026-07-24

**Date:** 2026-07-24 4:50 AM EDT
**Participants:** Romit (Microphone), Monil (Speaker)

---

## Topics covered

1. Step architecture for "Setup Evaluations" wizard — reversal of combined-step approach (T124)
2. Rationale for re-separating Step 1 (courses) and Step 2 (templates + faculty + duplicate detection)
3. Soft duplicate detection: design for the case where a faculty member is already being evaluated in a live survey
4. Duplicate detection criteria: (course_offering_id + faculty_role_type + person_id) triplet
5. Hard block vs. soft warning decision for duplicates

---

## Topics covered (detail)

### Step separation rationale
The combined-step design (T124) was reviewed internally by Monil + team and found to ask too many user actions in one view:
1. Selecting courses
2. Identifying missing students
3. Identifying which template to assign
4. Assigning missing faculty associations

Separating distributes the cognitive load and maps to distinct user intent: "Step 1 is just selection and validation. Step 2 is template assignment and role gaps."

**New 4-step structure confirmed:**
- Step 1: Course selection only — identify courses with zero students (hard block indicator, backend only)
- Step 2: Template assignment per course + missing faculty association + soft duplicate warning
- Step 3: Communication
- Step 4: Review/summary — shows courses, type, template, evaluation window, student count, evaluity count

### Duplicate detection design
Scenario: Admin evaluates "NUR 101 / Instructor / Monil" in Spring. Later adds Romit as a second instructor and re-enters the setup wizard with the same template. The system must recognize that "NUR 101 / Instructor / Monil" is already live.

**Uniqueness triplet:** (course_offering_id + faculty_role_type + person_id). A second survey for the same triplet = duplicate.

**Decision: soft warning, not hard block.** Reasoning: If we hard-block and a school legitimately wants mid-course + end-of-course evals, the system would break. Soft warning is reversible. "Blocking and then user raising a support ticket and that support ticket becomes a P0 because they have to push a survey and they're not able to — then we have to change code very quickly. But soft warning is like they know that they're making a mistake."

**Warning placement: Step 2.** Cannot surface in Step 1 because Step 1 doesn't know about evaluatees until the template is selected in Step 2.

**Review step (Step 4) behavior:** If admin accepted the soft warning and decided to proceed, show a consent acknowledgment at Step 4 as well ("I understand this re-evaluates Monil for NUR 101 / Instructor"). 

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0724_01 | **T124 REVERSED — combined step is NOT the direction.** Internal review: "this screen is asking for too many actions." Step 1 and Step 2 are SEPARATE. Step 1 = courses only. Step 2 = template assignment + missing faculty + duplicate warning. Supersedes T124 (combined step) AND T49 step names. | pce | T124 SUPERSEDED, T49, T129 |
| D_PCE_0724_02 | **"What to evaluate" field REMOVED from Step 1.** It was previously a selector in Step 1. Now entirely removed — evaluatees are derived from the template selected in Step 2. "We are removing that 'what to evaluate' field from step one and it will be derived from whatever templates you assign." | pce | T110 SUPERSEDED, T129 |
| D_PCE_0724_03 | **Soft duplicate warning in Step 2.** Unique key = (course_offering_id + faculty_role_type + person_id). If this triplet already exists in a live survey, show inline soft warning in Step 2 row. Admin can uncheck that evaluatee to skip re-evaluation. Hard block is NOT the approach. | pce | T130 |
| D_PCE_0724_04 | **Duplicate consent surfaced again in Step 4.** If admin accepted a duplicate warning in Step 2 and chose to proceed, the review step (Step 4) must surface a consent acknowledgment before the final push. "We just ask again and they have to give a consent that I understand." | pce | T130 |
| D_PCE_0724_05 | **Step 1 only shows zero-student hard block (backend).** No other status is shown in Step 1. If a course has active evaluations, that only surfaces in Step 2. "In first step you cannot show it — in second step you have to show." | pce | D_PCE_0720B_05 |

---

## Verbatim Monil quotes

> "We are removing that 'what to evaluate' field from step one and it will be derived from whatever templates you assign."

> "We are going back — we are going to separate courses as one step and assignment of templates, missing faculty association as step two, and step three would be communication."

> "This screen is asking for too many actions. There are four actions that the user has to perform: first is selecting courses, then based on courses identifying missing students, and then identifying what templates to use, and then based on template assigning missing faculty. So from user expectation it will be too much."

> "Let's not go with hard block — let's keep it as soft warning. Tomorrow when we have more data, when users use it and there is a requirement that hey this is getting complicated, we never reevaluate any person — then we can take it as a hard block. Right now what I'm asking for is just a soft warning in the UI."

> "It's a combination of these three things [course_offering_id + faculty_role_type + person_id]. These three things can only exist once in the database."

> "Just to summarize: two things — one is separating step one into step one and step two, and another is how to show this soft warning if such situation arises."

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T129 | Setup evaluations wizard: 4 separate steps — courses / template+faculty+duplicate / communication / review | P0 — DESIGN-REVIEW + SUPERSEDES T124 | Full structural rearchitecture. Reverses combined-step (T124). Step 2 must include: template picker per course, missing faculty indicator, soft duplicate inline warning per evaluatee row. |
| T130 | Soft duplicate warning in Step 2 — per evaluatee row flag when triplet (course_offering_id + faculty_role_type + person_id) already exists in a live survey | P1 — DESIGN-REVIEW | Warning must allow admin to uncheck/skip that evaluatee. Consent re-surfaced in Step 4 if admin proceeds past warning. Hard block explicitly NOT the direction. |

See backlog update below for full task entries.
