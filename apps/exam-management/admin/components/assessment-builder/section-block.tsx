'use client'

import { useState } from 'react'
import { Button, Avatar, AvatarFallback } from '@exxatdesignux/ui'
import { QuestionCard, type QuestionCardProps } from './question-card'

export interface SectionBlockProps {
  index: number
  title: string
  facultyLabel?: string | null
  ready: boolean
  questionCount: number
  target?: number | null
  cards: Array<QuestionCardProps & { rowKey: string }>
  onAnalysis?: () => void
  onAdd?: (mode: 'qb' | 'ai' | 'write' | 'pdf') => void
  reviewStatus?: 'not-started' | 'drafting' | 'submitted' | 'approved'
  ownerInitials?: string
  ownerName?: string
  totalPoints?: number
  timeLimit?: number
  collapsed?: boolean
  onToggleCollapse?: () => void
  onTitleChange?: (val: string) => void
  onSettings?: () => void
}

// Maps to design's .chip.active / .chip.pending / .chip.review / .chip.muted
const CHIP: Record<string, { dot: string; text: string; border: string; label: string }> = {
  'not-started': {
    dot: 'var(--muted-foreground)', text: 'var(--muted-foreground)',
    border: 'var(--border)', label: 'Not started',
  },
  'drafting': {
    dot: 'var(--chip-4)', text: 'var(--chip-4)',
    border: 'oklch(from var(--chart-4) l c h / 0.4)', label: 'Drafting',
  },
  'submitted': {
    dot: 'var(--chip-3)', text: 'var(--chip-3)',
    border: 'oklch(from var(--chart-3) l c h / 0.4)', label: 'Submitted for review',
  },
  'approved': {
    dot: 'var(--chip-2)', text: 'var(--chip-2)',
    border: 'oklch(from var(--chart-2) l c h / 0.4)', label: 'Approved',
  },
}

export function SectionBlock(p: SectionBlockProps) {
  const [localCollapsed, setLocalCollapsed] = useState(false)
  const collapsed = p.collapsed !== undefined ? p.collapsed : localCollapsed
  const toggleCollapse = p.onToggleCollapse ?? (() => setLocalCollapsed(c => !c))
  const chip = CHIP[p.reviewStatus ?? 'not-started'] ?? CHIP['not-started']

  return (
    // .sec-card
    <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>

      {/* .sec-head — muted background */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>

        {/* .grip */}
        <i className="fa-light fa-grip-vertical" aria-hidden="true" style={{ color: 'var(--border-control)', cursor: 'grab', fontSize: 15, display: 'inline-flex' }} />

        {/* Collapse chevron — .icon-btn 26×26 */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
          onClick={toggleCollapse}
          style={{ flexShrink: 0, color: 'var(--muted-foreground)' }}
        >
          <i className={`fa-light fa-chevron-${collapsed ? 'right' : 'down'}`} aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>

        {/* Name + metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* .sec-name */}
          <input
            aria-label={`Section ${p.index + 1} name`}
            defaultValue={p.title}
            onChange={e => p.onTitleChange?.(e.target.value)}
            style={{
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
              border: '1px solid transparent', borderRadius: 7,
              padding: '2px 7px', margin: '0 -7px',
              background: 'transparent', color: 'var(--foreground)',
              outline: 'none', width: '100%',
            }}
            onMouseEnter={e => { (e.target as HTMLInputElement).style.background = 'var(--card)' }}
            onMouseLeave={e => { if (document.activeElement !== e.target) (e.target as HTMLInputElement).style.background = 'transparent' }}
            onFocus={e => { e.target.style.background = 'var(--card)'; e.target.style.borderColor = 'var(--border-control-3)' }}
            onBlur={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'transparent' }}
          />
          {/* .hint + .chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              {p.questionCount} Q
              {p.totalPoints != null ? ` · ${p.totalPoints} pts` : ''}
              {p.timeLimit != null ? ` · ${p.timeLimit} min` : ''}
            </span>
            {/* .chip — always show (muted when not-started) */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 20, padding: '0 9px', borderRadius: 999,
              border: `1px solid ${chip.border}`,
              fontSize: 11, fontWeight: 500, color: chip.text, background: 'var(--card)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: chip.dot, display: 'inline-block', flexShrink: 0 }} />
              {chip.label}
            </span>
          </div>
        </div>

        {/* Owner avatar */}
        {p.ownerInitials && (
          <span title={p.ownerName ?? p.ownerInitials} style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar style={{ width: 24, height: 24 }}>
              <AvatarFallback style={{ fontSize: 10, fontWeight: 600, background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                {p.ownerInitials}
              </AvatarFallback>
            </Avatar>
          </span>
        )}

        {/* Ellipsis — .icon-btn 28×28 */}
        {(p.onSettings || p.onAnalysis) && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Section options"
            onClick={p.onSettings ?? p.onAnalysis}
            style={{ color: 'var(--muted-foreground)' }}
          >
            <i className="fa-light fa-ellipsis" aria-hidden="true" style={{ fontSize: 15 }} />
          </Button>
        )}
      </div>

      {/* .sec-body */}
      {!collapsed && (
        <div style={{ padding: 16 }}>

          {/* Empty state — .empty */}
          {p.cards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '26px 10px', color: 'var(--muted-foreground)' }}>
              <i className="fa-light fa-circle-plus" aria-hidden="true" style={{ fontSize: 30, opacity: 0.4, marginBottom: 12, display: 'block' }} />
              <div>No questions yet — add from the bank, author manually, or generate with AI.</div>
            </div>
          )}

          {/* Question cards — gap 10 (card density) */}
          {p.cards.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.cards.map(({ rowKey, ...card }) => (
                <QuestionCard key={rowKey} {...card} />
              ))}
            </div>
          )}

          {/* Per-section add toolbar */}
          {p.onAdd && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={() => p.onAdd!('write')}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                New question
              </Button>
              <Button variant="outline" size="sm" onClick={() => p.onAdd!('qb')}>
                <i className="fa-light fa-rectangle-list" aria-hidden="true" />
                Add from bank
              </Button>
              {/* AI button — brand-colored text to distinguish from plain outline */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => p.onAdd!('ai')}
                style={{ color: 'var(--brand-color-dark)', borderColor: 'oklch(from var(--brand-color) l c h / 0.3)' }}
              >
                <i className="fa-duotone fa-star-christmas" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                Generate with AI
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
