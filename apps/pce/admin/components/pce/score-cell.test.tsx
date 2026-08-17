import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreCellText } from './score-cell'

describe('ScoreCellText', () => {
  it('renders the formatted value when state is value', () => {
    render(<ScoreCellText cell={{ state: 'value', value: 4.19 }} format={(v) => v.toFixed(2)} />)
    expect(screen.getByText('4.19')).toBeInTheDocument()
  })

  it('renders "Pending" when state is pending', () => {
    render(<ScoreCellText cell={{ state: 'pending' }} format={(v) => v.toFixed(2)} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders an em dash when state is na', () => {
    render(<ScoreCellText cell={{ state: 'na' }} format={(v) => v.toFixed(2)} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
