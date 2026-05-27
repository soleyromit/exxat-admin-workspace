'use client'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, LocalBanner } from '@exxat/ds/packages/ui/src'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'
import type { AssessmentType } from '@/lib/qb-types'
import { facultyListRows } from '@/lib/faculty-mock-data'

type QuickStart = 'blank' | 'copy' | 'qb'

function getFacultyInitial(fullName: string): string {
  const parts = fullName.trim().split(' ')
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase()
}

// Decorative avatar backgrounds — no DS token equivalents for avatar colors.
// oklch(0.57 0.24 342) ≈ var(--brand-color); others are chart-palette hues.
const AVATAR_COLORS = [
  'oklch(0.65 0.18 160)',
  'oklch(0.65 0.18 55)',
  'oklch(0.57 0.24 342)',
  'oklch(0.65 0.18 200)',
  'oklch(0.60 0.20 280)',
]

export default function CreateCanvasClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addDraft } = useAssessmentDrafts()

  const courseId   = searchParams?.get('courseId') ?? ''
  const offeringId = searchParams?.get('offeringId') ?? ''

  const course   = mockCourses.find(c => c.id === courseId)
  const offering = mockCourseOfferings.find(o => o.id === offeringId)

  const [name, setName]                     = useState('')
  const [type, setType]                     = useState<AssessmentType>('Exam')
  const [date, setDate]                     = useState('')
  const [duration, setDuration]             = useState(90)
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([])
  const [prompt, setPrompt]                 = useState('')
  const [nameError, setNameError]           = useState('')

  function handleSubmit(mode: QuickStart = 'blank') {
    if (!name.trim()) {
      setNameError('Assessment name is required.')
      return
    }
    setNameError('')
    const draft = addDraft({
      courseId,
      offeringId: offeringId || (mockCourseOfferings.find(o => o.courseId === courseId)?.id ?? ''),
      title: name.trim(),
      questionCount: 0,
      durationMinutes: duration,
      diffDistribution: { Easy: 0, Medium: 0, Hard: 0 },
      collaboratorIds,
    })
    if (prompt.trim()) {
      try { sessionStorage.setItem(`asmt-creation-prompt-${draft.id}`, prompt.trim()) } catch {}
    }
    const qs = mode !== 'blank' ? `&mode=${mode}` : ''
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}${qs}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CanvasHeader
        course={course}
        offering={offering}
        name={name}
        onNameChange={v => { setName(v); if (nameError) setNameError('') }}
        type={type}
        onTypeChange={setType}
        date={date}
        onDateChange={setDate}
        duration={duration}
        onDurationChange={setDuration}
        collaboratorIds={collaboratorIds}
        onCollaboratorToggle={id => setCollaboratorIds(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )}
        onDiscard={() => router.back()}
      />
      {nameError && (
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <LocalBanner variant="error">{nameError}</LocalBanner>
        </div>
      )}
      <CanvasBody
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// ─── CanvasHeader ─────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES: AssessmentType[] = ['Exam', 'Quiz', 'Pop Quiz', 'Assignment']

