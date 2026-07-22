---
type: meeting
date: 2026-07-21
product: pce
participants: [Romit, Arun]
source: granola
granola_id: 0a8a79f3-716c-4877-b91e-f83cc0e20fa9
---

# Course Eval sync up — Jul 21

**Date:** 2026-07-21 9:30 AM EDT
**Participants:** Romit (Microphone), Arun (Speaker). Monil was expected but had not joined by the time of this call.

---

## Topics covered

1. Overall course eval design progress (~80–85% done)
2. Template builder UX — "loaded" screen problem
3. Dashboard / course-readiness table — status label visibility
4. Romit's proposal: nested / sequential approach to template creation
5. Design system collaboration with Himanshu

---

## Decisions

| # | Decision | Product | ADR |
|---|---|---|---|
| D_PCE_0721_01 | Template builder screen is too "loaded" — too many simultaneous actions (upload document, opening instructions, add section, rule set, faculty roles). Needs simplification before engineering picks it up. | PCE / CFE | Exploratory — no code change until Romit + Monil + Arun align on approach. |
| D_PCE_0721_02 | Dashboard / course-readiness table: "Needs Setup" and "Ready to Send" status row labels are not visually prominent enough; course name must be bold. Requires Himanshu alignment (constraint is the DS gray-bar grouping pattern). | PCE / CFE | FLAG — see T127. |
| D_PCE_0721_03 | Romit proposed a nested / sequential template creation approach (one aspect/type at a time: course → faculty → general, similar to view-terms row design). Arun endorsed exploring it but directed Romit to align with Monil first before committing design effort. | PCE / CFE | Exploratory — FLAG. See T128. |
| D_PCE_0721_04 | Monil's alternative approach (horizontal tabs, one aspect per tab, sequential question-building): upload document OR add questions manually — only ONE per aspect in Phase 1. Arun: "you can't do both... we keep it simple." | PCE / CFE | FLAG — still under Monil/Romit discussion. Not yet confirmed. |

---

## Verbatim Arun quotes

> "So this section. Feels a bit. Loaded. Right. So you have upload a document. You have opening instructions. And then I can add a section. Question. Right. So add one more section. Look at the number of actions which we have. Now under faculty. There is one more. We also have rule set. Right. So you have rule set, you have add section, add question. So while I'm working on one section. I'm also looking at a lot of other information. Right. So I have an option to add a rule set, add a section. So yeah, I mean, we need to somehow simplify this."

> "Look at this. This needs setup. Is your DPT. The course name is blurred. Isn't bold. What it is making is, you know, I am not the first look I'm not seeing needs set up at all. Right. So if I scroll through, I don't see read ready to send at all. Right. So. Yeah, I mean, we are looking. There's one more feedback. Right. So these are details. Ideally we are building this so that users will not even have to look at these details. So which means this should somehow be highlighted. In a different way."

> "So I would recommend one approach to both of you guys. Right. So designs are like takes time and a lot of nuances. Do a very rough prototype pen and vapor. Plot design, whatever. Right. So you both discuss and then come up with something. All of us can look at that. And once we feel just the right approach, then you can spend more time designing it."

> "For, let's say this screen, which design system is not factoring in right now, of course, it cannot factor in every. Lot of things, right? So if there are any things which see since you're working on one specific case. You will have a better context. And with that context, you and Himanshu will probably be able to think through and see if there are any things which we need to change."

---

## Design tasks generated

| Task | Priority | Details |
|---|---|---|
| T127 | P1 — DESIGN-REVIEW | Dashboard / course-readiness: status label prominence — see backlog |
| T128 | P1 — DESIGN-REVIEW | Template builder redesign: sequential / tabbed approach — see backlog |
