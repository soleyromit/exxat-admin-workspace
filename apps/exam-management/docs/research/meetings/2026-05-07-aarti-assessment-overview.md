---
type: meeting
date: 2026-05-07
time: 16:45 EDT
product: exam-management
participants: [Aarti, Romit]
source: granola
granola_id: b68ede99-005a-44bf-aa3c-001e3753d8d8
---

# 2026-05-07 16:45 — Assessment overview design (completion status, workflow, pop quiz)

> Design review session focused on the course assessment overview page. Aarti pushed back on workflow-first org structure; reframed primary axis as completion status.

## Topics covered

1. Assessment list — primary organizational axis
2. Pre-publication approval workflow — role and placement
3. Assessment card sizing and priority
4. Pop quiz administration concept

## Verbatim Aarti quotes

> "I know Vishakha wants assessment approval to be an important criteria. But that's not my primary thing. So I don't want a lot of it to take up space until we really deploy that feature and we align with the users."

> "A clear way for me to add a new assessment, a clear way for me to see how many assessments I have."

> "You can either decide completion is the main category or closure. According to me, completion is a bigger category."

> "Ongoing or not yet completed is probably your primary concern, and completed is your secondary concern."

> "Anything that's not yet completed is probably your primary concern, and completed is your secondary concern."

> "The only thing that is primary concern is: is it open with the students or is it closed. Not yet scheduled, scheduled. It's open. It's closed."

> "I am personally not a fan of the word live. To me, live means it's actively going on."

> "When the exam is active, it's a one-time thing — it will never go from four to five [outside the exam window]."

## Decisions made

| # | Decision | ADR? |
|---|---|---|
| D1 | Assessment list primary org axis = completion status (Not Scheduled / Scheduled / Ongoing / Completed), NOT workflow/approval status | small |
| D2 | Ongoing = highest priority (card at top). Scheduled = second. Not yet scheduled = third. Completed = compact with stats | small |
| D3 | Approval workflow = secondary side widget — never blocks administer, never drives page organization | yes |
| D4 | Silent gate for approval: faculty can administer pending-approval; system says "just so you know this is still pending approval" | yes (in workspace) |
| D5 | Drop "live" as status vocabulary — use "ongoing" | small |
| D6 | Assessment top counter strip: acts as filter chips (e.g., "7 assessments — 5 completed, 2 scheduled") | small |
| D7 | Pop quiz = lightweight Start/End control on an existing assessment. No separate "Lectures" nav item | yes |
| D8 | In-progress/ongoing assessments are finite windows (timed), not perpetually changing status | small |

## Pop quiz pattern

> "I'm in the lecture. Everybody open up your computers, and I'm going to administer this."

Faculty in a lecture presses **Start** on an assessment → students see it immediately → faculty presses **End** → access closes. This is not a special assessment type — it's a delivery mode on any assessment. No separate "Lectures" section in nav.

## Assessment card design guidance

- **Not yet scheduled + Scheduled** = larger card, primary real-estate (faculty's working concern)
- **Completed** = compact card with stats (past tense; still accessible, lower priority in layout)
- **Ongoing** = prominent alert treatment (something live right now demands attention)

Stats that make sense on cards:
- Not yet scheduled: scheduled window, question count
- Scheduled: countdown, question count, accommodation flags
- Ongoing: student counts (not started / in progress / submitted)
- Completed: score distribution headline, date, response rate

## Approval workflow placement

Approval status (pending / reviewed / changes requested) rendered as:
- **Side widget** with count chips ("5 pending review, 2 reviewed") — NOT a primary org section
- Optional per-card badge — subtle, non-blocking
- "Just so you know, this is still pending approval" inline warning when faculty tries to administer

Quizzes and formative assessments: likely to skip approval entirely. High-stakes exams (finals, summatives): school may operationally require approval but system never hard-blocks.

## Design tasks generated

| Task | Corresponds to backlog |
|---|---|
| Redesign assessment overview with completion as primary axis | T3 / T7 partial |
| Add side widget for approval status | T3 / T7 partial |
| Implement pop quiz Start/End flow | T6 (requires assessment-types doc first) |
