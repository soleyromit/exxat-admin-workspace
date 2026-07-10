# 2026-06-04-aarti-teams — Assessment Lifecycle + Distribution + Monitoring + PCE — June 4, 2026

**Participants:** Aarti (PM), Romit Soley (Designer)
**Source:** Microsoft Teams recording — "Meeting with Romit Soley" · 1h 8m 20s · `/Users/romitsoley/Downloads/Meeting with Romit Soley.docx`
**Product area:** exam-management · pce

---

## User Flows

- **Faculty** creates assessment → edits it → distributes (sets publish date/window/students) → monitors during exam → views stats after
  > "Each assessment will have create, review, distribute, and something like a dashboard or analytics — stats — at least these four steps you are saying."

- **Faculty** accesses assessment list → sees status (published/not yet published + date), scored/timed attributes, applicable students count
  > "If published date is already entered, it will be there. If the published date is not there, the status will say not yet published or something."

- **Faculty/Proctor** monitors live exam → sees how many students started, submitted, still in progress
  > "45 minutes before the exam ends, maybe somebody submits it, 20 minutes before somebody else submits. At that point, it's good for me to see, okay, 18 students have started the exam, 16 have submitted, 2 have not yet submitted."

---

## Design Decisions

- **4-step assessment lifecycle tabs:** Create / Edit → Review (Phase 2) → Distribute → Stats
  > "Each assessment will have create, review, distribute, and something like a dashboard or analytics — stats — at least these four steps you are saying. Yes."
  > **Why:** Gives each lifecycle concern its own dedicated surface; matches how faculty mentally track an assessment's state.

- **Preview ≠ Distribute:** Preview is a standalone action button/CTA, not the Distribute step.
  > "Preview is an option I may exercise. But I'm thinking about how am I publishing it? When, how much time am I giving them? What are my alternative ways?"
  > "All of that is there and preview is an action of that... I don't necessarily think that I am going to, when I'm thinking about delivery, I'm not thinking about preview."

- **Distribute step contains:** publish date + delivery window, who gets it (enrolled students), which QBs are associated, online/offline options
  > "Distribution of the assessment dashboard of an like dashboard, which are the students who are enrolled to this, which question banks have been associated all of this. I think distribution still needs to be part of this."
  > "When are you publishing it? Like when can they download? When can they view it? When can they take the exam? When will the window and how much time do you want to give?"

- **Stats step:** applicable students count vs completed count; pie charts for active assessments at the list level
  > "Stats is like, we understand that the whole analytics part of it, how many students took it. It's applicable to how many students and then how many students have completed it."
  > "Around publish you show it's going to be published to 29 students, and around stats you can show that 28 students actually took it."
  > "The one more idea that I will be adding is you might have seen like those pie charts... So based on like let's say if there are active assessments going on right for that course, then I will show some stats with the list of assessments."

- **Assessment list columns (mandatory):** Assessment name · Status (Published + date OR Not yet published) · Scored attribute · Timed attribute · Applicable student count · Completed count (post-exam)
  > "Scored and timed are, I think, two good attributes."
  > "So it's applicable to X number and these many completed it is a good number."

- **Monitoring (live exam proctoring):** dedicated section/tab for real-time exam tracking — not started / in progress / submitted counts; technical issues flagging
  > "I think it's more of like. Monitoring feature, basically, yeah."
  > "When I'm proctoring it, maybe I'm looking at the dashboard just to say okay, I have still three more students."
  > "I was thinking about the downloading exam issues... when it occurs, we need to show that also here."
  > **Why:** Monitoring is distinct from Stats — Stats is post-exam; Monitoring is live during the exam window.

- **Prism coexistence (architectural):** new React modules and old Prism modules must coexist; no complete island; Himanshu sign-off required
  > "I want to make sure that Prism old modules and new modules can coexist. This is the harder part to do and this is what we need to achieve."
  > "These two things have to coexist today... we cannot reinvent everything."
  > **Why:** Customers still use Prism modules. New modules will slowly merge but transition period requires both to work side by side.

- **Big picture first before phase details:** overall IA and main workflows must be approved before deep-diving into feature nuances
  > "I am not OK with the big picture thinking not happening at all... Once the overall alignment has been achieved, look, this is the landing page, this is the overall setup, these are the main workflows, these are the main capabilities — then we focus on P1."

---

## Review & Approval Workflows

- **Review = Phase 2:** The review/approval workflow step is explicitly deferred. Phase 1 ships without it.
  > "Later we can build in review process because review is like a phase two process. So we're not doing that, but later there could be a link, a way to get to collaborators, a way to review it, all of that. But we'll save that for later."
  > "Like right now we are creating it, then you can go back and edit it, you can preview it, you can publish it."

---

## Section & Collaboration Rules

- **Section-level faculty assignment = Phase 2:** Keep in design/concept but hide the button for Phase 1 rollout
  > "Can you hide that right now, right? Because for like the immediate rollout, we won't be able to accommodate that."
  > "You can create a version that is for phase one... you keep this as your [concept]."

---

## Scope Constraints

- **IN (Phase 1):** Create/edit · Distribute (publish date, window, students, QB associations) · Basic Stats (applicable vs completed counts) · Monitoring (live exam proctoring)
- **DEFERRED to Phase 2:** Review workflow · Collaborator management · Section-level instructor delegation · RBAC sub-roles
- **OUT (Phase 1):** Review status in assessment list · Partial section review submissions
  > "Later we can build in review process because review is like a phase two process."

- **Roles for Phase 1 launch:** Super admin only — no sub-role RBAC differentiation
  > "I am very, very clear from day one that this point will come... to get it launched, I don't want to worry about it [sub-roles]."

---

## Data / Entity Rules

- **Assessment status is derived from publish date:** If publish date is set → status = "Published" + date. If not set → "Not yet published."
  > "If the published date is already entered, it will be there. If the published date is not there, the status will say not yet published."

- **Applicable students count:** comes from enrollment at distribute step. Completed count comes from exam submission data.
  > "Around publish you show it's going to be published to 29 students, and around stats you can show that 28 students actually took it."

- **PCE entities (separate product area):** student data is anonymous (email-link based); admin + faculty are the two roles; student "pending activities" dashboard is lightweight (no username/auth)
  > "All of the data that the students submit in here is anonymous."
  > "The student is really just getting an email to say, click here and finish your survey."

---

## Open Questions

- [ ] What is the exact UI layout for the Distribute step? (dashboard vs. drawer vs. form) — owner: Romit
- [ ] What goes in the Monitoring step UI? (counts + flags + actions) — owner: Romit to propose
- [ ] What pie charts show on the assessment list for active exams? — owner: Romit to propose
- [ ] Cohere booth AB testing scope — owner: Romit + Himanshu post-India trip

---

## Implementation Gaps (vs. current code)

- [ ] 4-step lifecycle tab structure (Create / Review / Distribute / Stats) — current builder has 3 tabs (Details → Build → Review)
- [ ] Review tab = Phase 2; should be hidden/disabled for Phase 1 build
- [ ] Assessment list: publish status column, publish date, scored/timed attribute chips, applicable/completed counts — not built
- [ ] Distribute step: no dedicated distribution UI — publish date is only partially in DetailsStep
- [ ] Stats step: no dedicated post-exam stats page per assessment
- [ ] Monitoring: no live proctoring dashboard
- [ ] Pie charts on assessment list for active exams — not built
