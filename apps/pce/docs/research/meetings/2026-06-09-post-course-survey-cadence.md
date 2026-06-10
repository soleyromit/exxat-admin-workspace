---
type: meeting
date: 2026-06-09
product: pce
participants: [Romit Soley, Vishaka, David, Monel]
source: granola
granola_id: 3fd2ac92-2d54-467c-b2be-986290459c1e
---

# Post-Course Survey Cadence Meeting (Bi-Weekly 45 Mins) — 2026-06-09

> Aarti was NOT present in this call but is referenced multiple times. Vishaka, David, and Monel were present. Design review targeting engineering handoff tomorrow (2026-06-10) after Aarti review call.

## Topics covered

- Template builder redesign: creation paths, section management, PDF/Word import
- Survey distribution settings: visibility toggle, anonymous responses, distribution channels
- Reminders configuration
- Results release date handling
- Report access screen scope
- Programmatic survey changes (confirmed: entry point only)
- Two-hour Aarti design review scheduled for 2026-06-10 (engineering handoff day-after)

## Decisions

| ID | Decision | Product | ADR |
|---|---|---|---|
| D_PCE_NC01 | Template creation = 3 mutually exclusive top-level paths: (1) Build new (manual sections + questions), (2) Copy existing (duplicate prior template, new name/metadata), (3) Import from PDF or Word document (system auto-generates draft survey). | pce | — |
| D_PCE_NC02 | PDF/Word import lives at the TOP-LEVEL template screen — NOT buried inside each section. Aarti previously requested this. Keep her preference; do not re-litigate. | pce | — |
| D_PCE_NC03 | "Build new" path: once the user enters a section, go straight into writing questions. No "add from template" or per-section upload inside Build new. Clean, direct. | pce | — |
| D_PCE_NC04 | Multi-select roles for section creation: admin picks all roles at once (multi-select), system creates ONE section per role automatically. No per-role repeat clicks. | pce | — |
| D_PCE_NC05 | Section labels ONLY — remove description text under each label. Labels are pulled from Prism course-level role associations (existing T35). | pce | — |
| D_PCE_NC06 | File upload label: "PDF or Word document" — NOT just "PDF". Calling it PDF-only is confusing (users think they must convert Word first). | pce | — |
| D_PCE_NC07 | KILL section-level "add from template" option. "We already gave them the copy-existing option. For each section, we don't repeat the options. It's making it too complicated." — Vishaka | pce | — |
| D_PCE_NC08 | KILL per-section PDF/Word upload. Document upload belongs ONLY at the top-level creation path. Section-level upload has no use case once top-level PDF creates all sections from one doc. | pce | — |
| D_PCE_NC09 | KILL visibility/privacy toggle on survey distribution. "This whole section is not needed. Visibility, because we are going to control — we are not gonna call it visibility... we are going to have a review and release results workflow." | pce | — |
| D_PCE_NC10 | KILL anonymous responses toggle. By default: anonymous. Always. Just convey the message. Do not ask the admin to toggle it. | pce | — |
| D_PCE_NC11 | Post-course evaluation distribution channel = Exact Prism ONLY. No additional emails, no anonymous link. "General surveys will have three options... but post course evaluation will only have one channel, which is via Exact Prism." | pce | — |
| D_PCE_NC12 | General surveys KEEP all three distribution channels (Prism + additional emails + anonymous link). Only post-course is restricted. | pce | — |
| D_PCE_NC13 | Reminders = multiselect. Counted from CLOSING DATE (not opening date). Messaging must make this explicit. | pce | — |
| D_PCE_NC14 | Results release date: REQUIRED if comment moderation is not built for Phase 1. If no date set, admin must manually release results. Surface this in messaging. "Best practice" note (release after grade submission) is suggested, not mandated. | pce | — |
| D_PCE_NC15 | Term-level date management: bulk-pushed surveys grouped by term (NOT "project"). Changing open/close/release dates at the term level cascades to all instances. Individual course-level overrides still possible. | pce | — |
| D_PCE_NC16 | KILL report access screen for Phase 1. Role-based access handles who sees results. Edge cases (e.g., coordinator seeing TA results) handled manually: admin downloads and emails. "Keep phase one minimalistic to drive adoption." | pce | — |
| D_PCE_NC17 | Programmatic surveys: NO changes to existing survey module UI or backend. Entry point only is changing (combined navigation). Dashboard will gain KPIs and analytics enhancements; table structure stays the same. Push survey flow = production flow (5-step existing flow), NOT the new post-course design. | pce | — |
| D_PCE_NC18 | Prevent duplicate student responses: each student can fill a post-course evaluation survey ONCE per course. Backend enforcement. | pce | — |

