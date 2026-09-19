---
type: meeting
date: 2026-09-18
product: learning-contracts
participants: [Ankit (PM), Katie (social work stakeholder), Kanti (stakeholder), Rohit (engineering), Akash (engineering)]
source: granola
granola_id: de0c85ee-7b90-465e-9b79-bad93a70d022
---

# Learning contract workflow configuration and student view demo — 2026-09-18

**Date:** 2026-09-18 9:44 AM EDT
**Participants:** Ankit (PM, prototype lead), Katie (social work stakeholder, external), Kanti (stakeholder), Rohit (engineering), Akash (engineering, joined briefly)
**Context:** Pre-Cohere conference prototype review. Ankit walked Katie and Kanti through the full admin configuration workflow and student view on the Vercel prototype (lc-walkthrough.vercel.app). Goal: finalize verbiage and validate configuration steps before the Cohere social work session. Deadline: all presentation changes done by Monday.

---

## Topics covered

1. Multi-course scope verbiage for learning contract applicability
2. Configuration step-by-step walkthrough: framework selection → competency/behavior labels → dates/evaluation → policies → rating scale → checkpoints → competency review → summary/preview
3. Student view demo: left-nav competency list, progress bar, edit history, checkpoint journey
4. Field instructor view (same UI, different role)
5. Rohit's GitHub + Claude integration demo for prototype verbiage edits

---

## Decisions

| ID | Decision | Product | ADR |
|---|---|---|---|
| D15 | Multi-course label: change "course" → "course(s)" with subtext "choose one or more courses where this learning contract will be used" | learning-contracts | — |
| D16 | Consistent "label" terminology across all config steps — step 3 used "alias" for standards/substandards rename; must change to "label" everywhere | learning-contracts | — |
| D17 | Remove supporting text on student self-rating toggle — "off the initial form" and "ratings appear on each practice behavior" text must be removed; just show "Student self-rating at checkpoints" with on/off | learning-contracts | — |
| D18 | Reapproval policy label must be explicit: "Reapproval is mandatory when edits are made" | learning-contracts | — |
| D19 | Start/end date + method of evaluation labels must read as admin-configuring-student prompts: "Have students add start dates and end dates" and "Have students add method of evaluation" | learning-contracts | — |
| D20 | Audit log / edit history: always show full timestamp (date + time), not date only | learning-contracts | Refines D2 from 2026-09-03 |
| D21 | Student preview step in config flow must be visually prominent — differentiated from regular config steps (distinct card background or highlighted header) | learning-contracts | — |
| D22 | Remove drag-and-drop competency reorder step from the config workflow — competencies come in order from the framework/program details and should not be reorderable | learning-contracts | — |
| D23 | Checkpoint skip per student (admin action) — admin can skip individual checkpoints for a specific student when placement is disrupted mid-year; students cannot skip checkpoints themselves | learning-contracts | Extends D5 from 2026-09-03 |
| D24 | Analytics/reporting section: deferred — not part of Cohere demo; "still brainstorming" | learning-contracts | — |
| D25 | Ask Leo for task suggestions: keep off/hidden for social work Cohere demo — social work programs are averse to AI-generated task suggestions | learning-contracts | — |
| D26 | Rating scale selection + scoring options should be in the same config step — "club them in the same step" | learning-contracts | FLAG — structural step change |

---

## Verbatim quotes

**Katie on the competency drag-and-drop reorder step:**
> "Yeah, sorry, I think that can be for social work, that can be removed. The competencies are in order, they're numbered… So I think this is unnecessary."

**Katie on the self-rating toggle supporting text:**
> "Can we remove the text that says off the initial form? I don't think that's relevant because the initial form doesn't include any ratings, so that can just be removed… let's remove that descriptive text and just say student self-rating at checkpoints off or on."

**Katie on start date/end date label:**
> "Can we change that language to have students add start dates and end dates and then have students add method of evaluation? Yeah, I'm making it more of a question rather than a statement."

**Kanti on reapproval label:**
> "Let's just say to make that clear, since that is obviously causing some confusion, let's say reapproval is mandatory when edits are made."

**Ankit on audit log timestamp:**
> "If the time really is a big point, yeah, we can include that… if the people are doing it on the same date, then what is back and forth? So if you are always doing timestamp, just include it by default."

**Kanti on student preview prominence:**
> "Can we make this prominent? Because this is something that I would want to focus on, what my students are going to see."

**Katie on Ask Leo for task suggestions:**
> "I'm telling you, if we tell the social workers next week that their students can ask Leo for task ideas, people are gonna hate that. So let's just leave it off for the demo."

**Kanti on analytics/reporting:**
> "We are not going to review that. We will just say that that is still something we are brainstorming."

**Katie on "alias" vs. "label":**
> "I think that's a little bit confusing… label everywhere and they can make it label. Consistent with the language."

**Katie on course scope verbiage:**
> "Can we make it course? Like, can we put like an S in parentheses? And then say like choose one or more courses. Where this learning contract will be used."

---

## Design tasks generated

See `_backlog.md` — T_LC_15 through T_LC_24
