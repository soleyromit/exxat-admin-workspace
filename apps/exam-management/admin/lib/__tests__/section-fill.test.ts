import { describe, it, expect } from 'vitest'
import type { AssessmentSection } from '../qb-types'

// Copy of the updated sectionFillPct logic — tested here before wiring into React component
function sectionFillPct(sec: AssessmentSection): number {
  const target = sec.fillTarget?.value ?? sec.questionTarget ?? 20
  return Math.min(100, Math.round((sec.questionIds.length / target) * 100))
}

function sec(overrides: Partial<AssessmentSection> = {}): AssessmentSection {
  return { id: 's1', title: 'Test', questionIds: [], ...overrides }
}

describe('sectionFillPct with fillTarget', () => {
  it('returns 0 when empty with fillTarget', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 15 } }))).toBe(0)
  })

  it('returns 53 when 8 of 15 filled', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 15 }, questionIds: Array(8).fill('q') }))).toBe(53)
  })

  it('returns 100 when filled equals target', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 10 }, questionIds: Array(10).fill('q') }))).toBe(100)
  })

  it('caps at 100 when overfilled', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 5 }, questionIds: Array(7).fill('q') }))).toBe(100)
  })

  it('falls back to questionTarget when fillTarget is null', () => {
    expect(sectionFillPct(sec({ fillTarget: null, questionTarget: 10, questionIds: Array(5).fill('q') }))).toBe(50)
  })

  it('falls back to 20 when both fillTarget and questionTarget are absent', () => {
    expect(sectionFillPct(sec({ questionIds: Array(4).fill('q') }))).toBe(20)
  })
})
