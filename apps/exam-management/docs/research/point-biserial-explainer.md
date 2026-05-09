# Point-Biserial Correlation — Explainer Note

> Per Aarti 2026-05-08 directive: *"Read up on what point biserial is, calculated, what it indicates… If I were you, Romit, I would not do any work using my point biserial score until I have actually learned and understood and I can explain that calculation to somebody."* + *"Drop me a note from Claude or whatever, so that I know that you have read it and understand it."*
>
> **Author:** Romit (with Claude support).
> **Date:** 2026-05-09.
> **Use:** Reference for Exam Management item-quality discussions. Send to Aarti when ready.

---

## TL;DR

**Point-biserial correlation** (`r_pb`) measures how well a single question discriminates between high-performing and low-performing test-takers. It's a number between **−1 and +1**:

- **High positive** (~0.30 to +1.0) — the question separates strong students from weak ones. **Good item.**
- **Near zero** (~0 to ±0.15) — the question doesn't discriminate. Most students get the same answer regardless of overall ability. **Suspicious item.**
- **Negative** (any value < 0) — high-scoring students get it WRONG more often than low-scoring students. **Broken item — most likely a writing flaw, ambiguity, or miskeyed answer.**

In Exam Management terms, this is the most reliable signal for "is this question doing its job?"

---

## How it's calculated

Point-biserial is just **Pearson correlation** between two variables, where one is dichotomous (right/wrong on this one question) and the other is continuous (overall test score):

```
r_pb = (M₁ - M₀) / σ_total  ×  √(p × q)

where:
  M₁    = mean total test score of students who got THIS question RIGHT
  M₀    = mean total test score of students who got THIS question WRONG
  σ_total = standard deviation of total test scores across ALL students
  p     = proportion of students who got the question right
  q     = 1 − p  (proportion who got it wrong)
```

Plain-English version: **how much higher (or lower) is the average overall score among students who got THIS question right, expressed in standard-deviation units, weighted by how balanced the right/wrong split is.**

---

## Worked example

Imagine a 50-question exam, 30 students.

Question 12 is the question we're evaluating.
- 18 students got Q12 right (p = 0.6)
- 12 students got Q12 wrong (q = 0.4)
- Average total score of the 18 right-getters = 42.0 / 50
- Average total score of the 12 wrong-getters = 35.0 / 50
- Standard deviation of all 30 students' total scores = 5.0

```
r_pb = (42.0 − 35.0) / 5.0  ×  √(0.6 × 0.4)
     = 7.0 / 5.0  ×  √0.24
     = 1.4  ×  0.49
     = 0.686
```

`r_pb = 0.69` — strong positive. Q12 discriminates well. Students who got it right are higher overall scorers; students who got it wrong are lower overall scorers. Keep this question.

Now imagine Q13:
- p = 0.6, q = 0.4 (same)
- Mean of right-getters = 36.0
- Mean of wrong-getters = 41.0   ← wrong-getters score HIGHER overall
- σ = 5.0

```
r_pb = (36.0 − 41.0) / 5.0  ×  √0.24
     = −1.0  ×  0.49
     = −0.49
```

`r_pb = −0.49` — strong NEGATIVE. **High-scoring students got Q13 WRONG more often.** This is almost always a sign that:
- The answer key is miskeyed (the "right" answer is actually wrong)
- The question is ambiguous and strong students overthink it
- Two answers are arguably correct
- The wording trips up students who know the material

Pull Q13 out of scoring or rewrite it.

---

## Why it matters for Exam Management

ExamSoft surfaces point-biserial in standalone reports — separated from authoring. Faculty has to dig.

Aarti's "embedded workflow intelligence" differentiator: surface point-biserial **at decision time** — when the faculty is reviewing assessment results and deciding what to do next term:

