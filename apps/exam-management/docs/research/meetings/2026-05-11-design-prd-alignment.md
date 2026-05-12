---
type: meeting
date: 2026-05-11
product: exam-management
also-affects: [pce]
participants: [Romit, Vishal (PM), Vishaka (briefly), Monil (PM / PRD writer), Nipun (mentioned, not on call)]
source: granola
granola_id: f8252e3e-dd3c-4a39-8afb-26c1fbe9bc28
---

# 2026-05-11 — Exam management design and PRD alignment

## Context

Vishal set up this call to align design (Romit), product (Vishal, Monil), and engineering on how to move forward after the 6 in-person Aarti design sessions starting this week. Call included Vishaka briefly; Monil joined toward the end.

## Operating model established

Aarti has scheduled 6 in-person design sessions (afternoons, 1–5 PM): Wed/Thu/Fri this week + 2 days next week + 2 days the following week. These will be **recorded**. Vishal and Nipun will listen at 1.5× and translate into PRDs. Romit is the conduit between Aarti sessions and product team.

New sync cadence:
| Sync | Participants | When |
|---|---|---|
| Daily (Mon–Thu this week) | Romit + Vishal + Nipun | Morning (Romit's time) |
| Twice/week (Mon + Wed ongoing) | Romit + Vishal + Monil | 7:00–7:30 PM IST |
| Before above (same days) | Romit + Nipun | 6:30–7:00 PM IST |

## Decisions / directives

| # | Decision | Product | Notes |
|---|---|---|---|
| D-0511-6 | Question bank open feedback (400% zoom, folder overflow, author search) must be resolved before engineering starts QB UI | Exam Mgmt | Feedback shared by Nipun and Darshan; Vishal's top priority |
| D-0511-7 | 400% zoom is a design challenge — take assumptions on primary/secondary information and go with best guess | Exam Mgmt | "You already know what is the primary information for the end user… you go ahead and take the assumptions and design it" |
| D-0511-8 | Folder capacity numbers confirmed: 15–20 max folders per question bank course; can hard-cap at 30–40 | Exam Mgmt | 4–5 faculty max per team-taught course; each faculty max 4 sub-folders within their main folder |
| D-0511-9 | Public/private folder is being brought back into QB design | Exam Mgmt | Was marked "completed" in PRD but removed; Romit only discovered this late. Communication gap. Must be designed. |
| D-0511-10 | Assessment designs: incorporate recent Nipun/Darshan feedback before dev queue | Exam Mgmt | Vishal: "whatever we can resolve, that'll be great" |
| D-0511-11 | Focus design on first month of roadmap only to unblock engineering | Exam Mgmt | "Let's focus on the ones which are in the first phase of the road map" |
| D-0511-12 | PRD open items tracked in a section at the bottom of each PRD doc, tagged to Romit | Exam Mgmt | New process for design review comments/feedback |
| D-0511-13 | Monil will break the large PRD MD-2 into 3 sub-documents (one per epic) | Exam Mgmt | Currently in progress; Romit's prior comments preserved in backup copy |
| D-0511-14 | AI question creation + AI assessment creation are prioritized as critical POC flows | Exam Mgmt | "AI is something which we cannot defer… prioritize AI led question creation, assessment creation to start off with" |
| D-0511-15 | Parity document with ExamSoft features to be shared by Vishal (informs roadmap sequencing) | Exam Mgmt | "The first question they're going to compare us against is ExamSoft parity feature" |

## Verbatim quotes

> "The question bank is not zooming to 400%, which is a required… right now, the UI is not adjusting." — Vishal (quoting Nipun/Darshan feedback)

> "On this, Rohit, I would say this is more of a design challenge… you already know what is the primary information for the end user. You go ahead and take the assumptions." — Vishal

> "I got to know that public and private folder is something which you are bringing back again. And it was a part of the document which was stated that it is completed." — Romit (communication gap discovery)

> "We cannot afford to not have the skill set of product management team utilized to make it better." — Vishaka

> "We should not take away any capability which they already have. But every capability which we think of should be based on the new platform shift which is happening right now, which is AI." — Vishal

> "Design and product together will become bottleneck. Until design and product are aligned, nothing goes to engineering queue." — Vishal

## Design tasks generated

| Task | Surface | Priority | Notes |
|---|---|---|---|
| QB-ZOOM: Design 400% zoom layout for question bank | QB table + sidebar | P1 | Take assumptions. Primary: question list, folder tree. Secondary: metadata (authors, tags) can truncate/collapse. |
| QB-FOLDERS: Design folder overflow pattern | QB sidebar | P1 | 15–20 folders max per course; show all + scrollable; search within if approaching cap (30–40) |
| QB-AUTHORS: Design author search pattern | QB filter sheet | P1 | 20+ authors scenario; show first N, search affordance for remainder |
| QB-PRIVATE-FOLDER: Design public/private folder distinction | QB sidebar + folder creation | P0 | Was marked done, being brought back. Needs icon + creation flow + access indicator |
| QB-FEEDBACK: Apply remaining Nipun/Darshan feedback items | QB table + related | P1 | Vishal to share compiled feedback doc in PRD |
| QB-ASSESSMENT-FEEDBACK: Apply Nipun/Darshan assessment design feedback | Assessment screens | P1 | Specific items pending — check PRD bottom section for tagged items |

## Things to note (no code impact today)

- The Monil PRD backup has Romit's prior comments — Monil to re-place them in the new 3-part structure.
- AI POC experiments to start in parallel while design continues, so skill set is ready for when designs land.
- Romit should NOT wait weeks for alignment meetings — use PRD comments + daily sync to stay unblocked.
