# Exam Management — Design Backlog

Source: 2026-05-08 Aarti audit (`docs/research/meetings/2026-05-08-aarti-design-review.md`).

## Phase 1 design tasks

| # | Task | Persona | Surface | Priority | Notes |
|---|---|---|---|---|---|
| T1 | Faculty home — courses split | Faculty | Home/landing | P1 | Active course offerings on top, all affiliated below. Remove "Add new course" (Faculty cannot — per Exam Mgmt ADR-001). One search filter spanning both |
| T2 | Admin: course architecture screens | Admin | Admin module | P0 (foundational) | Master courses, master terms, course offerings, faculty assignment, "can add collaborators" permission toggle. LMS-on disables manual add (per workspace ADR-002) |
| T3 | Live monitor — student-centric counts | Faculty / Admin | Assessment monitor | P1 | Three buckets at top: Not Started / In Progress / Submitted (scan-band style). For in-progress show minutes + answered-of-N. Move flag panel to top. No chart-vs-numbers redundancy |
| T4 | Flagged-question workflow | Faculty / Admin | Live monitor + post-exam | P1 | Flag statuses: addressed / dismissed / acknowledged. No real-time student↔faculty messaging during exam (confirm Vishakha — R9) |
| T5 | Alerts-to-students banner | Faculty / Admin | Live monitor | P2 | Banner notification primitive (compliance broadcasts). Don't recreate "5 minutes left" (platform handles) |
| T6 | Assessment statuses + types — pre-design doc | All | Pre-design doc | **BLOCKER** | Word doc: 5 assessment types + per-type parameters; status taxonomy. Must align with PMs + Vishakha before more screens (R5, R6) |
| T7 | Assessment review / curving redesign | Faculty | Assessment results | P1 | Tabs in order: Overview (score distribution + content area frequency + objective frequency + Bloom's distribution) → Per-question analysis → Curving |
| T8 | Per-question analysis card | Faculty | Assessment review | P1 | How many right / wrong / skipped; distractor distribution (green=correct, single accent for others); difficulty (3-tier x-axis); curving inline at row level. Drop 2D scatter until R1 (point-biserial) done |
| T9 | Content-area / objective / Bloom's coverage | Faculty | Overview tab | P1 | Frequency counts ("8 of 20"), NOT percentages (Aarti — D17) |
| T10 | Question tagging at creation + assessment-build prompts | Faculty | Question editor + builder | P1 | Tag content area / competency / objective at create time. In builder, surface untagged questions with AI-suggested tags |
| T11 | Course-level question-bank health (gap analysis) | Faculty | Course detail | P1 | List content areas / competencies / objectives covered; per-item count of QB questions; "Generate more with AI" CTA per gap. AI uses course materials (syllabus, lecture, chapter). Move from competency to course screen (D13) |
| T12 | Program-level master lists (admin) | Admin | Admin module | P0 (foundational) | Per workspace ADR-001: content areas, competencies, standards, master courses, terms, course offerings, students, accommodations master list, faculty, permissions, assessment types |
| T13 | Accommodations module (shared) | Admin / Faculty | Cross-product | P1 | Per workspace ADR-006. Three tiers: master list, per-student application + docs upload, faculty read-only filtered view. Support non-registered students for makeup |
| T14 | Course-level mapping screens | Faculty / Admin | Course detail | P1 | Map course offering to subset of program content areas / competencies / objectives / standards |
| T15 | Two-question dashboards | Admin | Program reports | P1 | "Am I teaching everything?" + "Am I testing what I'm teaching?" Includes orphan detection ("2 standards not covered by any objectives") |
| T28 | Frequency-of-use column on QB rows | Faculty | Question bank | ✅ done | Already added (Romit confirmed in meeting) |

| T29 | QB: 400% zoom layout | Faculty / Admin | Question bank | P1 | Design challenge — take assumptions on primary (question list, folder tree) / secondary (metadata). Source: `2026-05-11-design-prd-alignment.md` D-0511-7 |
| T30 | QB: Folder overflow + scroll pattern | Faculty / Admin | QB sidebar | P1 | Real-world max ~15–20; hard cap at 30–40 possible. Scrollable tree; add search affordance at cap. Source: D-0511-8 |
| T31 | QB: Author search affordance in filter sheet | Faculty / Admin | QB filter sheet | P1 | 20+ authors scenario. Show first N, search for remainder. Source: D-0511-8 |
| T32 | QB: Public/private folder design | Faculty / Admin | QB sidebar + create-folder flow | P0 | Being brought back; was marked complete but removed from PRD without Romit knowing. Needs icon, creation flow, access indicator. Source: D-0511-9 |
| T33 | QB: Apply Nipun/Darshan question bank feedback | Faculty / Admin | QB table | P1 | Compile from PRD bottom section (tagged items). Source: D-0511-6 |
| T34 | Assessments: Apply Nipun/Darshan assessment screen feedback | Faculty / Admin | Assessment screens | P1 | Compile from PRD bottom section. Source: D-0511-10 |

## Research / blockers (R1–R10 from audit)

| # | Item | Owner | Deadline |
|---|---|---|---|
| R1 | Read up on point-biserial; explain calculation | Romit | Before T8 final design |
| R2 | Send Aarti a Claude note on point-biserial | Romit | After R1 |
| R3 | ExamSoft download / lockdown / take-home patterns | Romit | T6 input |
| R5 | Five assessment types — PM/PMS alignment | Romit + PMs | T6 |
| R6 | Status taxonomy — PM alignment | Romit + PMs | T6 |
| R7 | Permissions matrix — define rational levels | Romit + PMs + Vishakha | T2, T12 |
| R8 | Faculty profile — Prism-level vs additional fields | Romit + Aarti | T12 |
| R9 | Confirm flag-during-exam read-only | Romit + Vishakha | T4 |

## Aarti's homework for Romit

> "For my benefit and your benefit and the project's benefit, create a summary of everything we have discussed."

T27 — write the summary doc covering admin view structure, key tabs and information per topic. This `_backlog.md` + the meeting notes file together form the raw material; Romit needs to compile a polished summary doc separately.
