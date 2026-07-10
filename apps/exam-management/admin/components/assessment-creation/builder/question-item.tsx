'use client'

/* QuestionItem — card-density question card. Faithful port of the card branch
   of QuestionItem in the Claude Design builder.jsx. */

import type { DragEventHandler } from 'react'
import { Card, CardContent, Button, Badge, Checkbox } from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import { QTYPE, qIcon, fmt2, type Question } from '../data'

export interface QuestionItemProps {
  q: Question
  qIndex?: number
  selected: boolean
  dragging?: boolean
  onSelect: () => void
  onEdit: () => void
  onReplace: () => void
  onDelete: () => void
  dragProps?: { onDragStart?: DragEventHandler; onDragEnd?: DragEventHandler }
}

export function QuestionItem({ q, qIndex, selected, dragging, onSelect, onEdit, onReplace, onDelete, dragProps }: QuestionItemProps) {
  const flagged = !!q.flagged
  const opts = q.options || []
  return (
    <Card
      draggable
      {...dragProps}
      onClick={onEdit}
      title="Open question to edit"
      style={{
        opacity: dragging ? 0.4 : 1,
        cursor: 'pointer',
        borderColor: flagged ? 'var(--destructive)' : selected ? 'var(--ring)' : undefined,
        borderWidth: selected ? 2 : undefined,
      }}
    >
      <CardContent className="p-3">
      <div style={{ display: 'flex', gap: 11 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 }} onClick={e => e.stopPropagation()}>
          {qIndex != null && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', lineHeight: 1, minWidth: 18, textAlign: 'center' }}>
              Q{qIndex}
            </span>
          )}
          <span style={{ cursor: 'grab', color: 'var(--muted-foreground)' }}><Icon name="grip-vertical" /></span>
          <Checkbox aria-label={selected ? 'Deselect question' : 'Select question'} checked={selected} onCheckedChange={() => onSelect()} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* tag row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>
            <Badge variant="outline"><Icon name={qIcon(q.type)} />{QTYPE[q.type].short}</Badge>
            <Badge variant="outline">{q.difficulty}</Badge>
            <Badge variant="outline">{q.topic}</Badge>
            <Badge variant="outline">{q.bloom}</Badge>
            {q.source === 'ai' && <Badge variant="secondary"><LeoStar />AI</Badge>}
            {q.source === 'bank' && <Badge variant="outline"><Icon name="rectangle-list" />Bank</Badge>}
            {q.bonus && <Badge variant="secondary">Bonus</Badge>}
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600 }}>{q.points} pts</span>
          </div>
          {/* stem */}
          <div style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--foreground)' }}>{q.stem}</div>
          {/* options preview */}
          {(q.type === 'mcq' || q.type === 'msq' || q.type === 'tf') && opts.length > 0 && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: opts.length > 3 ? '1fr 1fr' : '1fr', gap: '3px 16px' }}>
              {opts.slice(0, 5).map((o, i) => (
                <div key={i} style={{ fontSize: 12, color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={o.correct ? 'circle-check' : 'circle'} style={{ fontSize: 12 }} />{o.text}
                </div>
              ))}
            </div>
          )}
          {/* flag banner */}
          {flagged && (
            <div className="flag-banner" style={{ marginTop: 9 }}>
              <Icon name="triangle-exclamation" style={{ fontSize: 13, marginTop: 1 }} /><div>{q.flagged!.reason}</div>
            </div>
          )}
          {/* psychometrics */}
          {q.psy && (
            <div style={{ display: 'flex', gap: 16, marginTop: 9, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <span>Difficulty <b style={{ color: 'var(--foreground)' }}>{fmt2(q.psy.p)}</b></span>
              <span>Discrimination <b style={{ color: 'var(--foreground)' }}>{fmt2(q.psy.disc)}</b></span>
              <span>Pt-biserial <b style={{ color: q.psy.pbi < 0.1 ? 'var(--destructive)' : 'var(--foreground)' }}>{fmt2(q.psy.pbi)}</b></span>
            </div>
          )}
          {/* actions */}
          <div style={{ display: 'flex', gap: 6, marginTop: 11 }} onClick={e => e.stopPropagation()}>
            <Button type="button" variant="ghost" size="sm" onClick={onEdit}><Icon name="pen" />Edit</Button>
            <Button type="button" variant="ghost" size="sm" onClick={onReplace}><LeoStar />Replace</Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete question" onClick={onDelete}><Icon name="trash" /></Button>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )
}
