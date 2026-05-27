'use client'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, LocalBanner } from '@exxatdesignux/ui'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
import type { AssessmentType } from '@/lib/qb-types'
import { facultyListRows } from '@/lib/faculty-mock-data'

type QuickStart = 'blank' | 'copy' | 'qb' | 'pdf'

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
  const [prompt, setPrompt]                 = useState(EXAMPLE_PROMPT)
  const [nameError, setNameError]           = useState('')
  const [copyPickerOpen, setCopyPickerOpen] = useState(false)
  const [qbPickerOpen, setQbPickerOpen] = useState(false)
  const [selectedQbFolderIds, setSelectedQbFolderIds] = useState<string[]>([])
  const [pdfPickerOpen, setPdfPickerOpen] = useState(false)

  // T2-A/B/C retained for sessionStorage persistence — not shown in canvas body
  const [primaryIntent] = useState('')
  const [syllabusFile] = useState<File | null>(null)

  // Auto-fill name + date from prompt when those fields are still empty
  React.useEffect(() => {
    if (!prompt.trim()) return
    const parsed = parsePrompt(prompt)
    if (parsed.name && !name) setName(parsed.name)
    if (parsed.date && !date) setDate(parsed.date)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt])

  function handleSubmit(mode: QuickStart = 'blank', sourceId?: string) {
    if (!name.trim()) {
      setNameError('Assessment name is required.')
      return
    }
    setNameError('')
    if (mode === 'copy' && !sourceId) {
      setCopyPickerOpen(true)
      return
    }
    if (mode === 'qb' && !sourceId) {
      setQbPickerOpen(true)
      return
    }
    if (mode === 'pdf' && !sourceId) {
      setPdfPickerOpen(true)
      return
    }
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
    try {
      const prdMeta = {
        primaryIntent: primaryIntent.trim() || undefined,
        syllabusUrl: syllabusFile ? URL.createObjectURL(syllabusFile) : undefined,
        qbFolderIds: mode === 'qb' && sourceId ? sourceId.split(',') : undefined,
      }
      sessionStorage.setItem(`asmt-creation-prd-${draft.id}`, JSON.stringify(prdMeta))
    } catch { /* quota error — non-fatal */ }
    const modeQs = mode !== 'blank' ? `&mode=${mode}` : ''
    const sourceQs = sourceId ? `&sourceId=${sourceId}` : ''
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}${modeQs}${sourceQs}`)
  }

  // All assessments for this course — source candidates for "Copy last year's"
  // Fall back to all mock assessments when courseId doesn't match (demo/no-course context)
  const filteredByCourse = mockAssessments.filter(a => a.courseId === courseId)
  const courseAssessments = filteredByCourse.length > 0 ? filteredByCourse : mockAssessments

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CanvasHeader
        course={course}
        offering={offering}
        name={name}
        onNameChange={v => { setName(v); if (nameError) setNameError('') }}
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

      {/* Copy source picker */}
      {copyPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pick assessment to copy"
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}
          onClick={e => { if (e.target === e.currentTarget) setCopyPickerOpen(false) }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, width: 460, maxHeight: '65vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-light fa-copy" aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Copy a previous assessment</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Questions and structure will be duplicated as a new draft</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCopyPickerOpen(false)} aria-label="Close">
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {courseAssessments.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: '24px 16px', textAlign: 'center' }}>
                  No previous assessments found for this course.
                </p>
              ) : courseAssessments.map(a => {
                const total = (a.diffDistribution.Easy ?? 0) + (a.diffDistribution.Medium ?? 0) + (a.diffDistribution.Hard ?? 0)
                const pct = (n: number) => total > 0 ? `${Math.round((n / total) * 100)}%` : '0%'
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { setCopyPickerOpen(false); handleSubmit('copy', a.id) }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 3 }}>{a.title}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--muted-foreground)' }}>
                          <span><i className="fa-light fa-circle-question" aria-hidden="true" style={{ marginRight: 4 }} />{a.questionCount} questions</span>
                          <span><i className="fa-light fa-clock" aria-hidden="true" style={{ marginRight: 4 }} />{a.durationMinutes} min</span>
                        </div>
                      </div>
                      <div style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }}>
                        Copy
                      </div>
                    </div>
                    {/* Difficulty bar */}
                    {total > 0 && (
                      <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                        <div style={{ width: pct(a.diffDistribution.Easy), background: 'var(--chart-2)', borderRadius: 2 }} title={`Easy: ${a.diffDistribution.Easy}`} />
                        <div style={{ width: pct(a.diffDistribution.Medium), background: 'var(--chart-4)', borderRadius: 2 }} title={`Medium: ${a.diffDistribution.Medium}`} />
                        <div style={{ width: pct(a.diffDistribution.Hard), background: 'var(--chart-1)', borderRadius: 2 }} title={`Hard: ${a.diffDistribution.Hard}`} />
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chart-2)', display: 'inline-block' }} />Easy {a.diffDistribution.Easy}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chart-4)', display: 'inline-block' }} />Med {a.diffDistribution.Medium}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chart-1)', display: 'inline-block' }} />Hard {a.diffDistribution.Hard}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* QB folder picker — shown when user clicks "Build from QB" */}
      {qbPickerOpen && (
        <QbFolderPicker
          courseId={courseId}
          selectedIds={selectedQbFolderIds}
          onToggle={id => setSelectedQbFolderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onClose={() => { setQbPickerOpen(false); setSelectedQbFolderIds([]) }}
          onBuild={() => {
            setQbPickerOpen(false)
            const sourceId = selectedQbFolderIds.join(',') || undefined
            setSelectedQbFolderIds([])
            handleSubmit('qb', sourceId)
          }}
        />
      )}

      {pdfPickerOpen && (
        <PdfImportPicker
          onClose={() => setPdfPickerOpen(false)}
          onBuild={file => {
            setPdfPickerOpen(false)
            handleSubmit('pdf', file.name)
          }}
        />
      )}
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
  course, offering: _offering, name, onNameChange, onDiscard,
}: {
  course: ReturnType<typeof mockCourses.find>
  offering: ReturnType<typeof mockCourseOfferings.find>
  name: string
  onNameChange: (v: string) => void
  onDiscard: () => void
}) {

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

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 9px', borderRadius: 4, border: '1px solid var(--border)' }}>Draft</span>
        <Button variant="outline" size="sm" onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  )
}

// ─── PDF Import Picker ───────────────────────────────────────────────────────

function PdfImportPicker({
  onClose, onBuild,
}: {
  onClose: () => void
  onBuild: (file: File) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const accept = (f: File | undefined) => {
    if (f && f.type === 'application/pdf') setFile(f)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Build from PDF"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, width: 460, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 15, color: 'var(--brand-color)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Build from a PDF</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Upload a previous exam, syllabus, or question list</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>

        {/* Drop zone / file selected */}
        {!file ? (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); accept(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              margin: '16px',
              border: `2px dashed ${isDragging ? 'var(--brand-color)' : 'var(--border)'}`,
              borderRadius: 10, padding: '32px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer',
              background: isDragging ? 'var(--brand-tint)' : 'var(--muted)',
              transition: 'border-color 0.15s, background 0.15s',
              textAlign: 'center',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" style={{ fontSize: 18, color: 'var(--brand-color)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 3 }}>Drop a PDF here</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>or click to browse · PDF only</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              aria-label="Select PDF file"
              style={{ display: 'none' }}
              onChange={e => accept(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div style={{ margin: '16px', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 22, color: 'var(--brand-color)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · PDF</div>
            </div>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove file" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4, fontFamily: 'inherit' }}>
              <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 14 }} />
            </button>
          </div>
        )}

        {/* What AI will extract */}
        <div style={{ padding: '0 16px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)', margin: '0 0 8px' }}>AI will extract:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {['Section structure and topics', 'Question stems and answer choices', 'Instructions, timing, and preread notes'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--chart-2)', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', background: 'var(--card)' }}>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => { if (file) onBuild(file) }} disabled={!file}>
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
            Build from PDF
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── QB Folder Picker ─────────────────────────────────────────────────────────

function QbFolderPicker({
  courseId, selectedIds, onToggle, onClose, onBuild,
}: {
  courseId: string
  selectedIds: string[]
  onToggle: (id: string) => void
  onClose: () => void
  onBuild: () => void
}) {
  // Find the QB root folder for this course — fall back to first course in demo context
  const course = mockCourses.find(c => c.id === courseId) ?? mockCourses[0]
  const rootFolderId = course?.questionBankFolderId
  const rootFolder = MOCK_QB_FOLDERS.find(f => f.id === rootFolderId)
  // Content areas = direct children of the QB root
  const contentAreas = MOCK_QB_FOLDERS.filter(f => f.parentId === rootFolderId)
  const totalSelected = selectedIds.reduce((sum, id) => {
    const folder = MOCK_QB_FOLDERS.find(f => f.id === id)
    return sum + (folder?.count ?? 0)
  }, 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Build from Question Bank"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.18)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-light fa-database" aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Build from Question Bank</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              {rootFolder?.name ?? 'Question Bank'} · {rootFolder?.count ?? 0} total questions
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>

        {/* Instruction */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
            Select content areas to include. Questions will be available in the builder — you choose which ones to add.
          </p>
        </div>

        {/* Content area list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {contentAreas.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: '24px 16px', textAlign: 'center' }}>
              No content areas found for this course.
            </p>
          ) : contentAreas.map(folder => {
            const isSelected = selectedIds.includes(folder.id)
            return (
              <button
                key={folder.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(folder.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                  width: '100%', textAlign: 'left', background: isSelected ? 'var(--brand-tint)' : 'none',
                  border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {/* Checkbox indicator */}
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: isSelected ? 'none' : '1.5px solid var(--border)',
                  background: isSelected ? 'var(--brand-color)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--primary-foreground)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {folder.name}
                  </div>
                  {folder.isPrivateSpace && (
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                      <i className="fa-light fa-lock" aria-hidden="true" style={{ marginRight: 3 }} />
                      Private space
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 500,
                  color: isSelected ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  flexShrink: 0,
                }}>
                  {folder.count} Q
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)' }}>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--muted-foreground)' }}>
            {selectedIds.length > 0
              ? <><span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedIds.length}</span> area{selectedIds.length !== 1 ? 's' : ''} · <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{totalSelected}</span> questions</>
              : 'Select at least one content area'
            }
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onBuild} disabled={selectedIds.length === 0}>
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
            Build assessment
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── CanvasBody ───────────────────────────────────────────────────────────────

// ─── Prompt parser ────────────────────────────────────────────────────────────

function parsePrompt(text: string): { name?: string; date?: string } {
  const result: { name?: string; date?: string } = {}

  // Name: first segment of first line, before · | , or newline
  const firstSegment = text.split('\n')[0].split(/[·|,]/)[0].trim()
  if (firstSegment.length > 2 && firstSegment.length < 80) result.name = firstSegment

  // Date: ISO (2026-06-12) or "Month Day [Year]" (June 12, 2026 / Jun 12)
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (isoMatch) { result.date = isoMatch[1]; return result }

  const MONTHS: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  }
  const mdy = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?/i)
  if (mdy) {
    const m = MONTHS[mdy[1].toLowerCase().slice(0, 3)]
    const d = parseInt(mdy[2])
    const y = mdy[3] ? parseInt(mdy[3]) : new Date().getFullYear()
    if (m) result.date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  return result
}

// ─── Example prompt ───────────────────────────────────────────────────────────

const EXAMPLE_PROMPT = `Cardiology Midterm · Exam · 90 min · June 12 · password required · randomize questions

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

