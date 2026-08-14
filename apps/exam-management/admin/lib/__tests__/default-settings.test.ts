import { describe, it, expect } from 'vitest'
import { defaultAssessmentSettings } from '../qb-types'

describe('defaultAssessmentSettings — new P1 fields', () => {
  it('includes all new P1 fields with correct defaults', () => {
    const s = defaultAssessmentSettings()
    expect(s.isHighStakes).toBe(false)
    expect(s.passingScore).toBeNull()
    expect(s.allowComments).toBe(false)
    expect(s.referenceMaterials).toEqual([])
    expect(s.warnOnBlankQuestion).toBe(false)
    expect(s.submitButtonVisibility).toBe('always')
    expect(s.scoreDisplay).toBe('raw-and-percent')
    expect(s.preReadDocuments).toEqual([])
  })

  it('includes P2 fields with correct defaults', () => {
    const s = defaultAssessmentSettings()
    expect(s.reviewShowsCorrectAnswers).toBe(false)
    expect(s.reviewSessionStart).toBeNull()
    expect(s.reviewSessionEnd).toBeNull()
  })

  it('accepts explicit type argument', () => {
    expect(defaultAssessmentSettings('Pop Quiz').type).toBe('Pop Quiz')
  })
})
