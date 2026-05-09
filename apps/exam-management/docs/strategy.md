# Exam Management — Strategy

Extended from `apps/exam-management/DESIGN.md §1–§2`. Long-form strategy.

## North star

Replace ExamSoft as the default exam platform for accredited health-sciences programs by building five differentiators ExamSoft doesn't have, while staying at parity on the core exam-creation and delivery features faculty already expect.

## Strategic context

- **Adoption mix:** ~40% of customers (~400 of 1600 programs) use curriculum mapping. Build for the mixed basket — gap analysis must work standalone (questions ↔ standards) AND with curriculum (questions ↔ objectives ↔ standards).
- **Faculty are conservative** on new questions. ~90–95% per-exam recycled, ~5–10% new. AI generates → faculty validates carefully. Don't optimize for new-question volume; optimize for trust in AI-generated content.
- **Anchor for prioritization:** ExamSoft parity list. Innovate on differentiators, don't ship without parity must-haves.
- **Design philosophy** (Aarti): Build with a 2027 vision, deliver phased. Phase 1 must already be better than ExamSoft.

## What success looks like (Phase 1)

- Faculty land on My Courses (not QB) and can complete the round-trip (build → administer → review → publish) faster than in ExamSoft
- Three insights surface on every assessment: taught-not-assessed, assessed-not-taught, neither-taught-nor-assessed
- Pre-publication approval is available, never blocking
- AI-aided question creation reduces per-new-question authoring time by ≥50% vs blank slate, while preserving point-biserial quality
- Three-tier competency reporting renders tiers 1–2 (assessment-level + course-cumulative)

## What we're not doing (Phase 1)

- Tier 3 program-level cumulative competency reporting (2027)
- AI-proof assessments — defer to 2027/2028 (the new skill being assessed: "are you able to spot the errors in AI output")
- Lockdown browser vendor integration — architecture present, vendor TBD Q4 2026 / Jan 2027

## Strategic risks

- **AI question quality** — if AI-generated questions hurt point-biserial, faculty will abandon the feature. Mitigation: aggressive faculty validation step, item-quality dashboard, opt-in usage.
- **Pre-publication approval fatigue** — chairs already have full plates; if approval queue is friction, it gets ignored. Mitigation: silent gate, side widget, never blocks administer.
- **Curriculum mapping dependency** — only 40% adopt it; differentiator must work without it. Mitigation: standalone questions↔standards path is first-class.
- **Tagging confusion (the Prism mistake)** — two tagging systems = user confusion. Mitigation: ONE label system (Gmail-style nested), accommodate standards / measures / categories within it.
