import type { AssessmentQuestion, AssessmentSection } from './qb-types'

/** Sum of points for non-bonus questions only. Used as the "assigned" total vs totalMarks. */
export function computeTotalAssigned(questions: AssessmentQuestion[]): number {
  return questions.filter(q => !q.bonus).reduce((sum, q) => sum + q.points, 0)
}

/** Sum of points for bonus questions only. */
export function computeBonusTotal(questions: AssessmentQuestion[]): number {
  return questions.filter(q => q.bonus).reduce((sum, q) => sum + q.points, 0)
}

/** Positive = pts still unassigned. Negative = pts over budget. Zero = fully assigned. */
export function computeUnassignedPts(
  totalMarks: number,
  questions: AssessmentQuestion[],
): number {
  return totalMarks - computeTotalAssigned(questions)
}

/**
 * Distribute totalMarks evenly across non-bonus questions.
 * Remainder from floor division goes to the first non-bonus question.
 * Bonus questions are returned unchanged.
 */
export function distributeEvenly(
  questions: AssessmentQuestion[],
  totalMarks: number,
): AssessmentQuestion[] {
  const nonBonus = questions.filter(q => !q.bonus)
  const n = nonBonus.length
  if (n === 0) return questions
  const each = Math.floor(totalMarks / n)
  const remainder = totalMarks - each * n
  const nonBonusIds = new Set(nonBonus.map(q => q.questionId))
  let remainderAssigned = false
  return questions.map(q => {
    if (!nonBonusIds.has(q.questionId)) return q
    if (!remainderAssigned) {
      remainderAssigned = true
      return { ...q, points: each + remainder }
    }
    return { ...q, points: each }
  })
}

/**
 * Points-per-section map. Includes bonus questions in section subtotals
 * so faculty can see the full picture, even though bonus pts are excluded
 * from the main totalAssigned count.
 */
export function computeSectionSubtotals(
  sections: AssessmentSection[],
  questions: AssessmentQuestion[],
): Map<string, number> {
  const ptsByQId = new Map(questions.map(q => [q.questionId, q.points]))
  return new Map(
    sections.map(s => [
      s.id,
      s.questionIds.reduce((sum, qId) => sum + (ptsByQId.get(qId) ?? 0), 0),
    ]),
  )
}

/** The negative deduction amount displayed for one wrong MCQ answer. Always negative. */
export function computeNegativeDeduction(points: number, fraction: number): number {
  const deduction = -(points * fraction)
  // Avoid returning -0 for zero points
  return deduction === 0 ? 0 : deduction
}
