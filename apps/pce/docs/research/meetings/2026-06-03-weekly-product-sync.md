---
type: meeting
date: 2026-06-03
product: pce
participants: [Aarti, Vishaka, Vishal, Nipun, Rohit, Michelle/Yash, Darshan, Romit]
source: granola
granola_id: 7a53688f-a1c3-42b6-b091-31035fd70d7b
---

# Weekly Product Sync | New Initiatives (Prism) — 2026-06-03 (PCE slice)

Full meeting notes: `apps/exam-management/docs/research/meetings/2026-06-03-weekly-product-sync.md`

## PCE-specific decisions

| # | Decision | Notes |
|---|---|---|
| D_PCE40 | Academic year: do not collect separately from term | Term picker already shows `{t.name} · {t.academicYear}` combined. Aarti: "We don't need to collect the academic year twice." Already correct in `surveys/push/page.tsx` Step 2. No code change. |
| D_PCE41 | Term missing start/end dates → show reminder/link | Aarti: "some message if they haven't entered the start date and end date, if post course evaluation needs it, then when they go in that section, a reminder to go add start date and date. So a link to come here or something." DESIGN-REVIEW — T58. New UI pattern. |
| D_PCE42 | Search and Ask Leo must remain in Prism TOP PANEL, not left sidebar | Aarti: "search for example, should not be moved into the left hand [side]. It should be something that we put on the browser on the top... And then same thing with Ask Leo... we cannot make them into left hand side menus." Pending Prism alignment discussion with Himanshu + Yash. T57. |
| D_PCE43 | Course evaluation Cohere + November 1 release targets | Cohere demo: Aarti and Vishal believe it's achievable. November 1 release: give schools 4–5 weeks to set up before December year-end surveys. Plan weekly milestones against these dates. Process note — no immediate code change. |
| D_PCE44 | PCE small panel: font size and readability concern | Aarti: "the middle panel that we have... the font is and the gray is very small. On a small screen. It's very, like, becomes difficult to read." Raised while reviewing push survey UI. Flag for design review (T59 PCE). |
| D_PCE45 | Visibility settings (shared with program / admin only) | Aarti deferred explanation to Monil: "Maybe one we can park this for Monel." Not a current code directive — wait for Monil's intent clarification. |

---

## Aarti verbatim quotes (PCE-related)

> "We don't need to collect the academic year twice."

> "Some message if they haven't... entered the start date and end date, if post course evaluation needs it, then when they go in that section, a reminder to go add start date and date."

> "The font is and the gray is very small. On a small screen."

> "Search for example, should not be moved into the left hand [side]. It should be something that we put on the browser on the top... And then same thing with Ask Leo. These are things that are on the top panel... we cannot make them into left hand side menus. That's not going to work out."

---

## Design tasks generated

- T57 (PCE): Search and Ask Leo placement — pending Prism nav alignment discussion. DESIGN-REVIEW.
- T58 (PCE): Term missing start/end dates → reminder/link. New UI pattern. DESIGN-REVIEW.
- T59 (PCE): Font size / readability in survey push middle panel. DESIGN-REVIEW.
