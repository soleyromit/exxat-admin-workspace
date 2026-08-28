# Exam Management Weekly Call

**Date:** 2026-08-27
**Participants:** Vishaka (faculty expert / external consultant), Nipan (researcher), Romit (design)
**Granola ID:** `7ed017c8`
**Context:** User research call. Vishaka (health science faculty background — pharmacy/PA) answering deep questions on exam administration workflows, RBAC models, question creation patterns, and milestone exam practices.

---

## Topics covered

1. Question variation levels (L2: same concept + delivery tweak; L3: new question format / stem flip)
2. Leaked paper recovery workflow — faculty pivot strategies
3. How PA vs pharmacy/medical programs differ in exam administration ownership
4. Case study (vignette) grouping in health science assessments
5. Section attribution in team-taught courses
6. Milestone exams (end-of-didactic / end-of-clinical) — structure, frequency, in-house vs. standardized
7. Z-scores and predictive modeling — scope discussion
8. AI for question generation — current external usage patterns, LMS integration opportunity
9. Category mapping mindset — how faculty think about mapping questions to competencies / board blueprints

---

## Key decisions / research findings

| # | Finding | Impact | Source |
|---|---|---|---|
| D_EM_0827_01 | PA programs' "one person manages all exams" model is NOT generalizable across disciplines. Pharmacy / medical have 35–40 core faculty, each course coordinator manages their own question bank. Need both: assessment chair role (high RBAC, milestone exams, LMS integration) AND per-course faculty coordinator role (scoped to their courses only). | T116 | Vishaka verbatim below |
| D_EM_0827_02 | Case study / vignette grouping (shared stem visible while question changes) is a very common and important use case in health science exams. Should be included in MVP. | T117 | Vishaka verbatim below |
| D_EM_0827_03 | Team-taught courses need section-level attribution so students know which faculty authored which section's questions. Section naming alone may not be enough — a free-text descriptor / instructions field at section level is the ask. | T118 | Vishaka verbatim below |
| D_EM_0827_04 | Z-scores and predictive modeling (Endresin's PA model) = Phase 2/3. Not needed for MVP. | No code change | Vishaka + Romit discussion |
| D_EM_0827_05 | Faculty actively use external AI (ChatGPT, Copilot, Claude) to generate question drafts from lecture materials. LMS integration is the path to surfacing lecture content inside Exam Management for AI-assisted generation. | Research note — no task yet | Vishaka |

---

## Verbatim quotes

**On PA model vs. pharmacy/medical:**
> "PA programs typically have a very small group of core faculty — there are departments within the bigger medical or health science program and they only have like four or five core faculty. So maybe that is why they have a one person managing all their didactic exams. But in bigger programs like pharmacy medical we have like 35–40 faculty core faculty each teaching different courses... every course coordinator is responsible for managing their own questions in ExamSoft, they're building their own question banks. This model may be true for these 3 PA programs or wider PA in general but it's definitely not true across disciplines."

**On assessment chair role:**
> "There is an assessment chair typically who is overall responsible for the whole exams of implementation and they probably have the higher RBAC... but in general a course faculty or a course coordinator always has access to their course where they can create, add, administer and review results of that assessment."

**On case study grouping:**
> "A common picture or a common description keeps appearing on one side of the UI and on the second side the questions keep changing — right so that reference material is common for those four or five questions. So case studies also like that. It's basically reference for the next four or five questions."

**On section attribution for team-taught courses:**
> "For team taught courses Dr. Bhave's question first 20 Dr. Magi's question next 20 Dr. Modi's questions next 20. So a way for us to indicate that to the students is sometimes important... the same topic could be taught by multiple faculty and so reading the question sometimes the students don't realize is Dr. Bhave asking this or Dr. Maggi asking this because then that's what the lens they'll use to answer that question."

**On AI usage:**
> "Nowadays faculty are building their whole assessments and questions using AI. They are not now spending sitting at their desk thinking and building that stem from the beginning. They're using AI to give them a draft and then they're tweaking it... if you give your teaching materials — whether it's lecture notes or powerpoints or documents or even book chapters — and say build me a quiz of 10 questions, AI is able to give you really good starting material."

---

## Design tasks generated

| Task | Description |
|---|---|
| T116 | PA program model clarification — design must support both assessment chair (high RBAC, cross-course) AND per-course faculty coordinator roles. Not just the one-person model. |
| T117 | Case study / vignette grouping — confirm in MVP scope; design the shared-stem / reference-panel UI (shared panel on left, question changes on right). |
| T118 | Team-taught course section attribution — design a section-level descriptor / instructions field so the exam can indicate which faculty authored which section. |

---

## Not addressed / deferred

- LMS integration for AI question generation: research direction, no design task yet.
- Z-scores / predictive modeling: Phase 2/3 explicitly.
- Category auto-suggestion by AI: Nipan researching separately (reverse-engineering Dr. Modi's category mappings).
