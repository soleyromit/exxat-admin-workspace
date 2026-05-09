# Competitor Intelligence (per-product, anchored)

> Per-product competitor analysis. Anchored sections (`#<product-id>`) so the UserPromptSubmit hook can extract just the relevant section when the active product is detected.
>
> **Source-of-truth** for parity work. When designing a feature that has a competitor analog, this is where the analog is documented. Storytelling files cite this; this file cites primary sources (storytelling, ExamSoft demos, customer call notes).

## Schema per section

```
#### #<product-id>
| Competitor | Position | What they do well | What they miss | Parity targets | Source |
```

Where:
- **Position** = `primary` (the competitor we're directly replacing) · `secondary` (relevant but not dominant) · `adjacent` (different product, overlapping use cases)
- **Parity targets** = features we MUST match before claiming migration-readiness (per S-03 match-then-extend)
- **Source** = storytelling file, Granola ID, or other primary citation

---

#### #exam-management

| Competitor | Position | What they do well | What they miss | Parity targets | Source |
|---|---|---|---|---|---|
| ExamSoft | primary | LO tagging per question · difficulty + discrimination index · question types (formula, hotspot, ordering, matching) · lockdown browser · standards-only OR curriculum-only mapping | Complete chain (curriculum → standards → questions) — Aarti: "everything is fragmented" · Workflow features (review/approval before publish) · AI-assisted item creation · Confidence-based marking · Per-student bulk accommodation | LO tagging · difficulty/discrimination metrics · all 4 advanced item types · lockdown · standards mapping · question bank import · BY Aug 2026 demo target | `apps/exam-management/docs/storytelling/aarti-perspective.md` §2 (3 dated quotes) · `apps/exam-management/docs/decisions/001-course-architecture-master-and-offerings.md` |
| D2L (Brightspace) | secondary | LMS integration · gradebook integration · accommodation per-student manual setup | Bulk accommodation across cohort/quiz · sophisticated item analysis · workflow approval | Bulk accommodation in 1 step (D2L is per-student per-quiz manual — beat it) | Aarti, 2026-05-06 (Granola: roadmap planning) |
| Blackboard | secondary | Established LMS · question pools · randomization | Item analytics depth · accommodation flexibility | Question pools + randomization + LMS-grade integration | Aarti, 2026-05-06 |

**Match-then-extend (per S-03):** Phase 1 must match ExamSoft on the parity targets above. Aarti quote 2026-05-06: *"For helping people with the migration from ExamSoft to Exact, there will have to be like a conscious effort to say they should be able to do everything they can do with ExamSoft. And more."*

**Differentiator candidates (Phase 1):**
- Complete curriculum → standards → questions chain (the "fragmentation" gap Aarti identified)
- AI gap analysis at assessment level (Aarti's Phase 1 differentiator per `aarti-perspective.md`)
- Curricular Assessment Loop end-to-end visualization

---

#### #pce

| Competitor | Position | What they do well | What they miss | Parity targets | Source |
|---|---|---|---|---|---|
| Trajecsys | primary | Hours tracking · evaluation forms · clinical placement workflow | Cross-rotation aggregate without Excel · curricular mapping · AI-assisted action items | Hours tracking · evaluation form distribution · placement-level analytics | `apps/pce/docs/research/hub-files/README.md` (mirror target — pending) |
| Time2Track | primary | Compliance tracking · supervision logs · psychology-PCE-specific | Generalist PCE workflows · LMS-integrated student lists · multi-program deployment | Supervision/compliance equivalent in PCE (TBD priority) | (pending Aarti session — placeholder) |
| Watermark Evaluation Kit | secondary | Course / faculty evaluation surveys · accreditation reporting | Clinical-experience-specific workflows · LMS hook | Course-eval parity (course-eval is an alias of PCE post-survey workflow) | `apps/pce/docs/storytelling/aarti-perspective.md` (cited in PCE strategic notes) |
| ExplorerBlue | adjacent | Course evaluation · response analytics | Clinical workflows | Course-eval analytics depth | (cited via Vishal, 2026-05-06) |
| SurveyMonkey / Qualtrics / Anthology | adjacent | Generic survey distribution · response analytics · LMS hooks (some) | Healthcare-program-specific compliance · clinical placement context | Self-serve form/survey building (FaaS overlap — see `#faas`) | (cited via Vishal, 2026-05-06) · workspace ADR-005 (AI-first) |

**Phase 1 scope:** Replace Trajecsys + Time2Track for PT/PA/Pharm programs. Course-eval workflow (alias) targets Watermark / ExplorerBlue functionality.

**Differentiator candidates:**
- AI action items from evaluation responses (Aarti's 3 AI pillars for CFE, 2026-05-06)
- Curricular mapping → clinical experience → outcome chain (analog to Exam's complete chain)

---

#### #course-eval

> Alias of `#pce`. See PCE section above. Course/Faculty Evaluation is the post-survey workflow inside PCE, not a separate app.

---

#### #faas

> ⚠️ **Stub.** FaaS storytelling not yet built. When FaaS work begins, populate this section from the kickoff session(s) and Lauren/Brooke's PM context.

| Competitor | Position | What they do well | What they miss | Parity targets | Source |
|---|---|---|---|---|---|
| SurveyMonkey | primary (suspected) | Self-serve form builder · drag-drop · response analytics · LMS-agnostic distribution | Healthcare-program-specific compliance · clinical workflow context · multi-step approval | Self-serve form builder (#1 parity per BOOTSTRAP intent) · response analytics · theme extraction | (pending FaaS kickoff) |
| Qualtrics | primary (suspected) | Sophisticated branching · enterprise compliance · advanced analytics | Healthcare-program-specific use cases | TBD per Lauren/Brooke | (pending FaaS kickoff) |
| Google Forms | adjacent | Free · simple · LMS-integrated (LTI) | Compliance · reviewer flows · workflow approval | (NOT a parity target — too simple) | (pending FaaS kickoff) |

**Anti-pattern:** Don't design FaaS to compete with Google Forms on simplicity. The differentiator is healthcare-program-specific governance + reviewer workflows.

---

#### #skills-checklist

> ⚠️ **Stub.** Skills storytelling scaffold only. Populate when Skills Checklist work begins.

| Competitor | Position | What they do well | What they miss | Parity targets | Source |
|---|---|---|---|---|---|
| Meditrek | primary (suspected) | Procedure logging · clinical site tracking · placement assignments | Cross-rotation aggregate · student-lifetime competency view (placement-scoped only) · AI-assisted gap analysis | Procedure minimum counter · red-flag deficiency filter · cross-rotation aggregate (the #1 gap — 80-90% of students build external spreadsheets) | (pending Skills kickoff) |

**Differentiator candidate:** Student-lifetime competency tracking (not placement-scoped) — addresses the workspace-wide manual tracking gap.

---

#### #learning-contracts

> ⚠️ **Stub.** Learning Contracts storytelling not built.

(populate when product work begins)

---

#### #patient-log

> ⚠️ **Stub.** Patient Log storytelling scaffold only.

| Competitor | Position | What they do well | What they miss | Parity targets | Source |
|---|---|---|---|---|---|
| Meditrek (patient logging module) | adjacent | Patient case logging · diagnosis tagging · ICD codes | AI summary across cases · cross-rotation patient aggregate · differential diagnosis prompts | Patient case logging · ICD/diagnosis tagging | (pending Patient Log kickoff) |
| Typhon | adjacent | Established in nursing programs | Clinical reasoning support | Case logging | (pending) |

---

## How this file is used

| Consumer | What they read |
|---|---|
| UserPromptSubmit hook | Active product detected → extract `#<product-id>` section, inject into context |
| Design tasks | "Does ExamSoft do X? what should we do differently?" — answered from this file's data, not derived |
| ADRs | When an ADR makes a parity claim, it cites this file's row |
| Storytelling files | When a perspective references a competitor, it cites this file (don't duplicate the competitor analysis in storytelling) |

## Maintenance

- **When Aarti / Vishaka mentions a competitor in a meeting:** add or update the row, cite the Granola ID
- **When you do a competitor demo or pull a screenshot:** mirror the file to `apps/<product>/docs/research/hub-files/` and link from the row
- **When a parity target ships:** strike it through (markdown `~~target~~`) instead of deleting — preserves history
- **Re-verify any row > 6 months old** before relying on its parity claims (competitors ship features)

## What goes here vs storytelling vs ADRs

| Artifact | Question it answers |
|---|---|
| **This file (COMPETITOR-INTEL.md)** | What does competitor X do, what do they miss, what's our parity target? |
| **Storytelling perspectives** | What does Aarti / Vishaka *think* about competitor X? (quoted observations) |
| **ADRs** | What did we *decide* about competitor X's pattern? (e.g., "we copy ExamSoft's lockdown approach with these 3 modifications") |

Don't duplicate. Storytelling cites this; ADRs cite this; this cites primary sources (Granola, demos, customer calls).
