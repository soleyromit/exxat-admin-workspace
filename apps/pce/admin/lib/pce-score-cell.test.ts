import { describe, it, expect } from 'vitest'
import { gatedScore, averageValueCells, type ScoreCell } from './pce-score-cell'

type Row = { status: 'closed' | 'released' | 'historical' | 'active' | 'pending_review' | 'archived' }

describe('gatedScore', () => {
  it('returns na for an empty offering list', () => {
    const cell = gatedScore<number>([], (r: Row) => r.status, () => 42)
    expect(cell).toEqual({ state: 'na' })
  })

  it('returns na when every offering is archived', () => {
    const rows: Row[] = [{ status: 'archived' }, { status: 'archived' }]
    const cell = gatedScore<number>(rows, (r) => r.status, () => 42)
    expect(cell).toEqual({ state: 'na' })
  })

  it('returns pending when any non-archived offering is not closed/released/historical', () => {
    const rows: Row[] = [{ status: 'closed' }, { status: 'active' }]
    const cell = gatedScore<number>(rows, (r) => r.status, () => 42)
    expect(cell).toEqual({ state: 'pending' })
  })

  it('returns pending for pending_review — it does not count as closed', () => {
    const rows: Row[] = [{ status: 'pending_review' }]
    const cell = gatedScore<number>(rows, (r) => r.status, () => 42)
    expect(cell).toEqual({ state: 'pending' })
  })

  it('returns a computed value when every non-archived offering is closed/released/historical', () => {
    const rows: Row[] = [{ status: 'closed' }, { status: 'released' }, { status: 'historical' }]
    const cell = gatedScore<number>(rows, (r) => r.status, (closed) => closed.length)
    expect(cell).toEqual({ state: 'value', value: 3 })
  })

  it('excludes archived offerings from the compute call and from the pending check', () => {
    const rows: Row[] = [{ status: 'closed' }, { status: 'archived' }]
    const cell = gatedScore<number>(rows, (r) => r.status, (closed) => closed.length)
    expect(cell).toEqual({ state: 'value', value: 1 })
  })
})

describe('averageValueCells', () => {
  it('averages only value-state cells, skipping pending/na', () => {
    const cells: ScoreCell<number>[] = [
      { state: 'value', value: 4 },
      { state: 'pending' },
      { state: 'value', value: 6 },
      { state: 'na' },
    ]
    expect(averageValueCells(cells)).toBe(5)
  })

  it('returns null when zero cells have a real value', () => {
    const cells: ScoreCell<number>[] = [{ state: 'pending' }, { state: 'na' }]
    expect(averageValueCells(cells)).toBeNull()
  })
})
