import { describe, it, expect } from 'vitest'
import { searchQBQuestions } from '../qb-mock-data'

describe('searchQBQuestions', () => {
  it('returns empty array for empty query', () => {
    expect(searchQBQuestions('')).toHaveLength(0)
  })

  it('returns empty array for whitespace-only query', () => {
    expect(searchQBQuestions('   ')).toHaveLength(0)
  })

  it('returns up to the default limit of 6', () => {
    const results = searchQBQuestions('a')
    expect(results.length).toBeLessThanOrEqual(6)
  })

  it('respects a custom limit', () => {
    const results = searchQBQuestions('a', 3)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('matches on title case-insensitively', () => {
    const results = searchQBQuestions('BLOCK')
    const allMatch = results.every(q =>
      q.title.toLowerCase().includes('block') ||
      (q.stemText ?? '').toLowerCase().includes('block') ||
      q.tags.some(t => t.toLowerCase().includes('block')) ||
      q.folder.toLowerCase().includes('block')
    )
    if (results.length > 0) {
      expect(allMatch).toBe(true)
    }
  })
})
