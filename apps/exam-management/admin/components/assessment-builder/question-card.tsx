'use client'

import {
  Avatar, AvatarFallback, AvatarGroup,
  Button,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@exxatdesignux/ui'

export interface QuestionCardProps {
  index: number
  total: number
  stem: string
  type: string
  typeIcon?: string
  difficulty: string
  diffColor: string
  blooms: string
  pbi: number | null
  points: number
  version: number
  selected: boolean
  pinned: boolean
  lastMoved?: boolean
  provenance?: { icon: string; title: string; color: string } | null
  flagTitle?: string | null
  creator?: { initials: string; name: string } | null
  editor?: { initials: string; name: string } | null
  onToggleSelect: (checked: boolean) => void
  onOpenDetail: () => void
  onReorder: (dir: 'up' | 'down') => void
  onTogglePin: () => void
  onSetPoints: (v: number) => void
  topic?: string
  source?: 'ai' | 'bank' | 'manual'
  options?: Array<{ text: string; correct: boolean }>
  onEdit?: () => void
  onDelete?: () => void
}

// Difficulty tint backgrounds using relative oklch colors
function diffBgColor(difficulty: string) {
  if (difficulty === 'Easy') return 'oklch(from var(--chart-2) l c h / 0.14)'
  if (difficulty === 'Hard') return 'oklch(from var(--destructive) l c h / 0.12)'
  return 'oklch(from var(--chart-4) l c h / 0.16)'
}

function diffTextColor(_difficulty: string, diffColor: string) {
  // diffColor is already set by caller (var(--chip-2), var(--chip-4), etc.)
  return diffColor
}

export function QuestionCard(p: QuestionCardProps) {
  const flagged = !!p.flagTitle
  const handleEdit = p.onEdit ?? p.onOpenDetail

  // .q-card (+ .q-card.flagged variant)
  const cardStyle: React.CSSProperties = {
    background: p.lastMoved ? 'var(--brand-tint)' : 'var(--card)',
    border: flagged
      ? '1px solid oklch(from var(--destructive) l c h / 0.4)'
      : '1px solid var(--border)',
    borderRadius: 13,
    padding: '14px 16px',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: 11 }}>

        {/* Left col: grip + checkbox + index */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginTop: 2, flexShrink: 0 }}>
          {/* .grip */}
          <i className="fa-light fa-grip-vertical" aria-hidden="true" style={{ color: 'var(--border-control)', cursor: 'grab', fontSize: 14 }} />
          {/* checkbox — .chk-btn */}
          <input
            type="checkbox"
            aria-label={`Select question ${p.index + 1}`}
            checked={p.selected}
            onChange={e => p.onToggleSelect(e.target.checked)}
            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--brand-color)' }}
          />
          {/* index */}
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
            {p.index + 1}
          </span>
        </div>

        {/* Right col: tag row + stem + options + flag + psy + actions */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tag row — above stem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>

            {/* Type .tag */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted-foreground)', background: 'var(--card)', fontWeight: 500 }}>
              {p.typeIcon && <i className={p.typeIcon} aria-hidden="true" style={{ fontSize: 9 }} />}
              {p.type}
            </span>

            {/* Difficulty .diff */}
            <span style={{ height: 22, padding: '0 8px', borderRadius: 7, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', color: diffTextColor(p.difficulty, p.diffColor), background: diffBgColor(p.difficulty) }}>
              {p.difficulty}
            </span>

            {/* Topic .tag */}
            {p.topic && (
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--card)' }}>
                {p.topic}
              </span>
            )}

            {/* Bloom .tag */}
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--card)' }}>
              {p.blooms}
            </span>

            {/* Source badges */}
            {p.source === 'ai' && (
              // .tag.brand — AI source
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 7, border: '1px solid oklch(from var(--brand-color) l c h / 0.3)', fontSize: 10, fontWeight: 500, color: 'var(--brand-color-dark)', background: 'oklch(from var(--brand-color) l c h / 0.06)' }}>
                <i className="fa-duotone fa-star-christmas" aria-hidden="true" style={{ fontSize: 9 }} />
                AI
              </span>
            )}
            {p.source === 'bank' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--card)' }}>
                <i className="fa-light fa-rectangle-list" aria-hidden="true" style={{ fontSize: 9 }} />
                Bank
              </span>
            )}

            {/* Version */}
            {p.version > 1 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px', borderRadius: 7, border: '1px solid oklch(from var(--brand-color) l c h / 0.5)', fontSize: 10, fontWeight: 600, color: 'var(--brand-color)', background: 'oklch(from var(--brand-color) l c h / 0.06)' }}>
                v{p.version}
              </span>
            )}

            {/* Points — right aligned */}
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
              {p.points} pts
            </span>
          </div>

          {/* Stem */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleEdit}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEdit() } }}
            style={{ fontSize: 13.5, lineHeight: 1.45, color: 'var(--foreground)', cursor: 'pointer', outline: 'none' }}
          >
            {p.stem}
          </div>

          {/* Options preview — MCQ/MSQ/TF */}
          {p.options && p.options.length > 0 && (
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: p.options.length > 3 ? '1fr 1fr' : '1fr', gap: '3px 16px' }}>
              {p.options.slice(0, 6).map((o, i) => (
                <div key={i} style={{ fontSize: 12, color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className={`fa-light ${o.correct ? 'fa-circle-check' : 'fa-circle'}`} aria-hidden="true" style={{ fontSize: 10 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Flagged banner — .flag-banner */}
          {flagged && (
            <div style={{ marginTop: 9, display: 'flex', gap: 10, padding: '11px 13px', borderRadius: 10, background: 'oklch(from var(--destructive) l c h / 0.08)', border: '1px solid oklch(from var(--destructive) l c h / 0.28)', fontSize: 12.5, color: 'var(--chip-destructive, var(--destructive))' }}>
              <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }} />
              <div>{p.flagTitle}</div>
            </div>
          )}

          {/* Psychometrics */}
          {p.pbi !== null && (
            <div style={{ display: 'flex', gap: 16, marginTop: 9, fontSize: 11, color: 'var(--muted-foreground)' }}>
              <span>
                Pt-biserial{' '}
                <b style={{ color: p.pbi < 0.1 ? 'var(--destructive)' : 'var(--foreground)', fontWeight: 600 }}>
                  {p.pbi.toFixed(2)}
                </b>
              </span>
              {/* Creator/editor avatars */}
              {(p.creator || p.editor) && (
                <TooltipProvider>
                  <AvatarGroup style={{ marginLeft: 'auto' }}>
                    {p.creator && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar size="sm">
                            <AvatarFallback>{p.creator.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>Created by {p.creator.name}</TooltipContent>
                      </Tooltip>
                    )}
                    {p.editor && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar size="sm">
                            <AvatarFallback>{p.editor.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>Edited by {p.editor.name}</TooltipContent>
                      </Tooltip>
                    )}
                  </AvatarGroup>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* Action row — Edit | Replace | Delete (design's .btn.ghost.sm) */}
          <div style={{ display: 'flex', gap: 6, marginTop: 11 }} onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <i className="fa-light fa-pen" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => p.onOpenDetail()}
              style={{ color: 'var(--brand-color-dark)' }}
            >
              <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
              Replace
            </Button>
            {p.onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={p.onDelete}
                aria-label={`Delete question ${p.index + 1}`}
              >
                <i className="fa-light fa-trash" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
