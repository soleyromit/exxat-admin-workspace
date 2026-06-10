'use client'

/* SectionCard — a draggable section with header, question list, and add toolbar.
   Faithful port of the SectionCard render in the Claude Design builder.jsx. */

import { Button, Card, CardHeader, CardContent, Badge, Input, AvatarInitials } from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import { FACULTY, type Section, type Question, type ReviewStatus } from '../data'
import { QuestionItem } from './question-item'

// Review status → [token color, label]. Color drives the Badge dot + text tint.
const REVIEW_CHIP: Record<ReviewStatus, [string, string]> = {
  'in-progress': ['var(--chip-4)', 'Drafting'],
  'submitted': ['var(--chip-1)', 'Submitted for review'],
  'not-started': ['var(--muted-foreground)', 'Not started'],
  'approved': ['var(--chip-2)', 'Approved'],
  'changes': ['var(--destructive)', 'Changes requested'],
}

export interface SectionCardProps {
  sec: Section
  collapsed: boolean
  disabled?: boolean
  selectedIds: string[]
  dragId: string | null
  onToggleCollapse: () => void
  onRename: (name: string) => void
  onSelect: (qId: string) => void
  onEditQuestion: (q: Question) => void
  onReplaceQuestion: (q: Question) => void
  onDeleteQuestion: (qId: string) => void
  onNewQuestion: () => void
  onAddBank: () => void
  onAddAI: () => void
  onSettings: () => void
  onSecDragStart: () => void
  onSecDrop: () => void
  onQDragStart: (qId: string) => void
  onQDrop: (targetQId: string | null) => void
  onQDragEnd: () => void
  flagRef?: (el: HTMLDivElement | null) => void
}

export function SectionCard(p: SectionCardProps) {
  const { sec } = p
  const chip = REVIEW_CHIP[sec.reviewStatus] || REVIEW_CHIP['not-started']
  const pts = sec.questions.reduce((a, q) => a + (q.bonus ? 0 : q.points), 0)

  return (
    <Card onDragOver={e => e.preventDefault()} onDrop={p.onSecDrop} style={{ opacity: p.dragId === sec.id ? 0.5 : 1, overflow: 'hidden' }}>
      <CardHeader className="bg-muted flex flex-row items-center gap-2 p-3 space-y-0" draggable onDragStart={p.onSecDragStart}>
        <span style={{ cursor: 'grab', color: 'var(--muted-foreground)' }}><Icon name="grip-vertical" /></span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={p.collapsed ? 'Expand section' : 'Collapse section'} onClick={p.onToggleCollapse}>
          <Icon name={p.collapsed ? 'chevron-right' : 'chevron-down'} />
        </Button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input aria-label="Section name" value={sec.name} disabled={p.disabled} onChange={e => p.onRename(e.target.value)} style={{ fontWeight: 600, height: 'auto', padding: '2px 6px', background: 'transparent' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
            <span className="hint">{sec.questions.length} Q · {pts} pts · {sec.timeLimit} min</span>
            {sec.preRead && <Badge variant="outline"><Icon name="file-lines" />Pre-read</Badge>}
            <Badge variant="secondary" style={{ color: chip[0] }}>{chip[1]}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span title={`Delegated to ${FACULTY[sec.owner].name}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AvatarInitials size="sm" initials={FACULTY[sec.owner].initials} />
          </span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Section options" onClick={p.onSettings}><Icon name="ellipsis" /></Button>
        </div>
      </CardHeader>

      {!p.collapsed && (
        <CardContent className="p-3" onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); p.onQDrop(null) }}>
          {sec.questions.length === 0 && (
            <div className="empty" style={{ padding: '26px 10px' }}>
              <Icon name="circle-plus" /><div>No questions yet — add from the bank, author manually, or generate with AI.</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sec.questions.map(q => (
              <div key={q.id} ref={q.flagged && p.flagRef ? p.flagRef : null} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); p.onQDrop(q.id) }}>
                <QuestionItem
                  q={q}
                  selected={p.selectedIds.includes(q.id)}
                  dragging={p.dragId === q.id}
                  onSelect={() => p.onSelect(q.id)}
                  onEdit={() => p.onEditQuestion(q)}
                  onReplace={() => p.onReplaceQuestion(q)}
                  onDelete={() => p.onDeleteQuestion(q.id)}
                  dragProps={{ onDragStart: () => p.onQDragStart(q.id), onDragEnd: p.onQDragEnd }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Button type="button" variant="outline" size="sm" onClick={p.onNewQuestion}><Icon name="plus" />New question</Button>
            <Button type="button" variant="outline" size="sm" onClick={p.onAddBank}><Icon name="rectangle-list" />Add from bank</Button>
            <Button type="button" variant="outline" size="sm" onClick={p.onAddAI}>
              <LeoStar />Generate with AI
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