const CANVAS_CARDS: {
  id: QuickStart; icon: string; title: string; description: string; cta: string
}[] = [
  {
    id: 'blank',
    icon: 'fa-file-plus',
    title: 'Build new assessment',
    description: 'Start from a blank slate. Add sections, assign faculty, and fill questions from the QB, a PDF, or scratch inside the builder.',
    cta: 'Start building',
  },
  {
    id: 'copy',
    icon: 'fa-copy',
    title: 'Copy existing assessment',
    description: 'Duplicate a previous assessment as a starting point. Keep, swap, or add questions — QB, PDF, and manual methods all work inside.',
    cta: 'Browse assessments',
  },
]

function CanvasBody({
  prompt, onPromptChange, onSubmit,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  onSubmit: (mode: QuickStart) => void
}) {
  const [hoveredCard, setHoveredCard] = useState<QuickStart | null>(null)

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
      padding: '40px 24px',
    }}>
      <div style={{ width: 580, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px', color: 'var(--foreground)' }}>
            How do you want to build this?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
            You can mix question sources once you're inside — QB, PDF, or create from scratch.
          </p>
        </div>

        {/* Choice cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {CANVAS_CARDS.map(card => {
            const isHovered = hoveredCard === card.id
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSubmit(card.id)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  flex: 1, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: isHovered ? 'var(--brand-tint)' : 'var(--background)',
                  border: `1.5px solid ${isHovered ? 'var(--brand-color)' : 'var(--border)'}`,
                  borderRadius: 14, padding: '20px 20px 16px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: isHovered ? 'var(--brand-color)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}>
                  <i
                    className={`fa-light ${card.icon}`}
                    aria-hidden="true"
                    style={{ fontSize: 16, color: isHovered ? 'var(--background)' : 'var(--muted-foreground)' }}
                  />
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    {card.description}
                  </div>
                </div>

                {/* CTA row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600,
                  color: isHovered ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  transition: 'color 0.15s',
                }}>
                  {card.cta}
                  <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 11 }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            or describe structure with AI
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* AI prompt box */}
        <div style={{
          border: '1px solid var(--border)', borderRadius: 12,
          background: 'var(--background)', overflow: 'hidden',
          textAlign: 'left',
        }}>
          <textarea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder='e.g. "3 sections, 20 Q each — Cardiovascular Pharm, Renal, Clinical Application. Assign Dr. Mehra, Patel, Kim. 90 min, proctored, tech check on."'
            rows={7}
            aria-label="Describe assessment structure"
            style={{
              width: '100%', fontSize: 13, color: 'var(--foreground)',
              padding: '12px 14px 8px', lineHeight: 1.6,
              border: 'none', outline: 'none', resize: 'none',
              background: 'transparent', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: '6px 10px', borderTop: '1px solid var(--border)', background: 'var(--muted)',
          }}>
            <button
              type="button"
              onClick={() => onSubmit('blank')}
              aria-label="Build from prompt"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--foreground)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 16 16" fill="white" width="13" height="13" aria-hidden="true"><path d="M14.5 8L2 14l2.5-6L2 2z"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
