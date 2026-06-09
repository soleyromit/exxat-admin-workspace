'use client'

import { Button } from '@exxatdesignux/ui'

interface PathwayCardProps {
  icon: string
  title: string
  description: string
  recommended?: boolean
  onClick: () => void
}

function PathwayCard({ icon, title, description, recommended, onClick }: PathwayCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        border: `1px solid ${recommended ? 'var(--brand-color)' : 'var(--border)'}`,
      }}
    >
      {/* Icon container */}
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
        style={{
          background: 'var(--muted)',
          color: 'var(--brand-color-dark, var(--brand-color))',
        }}
      >
        <i className={icon} aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {title}
          </span>
          {recommended && (
            <span
              className="text-xs rounded-md px-1.5 py-0.5"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
              }}
            >
              Recommended
            </span>
          )}
        </div>
        <p
          className="text-xs leading-relaxed mt-0.5"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </p>
      </div>

      {/* Arrow */}
      <i
        className="fa-light fa-arrow-right text-xs mt-0.5 shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
        aria-hidden="true"
      />
    </div>
  )
}

export interface BuilderStartScreenProps {
  assessmentName?: string
  onRecycle: () => void
  onAI: () => void
  onBank: () => void
  onScratch: () => void
}

export function BuilderStartScreen({
  assessmentName,
  onRecycle,
  onAI,
  onBank,
  onScratch,
}: BuilderStartScreenProps) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ maxWidth: 720, margin: '0 auto', paddingTop: 48 }}
    >
      {/* Center icon */}
      <div
        className="flex items-center justify-center rounded-[14px] mb-5 shrink-0"
        style={{
          width: 52,
          height: 52,
          background: 'var(--muted)',
          color: 'var(--brand-color-dark, var(--brand-color))',
          fontSize: 22,
        }}
      >
        <i className="fa-light fa-hammer" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h2
        className="text-center font-bold"
        style={{ fontSize: 19, color: 'var(--foreground)', marginBottom: 8 }}
      >
        This assessment is empty — choose how to begin
      </h2>

      {/* Subtitle */}
      <p
        className="text-sm text-center"
        style={{
          color: 'var(--muted-foreground)',
          maxWidth: 460,
          lineHeight: '1.5',
        }}
      >
        {assessmentName ? (
          <>
            <strong style={{ color: 'var(--foreground)' }}>{assessmentName}</strong> is Planned.{' '}
          </>
        ) : null}
        Pick a starting point; you can mix approaches and add sections anytime.
      </p>

      {/* Pathway cards grid */}
      <div className="grid grid-cols-2 gap-3 mt-6 w-full">
        <PathwayCard
          icon="fa-light fa-recycle"
          title="Recycle a past assessment"
          description="Ingest the sections, Q mix & historical difficulty from a previous assessment."
          recommended
          onClick={onRecycle}
        />
        <PathwayCard
          icon="fa-duotone fa-star-christmas"
          title="Generate with AI"
          description="Let Leo draft questions from your syllabus and blueprint."
          onClick={onAI}
        />
        <PathwayCard
          icon="fa-light fa-rectangle-list"
          title="Add from question bank"
          description="Search your institution's bank by topic, type, difficulty, and Bloom's level."
          onClick={onBank}
        />
        <PathwayCard
          icon="fa-light fa-pen-line"
          title="Start from scratch"
          description="Create an empty section and author questions manually."
          onClick={onScratch}
        />
      </div>
    </div>
  )
}
