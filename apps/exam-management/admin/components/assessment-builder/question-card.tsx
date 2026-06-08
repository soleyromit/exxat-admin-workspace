'use client'

import {
  Card, CardContent, Button, Avatar, AvatarFallback, AvatarGroup,
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
}

/**
 * Question authoring card — the Claude Design builder surface: full readable
 * stem + a metadata row + per-question actions (points, pin, reorder), with an
 * inline warning when the question is flagged. Replaces the dense table row.
 */
export function QuestionCard(p: QuestionCardProps) {
  const pbiLow = p.pbi !== null && p.pbi < 0.2
  const bg = p.lastMoved ? 'var(--brand-tint)' : p.pinned ? 'var(--muted)' : 'var(--card)'

  return (
    <Card className="transition-colors" style={{ background: bg }}>
      <CardContent className="p-3">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          aria-label={`Select ${p.stem}`}
          checked={p.selected}
          onChange={e => p.onToggleSelect(e.target.checked)}
          className="mt-1 cursor-pointer shrink-0"
        />
        <span className="mt-0.5 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{p.index + 1}</span>

        <div className="min-w-0 flex-1">
          {/* Stem row */}
          <div className="flex items-start gap-1.5">
            {p.provenance && (
              <i
                className={`fa-light ${p.provenance.icon} text-[10px] mt-1 shrink-0`}
                style={{ color: p.provenance.color }}
                title={p.provenance.title}
                aria-hidden="true"
              />
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={p.onOpenDetail}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.onOpenDetail() } }}
              className="flex-1 cursor-pointer text-sm leading-snug text-foreground hover:text-[var(--brand-color)]"
            >
              {p.stem}
            </span>
            {p.version > 1 && (
              <span
                title={`Version ${p.version}`}
                className="shrink-0 rounded border border-[var(--brand-color)] bg-[var(--brand-tint)] px-1 py-px text-[10px] font-semibold text-[var(--brand-color)] leading-none"
              >
                v{p.version}
              </span>
            )}
            {p.flagTitle && (
              <i
                className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0 text-xs text-[var(--chart-4)]"
                title={p.flagTitle}
                aria-hidden="true"
              />
            )}
          </div>

          {/* Inline warning strip when flagged */}
          {p.flagTitle && (
            <p className="mt-1.5 rounded-md bg-muted px-2 py-1 text-xs text-[var(--chart-4)]">
              {p.flagTitle}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {p.typeIcon && <i className={p.typeIcon} aria-hidden="true" />}
              {p.type}
            </span>
            <span className="text-xs font-semibold" style={{ color: p.diffColor }}>{p.difficulty}</span>
            <span className="text-xs text-muted-foreground">{p.blooms}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {pbiLow && <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />}
              PBI {p.pbi !== null ? p.pbi.toFixed(2) : '—'}
            </span>
            {(p.creator || p.editor) && (
              <TooltipProvider>
                <AvatarGroup>
                  {p.creator && (
                    <Tooltip>
                      <TooltipTrigger asChild><Avatar size="sm"><AvatarFallback>{p.creator.initials}</AvatarFallback></Avatar></TooltipTrigger>
                      <TooltipContent>Created by {p.creator.name}</TooltipContent>
                    </Tooltip>
                  )}
                  {p.editor && (
                    <Tooltip>
                      <TooltipTrigger asChild><Avatar size="sm"><AvatarFallback>{p.editor.initials}</AvatarFallback></Avatar></TooltipTrigger>
                      <TooltipContent>Edited by {p.editor.name}</TooltipContent>
                    </Tooltip>
                  )}
                </AvatarGroup>
              </TooltipProvider>
            )}

            {/* Actions — right aligned */}
            <div className="ml-auto flex items-center gap-1.5">
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                Pts
                <input
                  type="number"
                  aria-label={`Points for ${p.stem}`}
                  min={0}
                  value={p.points}
                  onChange={e => { const v = parseInt(e.target.value); p.onSetPoints(Number.isNaN(v) ? 0 : v) }}
                  className="h-6 w-10 rounded border border-border bg-background px-1 text-center text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </label>
              <Button
                variant="ghost" size="icon-xs"
                aria-label={p.pinned ? `Unpin ${p.stem}` : `Pin ${p.stem}`}
                title={p.pinned ? 'Pinned — fixed during randomization' : 'Pin to fix position'}
                onClick={p.onTogglePin}
                className="h-6 w-6"
                style={{ color: p.pinned ? 'var(--brand-color)' : 'var(--muted-foreground)', opacity: p.pinned ? 1 : 0.4 }}
              >
                <i className={`${p.pinned ? 'fa-solid' : 'fa-light'} fa-thumbtack text-[10px]`} aria-hidden="true" />
              </Button>
              <div className="flex flex-col">
                <Button variant="ghost" size="icon-xs" aria-label={`Move ${p.stem} up`} disabled={p.index === 0} onClick={() => p.onReorder('up')} className="h-3.5 w-5 text-muted-foreground disabled:opacity-20">
                  <i className="fa-solid fa-angle-up text-[10px]" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label={`Move ${p.stem} down`} disabled={p.index === p.total - 1} onClick={() => p.onReorder('down')} className="h-3.5 w-5 text-muted-foreground disabled:opacity-20">
                  <i className="fa-solid fa-angle-down text-[10px]" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  )
}