## Verbatim quotes

> "This whole section is not needed. Visibility, because we are going to control — we are not gonna call it visibility. We are going to have a review and release results workflow." — Vishaka

> "By default, it would be anonymous. By default, Yes. It has to be anonymous... We should not ask. We'll just convey the message that response is going to be anonymous." — Vishaka

> "Post course evaluation will only have one channel, which is via Exact Prism." — Vishaka

> "I think we should park this. I don't see a use case for this unless [you've documented it]. These are very focused surveys that only students who have experienced these instructors are going to take." — Vishaka (re: anonymous link)

> "We should not have the description. We can just have the labels. Course content, course instructor, and so on. That's a simplified [approach]." — Vishaka

> "I just think it should be more visible sooner, so it's not buried within a section." — David (re: PDF import)

> "So they're mutually exclusive. If they want to build new, they're basically manually creating sections. If they are copying from existing the survey already exists in exact prism, and they are just making a copy... And third is that they have a word or a PDF that they are uploading and the system will create that into a survey for them." — David/Vishaka

> "This is too complicated. Add from template, meaning existing... So now for each section, we don't have to repeat the options. It's making it too complicated." — Vishaka

> "Guideline, we should keep it minimalistic, simple, and clean. Because that is what will give us good adoption and liking in phase one. If we complicate it too much, they will not adopt." — Vishaka

> "So we don't want is don't want the same student taking the same survey for the same course twice." — Vishaka/David

> "The mandatory would need result release date. It cannot be optional. So, yeah, I'm evaluating that. But if if you are going to introduce comment moderation, this can be optional." — Vishaka

> "Instead of that, the better way is we store this entire instance as a project [term]. Can be called Spring 2027 surveys... And when we change the close date, open date, and result release at a parent level, all the respective surveys get updated." — Vishaka

## Design tasks generated

- T60 (pce): Template creation — implement 3 mutually exclusive top-level paths (Build new / Copy existing / Import PDF or Word). Structural change to CreateTemplateSheet. DESIGN-REVIEW — new UI. D_PCE_NC01.
- T61 (pce): PDF/Word import at top-level template screen. Remove per-section upload. Upload at top level → system extracts sections + questions from one document. DESIGN-REVIEW — new flow. D_PCE_NC02, D_PCE_NC08.
- T62 (pce): Multi-select roles for section creation in "Build new" path. System creates one section per selected role. DESIGN-REVIEW — structural change to section creation. D_PCE_NC04.
- T63 (pce): KILL section-level "add from template" option in template editor. Do not build / remove from any in-progress designs. D_PCE_NC07.
- T64 (pce): KILL visibility/privacy toggle in survey distribution flow. Do not build. D_PCE_NC09.
- T65 (pce): KILL anonymous responses toggle. By default anonymous — convey via message only. Do not build toggle. D_PCE_NC10.
- T66 (pce): Post-course distribution: Prism-only channel. Remove additional-email and anonymous-link options from PCE push flow. General surveys: keep all 3 channels. D_PCE_NC11, D_PCE_NC12.
- T67 (pce): Reminders: multiselect + from-closing-date messaging. Update design when building distribution step. D_PCE_NC13.
- T68 (pce): Results release date: required field (if no comment moderation). Add messaging for manual-release fallback. D_PCE_NC14.
- T69 (pce): Term-level date cascade for bulk surveys. Term = parent; course instances inherit dates. Individual override still possible. DESIGN-REVIEW — new concept. D_PCE_NC15.
- T70 (pce): CONFIRMED KILL — report access screen not in Phase 1. D_PCE_NC16. (Supersedes T53 DESIGN-REVIEW → now confirmed KILL.)
- T71 (pce): File upload wording: "PDF or Word document" everywhere in template and survey flows (not just "PDF"). D_PCE_NC06.
