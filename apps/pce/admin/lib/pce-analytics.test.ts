import { describe, it, expect } from 'vitest'
import { offeringPoints } from './pce-analytics'

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