function ChipPopover({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
          padding: '3px 10px', borderRadius: 20,
          border: '1px solid var(--border)', background: 'var(--muted)',
          color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div
            role="menu"
            style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, minWidth: 180, padding: 12,
          }}>
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function CanvasHeader({
  course, offering: _offering, name, onNameChange, type, onTypeChange,
  date, onDateChange, duration, onDurationChange,
  collaboratorIds, onCollaboratorToggle, onDiscard,
}: {
  course: ReturnType<typeof mockCourses.find>
  offering: ReturnType<typeof mockCourseOfferings.find>
  name: string
  onNameChange: (v: string) => void
  type: AssessmentType
  onTypeChange: (v: AssessmentType) => void
  date: string
  onDateChange: (v: string) => void
  duration: number
  onDurationChange: (v: number) => void
  collaboratorIds: string[]
  onCollaboratorToggle: (id: string) => void
  onDiscard: () => void
}) {
  const [collabOpen, setCollabOpen] = useState(false)
  const [collabSearch, setCollabSearch] = useState('')

  const filteredFaculty = facultyListRows.filter(f =>
    f.status === 'active' &&
    f.fullName.toLowerCase().includes(collabSearch.toLowerCase())
  )

  const selectedFaculty = facultyListRows.filter(f => collaboratorIds.includes(f.id))

  return (
    <div style={{
      height: 46, borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      background: 'var(--card)',
    }}>
      {/* Back */}
      <button
        type="button"
        onClick={onDiscard}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 11 }} />
        {course?.code ?? 'Back'}
      </button>
      <span style={{ color: 'var(--border)', margin: '0 2px' }}>/</span>

      {/* Assessment name — inline editable */}
      <input
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Assessment name…"
        aria-label="Assessment name"
        aria-required="true"
        style={{
          fontSize: 13, fontWeight: 600, border: 'none',
          borderBottom: '1.5px solid var(--brand-color)',
          background: 'transparent', outline: 'none',
          color: 'var(--foreground)', padding: '0 2px', width: 220, fontFamily: 'inherit',
        }}
      />

      {/* Type chip */}
      <ChipPopover label={type}>
        {ASSESSMENT_TYPES.map(t => (
          <div
            key={t}
            role="menuitem"
            onClick={() => onTypeChange(t)}
            style={{
              padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
              background: type === t ? 'var(--muted)' : 'transparent',
              fontWeight: type === t ? 600 : 400,
            }}
          >
            {t}
          </div>
        ))}
      </ChipPopover>

      {/* Date chip */}
      <ChipPopover label={date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date'}>
        <label style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>
          Assessment date
          <input
            type="date"
            value={date}
            onChange={e => onDateChange(e.target.value)}
            style={{ display: 'block', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'inherit', width: '100%', marginTop: 4 }}
          />
        </label>
      </ChipPopover>

      {/* Duration chip */}
      <ChipPopover label={`${duration} min`}>
        <label style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>
          Duration (minutes)
          <input
            type="number"
            min={5}
            step={5}
            value={duration}
            onChange={e => onDurationChange(Math.max(5, Number(e.target.value)))}
            style={{ display: 'block', fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'inherit', width: 100, marginTop: 4 }}
          />
        </label>
      </ChipPopover>

      {/* Collaborator avatar row + picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
        {/* Selected avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {selectedFaculty.slice(0, 5).map((f, i) => (
            <div
              key={f.id}
              title={f.fullName}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                border: '2px solid var(--background)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                marginRight: i < selectedFaculty.length - 1 ? -6 : 0,
                zIndex: 5 - i, position: 'relative',
              }}
            >
              {getFacultyInitial(f.fullName)}
            </div>
          ))}
          {selectedFaculty.length > 5 && (
            <div
              title={`${selectedFaculty.length - 5} more collaborator${selectedFaculty.length - 5 > 1 ? 's' : ''}`}
              style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--muted)', border: '2px solid var(--background)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--muted-foreground)', position: 'relative', zIndex: 0,
            }}>
              +{selectedFaculty.length - 5}
            </div>
          )}
        </div>

        {/* Add collaborator button + popover */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            type="button"
            onClick={() => setCollabOpen(o => !o)}
            aria-label="Add collaborator"
            aria-expanded={collabOpen}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '1.5px dashed var(--border)', background: 'transparent',
              color: 'var(--muted-foreground)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >+</button>

          {collabOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                onClick={() => { setCollabOpen(false); setCollabSearch('') }}
              />
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 6,
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, width: 260, overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 12px 6px' }}>
                  <input
                    autoFocus
                    value={collabSearch}
                    onChange={e => setCollabSearch(e.target.value)}
                    placeholder="Search faculty…"
                    aria-label="Search faculty"
                    style={{
                      width: '100%', fontSize: 13, border: '1px solid var(--border)',
                      borderRadius: 6, padding: '5px 8px', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
                <div role="menu" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {filteredFaculty.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--muted-foreground)' }}>No faculty found</div>
                  ) : filteredFaculty.map((f, i) => {
                    const isSelected = collaboratorIds.includes(f.id)
                    return (
                      <div
                        key={f.id}
                        role="menuitem"
                        onClick={() => onCollaboratorToggle(f.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', cursor: 'pointer',
                          background: isSelected ? 'var(--muted)' : 'transparent',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#fff',
                        }}>
                          {getFacultyInitial(f.fullName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{f.rank}</div>
                        </div>
                        {isSelected && <i className="fa-light fa-check" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 12 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 9px', borderRadius: 4, border: '1px solid var(--border)' }}>Draft</span>
        <Button variant="outline" size="sm" onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  )
}

// ─── CanvasBody ───────────────────────────────────────────────────────────────

const QUICK_STARTS: { id: QuickStart; label: string }[] = [
  { id: 'blank', label: 'Blank start' },
  { id: 'copy',  label: "Copy last year's" },
  { id: 'qb',   label: 'Build from QB' },
]

const EXAMPLE_PROMPT = `Cardiology Midterm · Exam · 90 min · password required · randomize questions

3 sections:
1. Cardiovascular Pharm — 20 Q, assign Dr. Mehra
   Instructions: "No calculators. Select the best mechanism-based answer."
   Preread: "A 58-year-old male with HTN and DM2 presents with bilateral pitting edema, elevated BNP, and a BP of 162/98. Current meds: metformin, lisinopril."

2. Renal & Electrolytes — 15 Q, assign Dr. Patel

3. Clinical Application — 15 Q, assign Dr. Kim
   Preread: "A 72-year-old post-CABG patient on warfarin presents with an INR of 4.2 and reports minor gum bleeding. No active hemorrhage."

Pre-exam setup:
- General instructions: "Read all questions carefully. Close all other applications before starting."
- Ethics / policy: Institutional honor code
- Attestation: "I affirm I will complete this exam independently and without unauthorized assistance."
- Tech check: audio + camera`

function CanvasBody({
  prompt, onPromptChange, onSubmit,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  onSubmit: (mode: QuickStart) => void
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: [
        'radial-gradient(ellipse 65% 50% at 50% 60%, oklch(0.96 0.03 342), transparent 75%)',
        'radial-gradient(ellipse 40% 35% at 8% 88%, oklch(0.93 0.04 330), transparent 70%)',
        'radial-gradient(ellipse 35% 30% at 90% 10%, oklch(0.94 0.03 350), transparent 65%)',
        'oklch(0.985 0.01 343)',
      ].join(', '),
      overflow: 'auto',
      padding: '32px 16px',
    }}>
      <div style={{ width: 520, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', color: 'var(--foreground)' }}>
          What should this look like?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Describe sections, topics, faculty, timing.<br />Or pick a starting point below.
        </p>

        {/* Prompt box */}
        <div style={{
          border: '1.5px solid var(--foreground)', borderRadius: 12,
          background: 'var(--background)', overflow: 'hidden',
          textAlign: 'left',
        }}>
          <textarea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder='e.g. "3 sections, 20 Q each — Cardiovascular Pharm, Renal, Clinical Application. Assign Mehra, Patel, Kim. 90 min, proctored, tech check on."'
            rows={prompt.includes('\n') ? 10 : 3}
            aria-label="Describe assessment structure"
            style={{
              width: '100%', fontSize: 13, color: 'var(--foreground)',
              padding: '13px 16px 8px', lineHeight: 1.55,
              border: 'none', outline: 'none', resize: 'none',
              background: 'transparent', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderTop: '1px solid var(--border)', background: 'var(--muted)',
          }}>
            <button
              type="button"
              onClick={() => onPromptChange(EXAMPLE_PROMPT)}
              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)' }}
            >
              ✦ Try an example
            </button>
            <button
              type="button"
              onClick={() => onSubmit('blank')}
              aria-label="Submit prompt"
              style={{
                marginLeft: 'auto', width: 30, height: 30, borderRadius: 8,
                background: 'var(--foreground)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 16 16" fill="white" width="13" height="13" aria-hidden="true"><path d="M14.5 8L2 14l2.5-6L2 2z"/></svg>
            </button>
          </div>
        </div>

        {/* Quick-start chips */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {QUICK_STARTS.map(qs => (
            <button
              key={qs.id}
              type="button"
              onClick={() => onSubmit(qs.id)}
              style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 20,
                border: '1px solid var(--border)', background: 'var(--background)',
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)',
              }}
            >
              {qs.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
