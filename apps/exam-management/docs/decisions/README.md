# Exam Management — Architecture Decision Records

Per-product ADRs (Exam Management-specific). Workspace-level ADRs live at `docs/decisions/`.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| 001 | Three-concept course architecture (master courses + terms + course offerings) | Accepted | 2026-05-08 |
| 002 | Archived questions appear at end of folder list with mutable, filterable status | Accepted | 2026-05-13 |
| 003 | All Questions is the canonical location anchor for archived and untagged questions | Accepted | 2026-05-13 |
| 004 | Copy to Folder creates a linked reference; Duplicate creates an independent copy | Accepted | 2026-05-13 |
| 005 | Question creation supports multi-location assignment; Copy to Folder serves post-creation expansion | Accepted | 2026-05-13 |

Pending (from 2026-05-08 Aarti audit, Tier 2):
- Faculty role hierarchy + collaborator permission (D4, D5)
- Live monitor is student-centric, not question-centric (D6)
- Question tagging is question-level, not assessment-level (D12)
- Course-level question-bank gap analysis (D13)
- Two-question dashboards (D14)
- Coverage shows frequency counts, not percentages (D17)
- Curving allows excluding any question (D9)
- Five assessment types — taxonomy doc as blocker (D10)
- Drop "live" status → "ongoing" (D11)

Aarti's earlier directives (April email + 2026-05-07) are also worth retroactive ADRs when the intake skill is exercised on those transcripts.
