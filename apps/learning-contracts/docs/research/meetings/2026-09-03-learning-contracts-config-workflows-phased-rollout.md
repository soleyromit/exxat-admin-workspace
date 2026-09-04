---
type: meeting
date: 2026-09-03
product: learning-contracts
participants: [Romit Soley, Aarti (Adi), Vishaka, Ankit (presenter), Katie, Kunal, Kanti, Nava, Akshay]
source: granola
granola_id: 7957f86d-f692-49cb-9c76-8c0366dc08bd
---

# Learning contracts — configuration, workflows, and phased rollout — 2026-09-03

**Date:** 2026-09-03 8:29 AM EDT
**Participants:** Ankit (product analyst, presenter), Aarti (Adi), Vishaka, Katie, Kunal, Kanti, Nava, Akshay, Romit (note-taker)

---

## Topics covered

1. Learning contract concept overview — definition, disciplines (SW, OT, public health, counseling)
2. Five pain points in current Prism implementation
3. Configuration screen walkthrough (admin setup flow — prototype)
4. Checkpoint design — mid vs. final, per-placement, rating scales
5. Secondary reviewer policy
6. Notification policy
7. Contract applicability levels (placement / course / year / student-universal)
8. Pre-placement sign-off for CMHC counseling (Phase 2)
9. Timeline — Q4 vs. Q1 hard deadline
10. Cohere session planning (Sep 15 with Aarti, Katie, Kanti)

---

## Decisions

| # | Decision | Product | Notes |
|---|---|---|---|
| D1 | Learning contract is a standalone document shareable across multiple placements | learning-contracts | Explicitly confirmed: "Learning contract is a stand alone doc and you can attach it to multiple placements." |
| D2 | Perpetual edit mode — contract remains editable by all parties after approval | learning-contracts | Living document concept; replaces checkpoint-only edit windows |
| D3 | Audit trail / field-level version history is a Phase 1 requirement | learning-contracts | "Who made the change, what change was made, and when it was made at the field level" |
| D4 | Contract applicability has four levels: placement / course / year / student-universal | learning-contracts | Admin configures per framework; determines how broadly the contract is shared |
| D5 | Checkpoints are placement-scoped; program-level defaults pull down to course, editable at course | learning-contracts | If contract spans 2 placements, each has its own mid + final checkpoints independently |
| D6 | Rating scale is configurable per checkpoint (mid vs. final can differ); caution warning shown when scales differ | learning-contracts | "The rating [should be] customizable by the checkpoint" — Aarti |
| D7 | Secondary reviewer policy needs TWO separate toggles: (1) allow participation, (2) mandate when available | learning-contracts | Single toggle was explicitly rejected as insufficient |
| D8 | Notifications: stage-level only — NOT per-field-save; end-of-day digest of changes is acceptable alternative | learning-contracts | "field level notification is a little bit tricky" — Aarti; "at the end of the day, they will get one notification with a summary of all changes" |
| D9 | "Considered for competency" toggle per checkpoint — flags whether that checkpoint's rating feeds into the competency tracker | learning-contracts | Vishaka raised; aligns with existing logic (final replaces mid today); needs Sankalp sync |
| D10 | Config UI: full-page multi-step flow, NOT a drawer/grid | learning-contracts | Aarti: "Why do you have to do it in a drawer and not the main page?" Team agreed to move away from drawer |
| D11 | If a drawer is used anywhere in config, it must be 2/3 width — never 1/3 | learning-contracts | Aarti: "I recommend not using one third, but using two third" |
| D12 | Q1 is the hard deadline — no negotiation; no "lightweight then full" releases | learning-contracts | Aarti: "this cannot miss the q1 deadline" and "I am not in favor of releasing lightweight version of this and then releasing a full version" |
| D13 | Pre-placement supervisor sign-off: Phase 2 only | learning-contracts | CMHC counseling requirement; blocked by supervisor being anchored to placement entity |
| D14 | Cross-course score visibility configuration: Phase 2 | learning-contracts | Whether a rating from one course is visible when contract is referenced in another |
| D15 | Learning contracts nav lives in placement management section (alongside sites/placements/evaluations) | learning-contracts | "It would go into the third card where we show sites placements evaluations. Similarly, there would be one more navigation of its own that would say learning contracts" |
| D16 | Student can initiate/draft a contract before a placement exists — at course or program level | learning-contracts | Partial solution for pre-placement need; supervisor sign-off still Phase 2 |
| D17 | Cohere session: Sep 15 with Aarti, Katie, Kanti — prototype walkthrough + discipline-specific questions | learning-contracts | "Adi, why don't you and Katie set up some time with me on September 15" — Aarti |
| D18 | Final checkpoint cannot be removed — it is a protected slot (name "Final" is a default, can be relabeled) | learning-contracts | "Final is something which would always remain" |
| D19 | Super admin / program administrator only can do configuration — not all users | learning-contracts | Confirmed by Aarti: "Not everyone. No." |
| D20 | N/A rating handling: null scenario — not added to numerator or denominator | learning-contracts | Consistent with existing evaluation module behavior |

---

## Verbatim Aarti / Vishaka quotes

> "Why don't we just create the entire page and leave the page as the editable form of the configuration. Like, why do you have to do it in a drawer and not the main page?" — Aarti

> "If you want to show the metadata, these be the things that you show on the main screen, and then you still put the edit behind the larger drawer." — Aarti

> "If you are going to put it in a drawer, I recommend not using one third, but using two third." — Aarti

> "This cannot miss the q1 deadline. Okay? So that is the alignment and understanding you are going to have to have with the tech team." — Aarti

> "I am not in favor of releasing lightweight version of this and then releasing a full version of this." — Aarti

> "We either launch a sensible phase one at the end of the year, or we don't launch it and we launch it next year." — Aarti

> "The rating customizable by the checkpoint. Then all the things are [appropriate guardrails]." — Aarti

> "Allow secondary [reviewer] yes, no, make mandatory when secondary is available, yes, no, something like that." — Aarti

> "Field level notification is a little bit tricky. And if you are going to enable it, I think it is probably wise to then give it more configuration or don't give that option at all. Or if you give that option, say that at the end of the day, they will get one notification with a summary of all changes." — Aarti

> "So when you are adding the checkpoint and you're giving a scale, you can add one more bit that says will this be considered for competency? Yes, no." — Vishaka

> "If these are placement based, the view of the scoring you will keep it flexible based on the supervisor for that placement." — Vishaka

> "We're already facing problems when the ratings scale... that is something you'll have to talk with Sankalp about." — Vishaka

---

## Design tasks generated

See `_backlog.md` — T_LC_03 through T_LC_13 added from this session.
