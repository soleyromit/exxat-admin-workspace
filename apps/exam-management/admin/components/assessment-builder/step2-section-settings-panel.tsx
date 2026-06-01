'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@exxatdesignux/ui'
import type { AssessmentSection } from '@/lib/qb-types'
import type { FacultyListRow } from '@/lib/faculty-mock-data'

interface Props {
  section: AssessmentSection
  faculty: FacultyListRow[]
  onPatch: (patch: Partial<AssessmentSection>) => void
  onClose: () => void
}

export function Step2SectionSettingsPanel({ section, faculty, onPatch, onClose }: Props) {
  const [addingPreRead, setAddingPreRead] = useState(false)
  const [newPreReadName, setNewPreReadName] = useState('')
  const [newPreReadUrl, setNewPreReadUrl] = useState('')

  // Fill target computation
  const filled = section.questionIds.length
  const target = section.fillTarget?.value ?? section.questionTarget ?? 20
  const fillPct = Math.min(100, Math.round((filled / target) * 100))
  const isComplete = filled >= target
  const isStarted = filled > 0

  const fillBarColor = isComplete
    ? 'var(--chart-2)'
    : isStarted
    ? 'var(--brand-color)'
    : 'var(--border)'

  const fillTextColor = isComplete
    ? 'var(--chart-2)'
    : isStarted
    ? 'var(--foreground)'
    : 'var(--muted-foreground)'

  function handleAddPreRead() {
    const name = newPreReadName.trim()
    const url = newPreReadUrl.trim()
    if (!name || !url) return
    onPatch({ preReadDocuments: [...(section.preReadDocuments ?? []), { name, url }] })
    setNewPreReadName('')
    setNewPreReadUrl('')
    setAddingPreRead(false)
  }

  function handleCancelPreRead() {
    setNewPreReadName('')
    setNewPreReadUrl('')
    setAddingPreRead(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Back to health panel"
          className="h-7 w-7 p-0 shrink-0"
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>

        {/* Section title */}
        <span
          className="text-xs font-semibold text-foreground flex-1"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 140,
          }}
          title={section.title}
        >
          {section.title}
        </span>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close section settings"
          className="h-7 w-7 p-0 shrink-0"
        >
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── 1. FILL TARGET ── */}
        <div style={{ padding: '12px 16px' }}>
          <p
            className="text-xs font-semibold text-muted-foreground mb-2"
            style={{ letterSpacing: '0.06em' }}
          >
            FILL TARGET
          </p>

          {/* Target value + unit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Input
              type="number"
              min={1}
              step={1}
              aria-label="Fill target value"
              value={target}
              onChange={e => {
                const v = Number(e.target.value)
                if (!isNaN(v) && v >= 1) {
                  onPatch({
                    fillTarget: {
                      type: section.fillTarget?.type ?? 'count',
                      value: v,
                    },
                  })
                }
              }}
              style={{ width: 64, height: 28, padding: '0 8px', fontSize: 12, textAlign: 'center' }}
            />
            <Select
              value={section.fillTarget?.type ?? 'count'}
              onValueChange={(v) => {
                onPatch({
                  fillTarget: {
                    type: v as 'count' | 'points',
                    value: section.fillTarget?.value ?? section.questionTarget ?? 10,
                  },
                })
              }}
            >
              <SelectTrigger
                aria-label="Fill target unit"
                style={{ height: 28, fontSize: 12, minWidth: 100 }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Questions</SelectItem>
                <SelectItem value="points">Points</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={fillPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Fill progress: ${fillPct}%`}
            style={{
              height: 4,
              borderRadius: 2,
              background: 'var(--muted)',
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${fillPct}%`,
                background: fillBarColor,
                borderRadius: 2,
                transition: 'width 0.2s ease',
              }}
            />
          </div>

          {/* Fill progress text */}
          <p
            className="text-xs"
            style={{ color: fillTextColor }}
          >
            {filled} of {target}{' '}
            {section.fillTarget?.type === 'points' ? 'points' : 'questions'} filled
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* ── 2. DUE DATE + ASSIGNED TO ── */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Due date */}
            <div>
              <p
                className="text-xs font-semibold text-muted-foreground mb-1.5"
                style={{ letterSpacing: '0.06em' }}
              >
                DUE DATE
              </p>
              <input
                type="date"
                aria-label="Section due date"
                value={section.dueDate ?? ''}
                onChange={e => onPatch({ dueDate: e.target.value || null })}
                style={{
                  width: '100%',
                  height: 28,
                  fontSize: 12,
                  padding: '0 6px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Assigned to */}
            <div>
              <p
                className="text-xs font-semibold text-muted-foreground mb-1.5"
                style={{ letterSpacing: '0.06em' }}
              >
                ASSIGNED TO
              </p>
              <Select
                value={section.facultyId ?? ''}
                onValueChange={(v) => onPatch({ facultyId: v || undefined })}
              >
                <SelectTrigger
                  aria-label="Assign section to faculty"
                  style={{ height: 28, fontSize: 12 }}
                >
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {faculty.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* ── 3. STUDENT INSTRUCTIONS ── */}
        <div style={{ padding: '12px 16px' }}>
          <p
            className="text-xs font-semibold text-muted-foreground mb-1"
            style={{ letterSpacing: '0.06em' }}
          >
            STUDENT INSTRUCTIONS
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Shown to student before Q1 of this section
          </p>
          <textarea
            aria-label="Student instructions for this section"
            value={section.instructions ?? ''}
            onChange={e => onPatch({ instructions: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 8px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* ── 4. PRE-READS ── */}
        <div style={{ padding: '12px 16px' }}>
          <p
            className="text-xs font-semibold text-muted-foreground mb-1"
            style={{ letterSpacing: '0.06em' }}
          >
            PRE-READS
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Shown in exam sidebar during this section
          </p>

          {/* Existing pre-reads */}
          {(section.preReadDocuments ?? []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {(section.preReadDocuments ?? []).map((doc, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    background: 'var(--background)',
                  }}
                >
                  <i
                    className="fa-light fa-file-lines"
                    aria-hidden="true"
                    style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }}
                  />
                  <span
                    className="text-xs text-foreground flex-1"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={doc.name}
                  >
                    {doc.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onPatch({
                        preReadDocuments: (section.preReadDocuments ?? []).filter((_, j) => j !== i),
                      })
                    }
                    aria-label={`Remove pre-read document ${doc.name}`}
                    className="h-5 w-5 p-0 shrink-0"
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add pre-read form */}
          {addingPreRead ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="text"
                placeholder="Document name"
                aria-label="Pre-read document name"
                value={newPreReadName}
                onChange={e => setNewPreReadName(e.target.value)}
                style={{
                  width: '100%',
                  height: 28,
                  fontSize: 12,
                  padding: '0 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <input
                type="url"
                placeholder="https://…"
                aria-label="Pre-read document URL"
                value={newPreReadUrl}
                onChange={e => setNewPreReadUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddPreRead()
                  if (e.key === 'Escape') handleCancelPreRead()
                }}
                style={{
                  width: '100%',
                  height: 28,
                  fontSize: 12,
                  padding: '0 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  size="sm"
                  onClick={handleAddPreRead}
                  disabled={!newPreReadName.trim() || !newPreReadUrl.trim()}
                  className="h-7 px-3 text-xs"
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPreRead}
                  className="h-7 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddingPreRead(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-auto p-0"
            >
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add pre-read document
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