- High `r_pb`: keep this question. Maybe pin it.
- Near-zero `r_pb`: review wording. Either too easy / too hard, or doesn't test what we think.
- Negative `r_pb`: mandatory review. Likely a flaw. Consider excluding from the score (curving).

The `r_pb` value pairs with three other signals:
- **Difficulty** (`p` = % who got it right) — too easy (>0.85) or too hard (<0.30)
- **Distractor analysis** (which wrong answer was picked most often)
- **Bloom's level** (cognitive complexity)

Together these tell the story. `r_pb` alone is insufficient; `r_pb` plus difficulty plus distractor distribution is the full diagnostic.

---

## Caveats / things to be careful about

1. **Small sample sizes give unstable values.** With <10 students, `r_pb` swings wildly. Most accreditors recommend N ≥ 30 before trusting the value.
2. **Restricted range inflates appearances.** If everyone scores between 80%-100%, your σ shrinks, and `r_pb` magnitudes get noisier.
3. **`r_pb` is a *post-administration* metric.** It can't tell you if a question is good before students take it. Only after.
4. **Pre-set difficulty (faculty-declared "Hard") is different.** Don't conflate `r_pb` with pre-set difficulty in UI. Aarti rejected the 2D scatter on this exact point.
5. **`r_pb` is a sample statistic.** It applies to the cohort that took the test. New cohort = recalculate.

---

## How I'd surface it in design

Per Aarti's 2026-05-08 directive ("don't do any work using point-biserial until you understand it"), this explainer is the prerequisite. Now that the math is clear:

1. **Per-question card** in assessment review (UC-14): show `r_pb` as a single value with a 3-band color cue (green ≥ 0.30, neutral 0–0.30, amber/orange < 0). Pair with a tooltip explaining the value at a glance: "Discrimination 0.69 — students who got this right scored higher overall."
2. **Sort/filter** in question lists: "show me all questions with r_pb < 0" → review queue for next term.
3. **DON'T use a 2D scatter** of `r_pb` × difficulty as a primary surface. Aarti called this out: too easy to misread; conflates faculty-set difficulty with calculated difficulty. Use side-by-side numbers + 3-tier difficulty bars instead.
4. **NEVER red** for negative `r_pb` (VIZ-004). Use amber/orange — same as below-threshold scoring everywhere else in the harness.

---

## Glossary terms (for `apps/exam-management/docs/content.md`)

- **Point-biserial correlation (`r_pb`)** — item statistic correlating a single question's correctness with the overall test score. High positive = good discriminator. Negative = broken question (likely miskeyed or ambiguous). Range: −1 to +1.
- **Discrimination index** — informal name for `r_pb` in some pedagogical literature.
- **Item difficulty (`p`)** — proportion of test-takers who answered correctly. Distinct from faculty-set "difficulty tier."
- **Negative-performing question** — question with `r_pb` < 0. High-scorers get it wrong more often than low-scorers. Strong signal of an item-writing flaw.

---

## Note for Aarti

Aarti — I've read up on point-biserial. Confirming I understand:

1. It's just Pearson correlation between right/wrong on this question and overall test score.
2. The formula reduces to `(M₁ - M₀)/σ × √(pq)` where the second factor accounts for split balance.
3. Negative values are the most actionable signal — almost always a broken question.
4. Sample size and restricted range are the two big caveats.

I won't put `r_pb` into design surfaces until we've aligned on:
- Where to show it (per-question card in assessment review — primary)
- How to color it (3-band, no red)
- What to pair it with (difficulty, distractors, Bloom's)
- What threshold triggers a "review queue" vs "good"

Will revisit per-question card design with these constraints.

— Romit

---

## Source provenance

Aarti directive: 2026-05-08 12:44 PM EDT meeting (`4e1c850e`).
Memory: workspace `feedback_no_visual_polish` and `feedback_aarti_no_red` apply (no red in score viz).
Pattern reference: `docs/patterns/dashboards/two-question-dashboard.md` (per-question analysis composition).
