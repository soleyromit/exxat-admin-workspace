import { describe, it, expect } from 'vitest'
import { offeringPoints, facultyStats, courseStats } from './pce-analytics'

describe('offeringPoints surveyStatus', () => {
  it('every offering has a surveyStatus of a real SurveyStatus value or "historical"', () => {
    const points = offeringPoints()
    expect(points.length).toBeGreaterThan(0)
    const valid = new Set(['draft', 'active', 'collecting', 'scheduled', 'pending_review', 'released', 'closed', 'archived', 'historical'])
    for (const p of points) {
      expect(valid.has(p.surveyStatus)).toBe(true)
    }
  })
})

describe('facultyStats gating', () => {
  it('score is a ScoreCell, not a bare DualMean', () => {
    const stats = facultyStats()
    expect(stats.length).toBeGreaterThan(0)
    for (const s of stats) {
      expect(['value', 'pending', 'na']).toContain(s.score.state)
    }
  })

  it('sorts value-state rows best-first and sinks pending/na to the bottom', () => {
    const stats = facultyStats()
    const valueRows = stats.filter((s) => s.score.state === 'value')
    for (let i = 1; i < valueRows.length; i++) {
      const prev = valueRows[i - 1]!.score
      const cur = valueRows[i]!.score
      if (prev.state === 'value' && cur.state === 'value') {
        expect(prev.value.weighted).toBeGreaterThanOrEqual(cur.value.weighted)
      }
    }
    // every pending/na row comes after every value row
    const firstNonValueIndex = stats.findIndex((s) => s.score.state !== 'value')
    if (firstNonValueIndex !== -1) {
      expect(stats.slice(firstNonValueIndex).every((s) => s.score.state !== 'value')).toBe(true)
    }
  })
})

describe('courseStats gating', () => {
  it('score and facultyScore are both ScoreCells', () => {
    const stats = courseStats()
    expect(stats.length).toBeGreaterThan(0)
    for (const s of stats) {
      expect(['value', 'pending', 'na']).toContain(s.score.state)
      expect(['value', 'pending', 'na']).toContain(s.facultyScore.state)
    }
  })
})
