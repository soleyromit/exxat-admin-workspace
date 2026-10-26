import { describe, it, expect } from 'vitest'
import {
  computeTotalAssigned,
  computeBonusTotal,
  computeUnassignedPts,
  distributeEvenly,
  computeSectionSubtotals,
  computeNegativeDeduction,
} from '../assessment-grading'
import type { AssessmentQuestion, AssessmentSection } from '../qb-types'

function q(id: string, points: number, bonus = false): AssessmentQuestion {
  return { questionId: id, order: 1, points, bonus }
}

describe('computeTotalAssigned', () => {
  it('sums non-bonus question points', () => {
    expect(computeTotalAssigned([q('a', 10), q('b', 20), q('c', 5, true)])).toBe(30)
  })
  it('returns 0 for empty list', () => {
    expect(computeTotalAssigned([])).toBe(0)
  })
  it('returns 0 when all questions are bonus', () => {
    expect(computeTotalAssigned([q('a', 10, true)])).toBe(0)
  })
})

describe('computeBonusTotal', () => {
  it('sums bonus question points only', () => {
    expect(computeBonusTotal([q('a', 10), q('b', 5, true)])).toBe(5)
  })
  it('returns 0 when no bonus questions', () => {
    expect(computeBonusTotal([q('a', 10)])).toBe(0)
  })
})

describe('computeUnassignedPts', () => {
  it('returns positive when pts are unassigned', () => {
    expect(computeUnassignedPts(100, [q('a', 40), q('b', 40)])).toBe(20)
  })
  it('returns 0 when fully assigned', () => {
    expect(computeUnassignedPts(100, [q('a', 60), q('b', 40)])).toBe(0)
  })
  it('returns negative when over budget', () => {
    expect(computeUnassignedPts(100, [q('a', 60), q('b', 50)])).toBe(-10)
  })
  it('excludes bonus from the assigned total', () => {
    expect(computeUnassignedPts(100, [q('a', 90), q('b', 5, true)])).toBe(10)
  })
})

describe('distributeEvenly', () => {
  it('distributes evenly when divisible', () => {
    const result = distributeEvenly([q('a', 0), q('b', 0)], 100)
    expect(result.find(r => r.questionId === 'a')!.points).toBe(50)
    expect(result.find(r => r.questionId === 'b')!.points).toBe(50)
  })
  it('puts remainder on first non-bonus question', () => {
    const result = distributeEvenly([q('a', 0), q('b', 0), q('c', 0)], 100)
    expect(result[0].points).toBe(34) // 33 + 1 remainder
    expect(result[1].points).toBe(33)
    expect(result[2].points).toBe(33)
  })
  it('does not touch bonus questions', () => {
    const result = distributeEvenly([q('a', 0), q('bonus', 10, true)], 100)
    expect(result.find(r => r.questionId === 'bonus')!.points).toBe(10)
    expect(result.find(r => r.questionId === 'a')!.points).toBe(100)
  })
  it('returns unchanged list when all questions are bonus', () => {
    const qs = [q('a', 10, true)]
    expect(distributeEvenly(qs, 100)).toEqual(qs)
  })
})

describe('computeSectionSubtotals', () => {
  it('sums pts for questions in each section', () => {
    const questions = [q('q1', 10), q('q2', 20), q('q3', 30)]
    const sections: AssessmentSection[] = [
      { id: 's1', title: 'A', questionIds: ['q1', 'q2'] },
      { id: 's2', title: 'B', questionIds: ['q3'] },
    ]
    const result = computeSectionSubtotals(sections, questions)
    expect(result.get('s1')).toBe(30)
    expect(result.get('s2')).toBe(30)
  })
  it('includes bonus questions in section subtotal', () => {
    const questions = [q('q1', 10), q('q2', 5, true)]
    const sections: AssessmentSection[] = [
      { id: 's1', title: 'A', questionIds: ['q1', 'q2'] },
    ]
    expect(computeSectionSubtotals(sections, questions).get('s1')).toBe(15)
  })
  it('returns 0 for empty section', () => {
    const sections: AssessmentSection[] = [{ id: 's1', title: 'A', questionIds: [] }]
    expect(computeSectionSubtotals(sections, []).get('s1')).toBe(0)
  })
})

describe('computeNegativeDeduction', () => {
  it('returns negative fraction of points', () => {
    expect(computeNegativeDeduction(10, 0.25)).toBe(-2.5)
  })
  it('returns 0 for zero points', () => {
    expect(computeNegativeDeduction(0, 0.25)).toBe(0)
  })
})
