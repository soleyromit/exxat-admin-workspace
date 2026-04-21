'use client'
import { useState, useMemo, useCallback } from 'react'
import {
  Button, Badge,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Checkbox,
} from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import type { AssessmentDraft, SmartView } from '@/lib/qb-types'
import { SYSTEM_SMART_VIEWS } from '@/lib/qb-types'

export default function AssessmentBuilderClient() {
  const [courseId, setCourseId] = useState(mockCourses[0]?.id ?? '')
  const [offeringId, setOfferingId] = useState(
    mockCourseOfferings.find(o => o.courseId === mockCourses[0]?.id)?.id ?? ''
  )
  const [activeAsmt, setActiveAsmt] = useState<AssessmentDraft | null>(null)
  const [smartViewId, setSmartViewId] = useState<string>('all')
  const [savedViews, setSavedViews] = useState<SmartView[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('qb-smart-views') : null
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const assessments = mockAssessments.filter(a => a.courseId === courseId && a.offeringId === offeringId)
  const allSmartViews = useMemo(() => [...SYSTEM_SMART_VIEWS, ...savedViews], [savedViews])

  const saveSmartView = useCallback((view: SmartView) => {
    setSavedViews(prev => {
      const next = [...prev, view]
      try { localStorage.setItem('qb-smart-views', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  function openAssessment(asmtId: string) {
    const source = assessments.find(a => a.id === asmtId)
    if (!source) return
    setActiveAsmt({
      id: source.id,
      title: source.title,
      courseId: source.courseId,
      offeringId: source.offeringId,
      questions: [],
    })
  }

  function createAssessment() {
    setActiveAsmt({
      id: `asmt-new-${Date.now()}`,
      title: 'New Assessment',
      courseId,
      offeringId,
      questions: [],
    })
  }

  function toggleQuestion(questionId: string) {
    if (!activeAsmt) return
    setActiveAsmt(prev => {
      if (!prev) return prev
      const exists = prev.questions.find(q => q.questionId === questionId)
      return {
        ...prev,
        questions: exists
          ? prev.questions.filter(q => q.questionId !== questionId)
          : [...prev.questions, { questionId, order: prev.questions.length + 1 }],
      }
    })
  }

  const selectedIds = useMemo(
    () => new Set(activeAsmt?.questions.map(q => q.questionId) ?? []),
    [activeAsmt]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Course + Offering selector bar */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--ab-selector-bar-bg)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}>Course</span>
        <Select value={courseId} onValueChange={(val) => {
          setCourseId(val)
          const first = mockCourseOfferings.find(o => o.courseId === val)
          if (first) setOfferingId(first.id)
          setActiveAsmt(null)
        }}>
          <SelectTrigger style={{ width: 180, height: 32, fontSize: 12 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockCourses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)' }}>Offering</span>
        <Select value={offeringId} onValueChange={(val) => { setOfferingId(val); setActiveAsmt(null) }}>
          <SelectTrigger style={{ width: 148, height: 32, fontSize: 12 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {offerings.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.semester}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeAsmt && (
          <Badge variant="secondary" className="rounded text-[11px]" style={{ marginLeft: 8 }}>
            Editing: {activeAsmt.title} · {activeAsmt.questions.length} questions
          </Badge>
        )}
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ABAssessmentList
          assessments={assessments}
          activeId={activeAsmt?.id ?? null}
          onOpen={openAssessment}
          onCreate={createAssessment}
        />
        {activeAsmt ? (
          <ABQuestionPicker
            selectedIds={selectedIds}
            onToggle={toggleQuestion}
            activeAsmt={activeAsmt}
            smartViews={allSmartViews}
            activeViewId={smartViewId}
            onViewChange={setSmartViewId}
            onSaveView={saveSmartView}
          />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: 'var(--muted-foreground)',
          }}>
            <i className="fa-light fa-pen-ruler" aria-hidden="true" style={{ fontSize: 32, opacity: 0.4 }} />
            <span style={{ fontSize: 13 }}>Select an assessment to start picking questions</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Assessment list sidebar (Task 16) ───────────────────────────────────────

function ABAssessmentList({ assessments, activeId, onOpen, onCreate }: {
  assessments: typeof mockAssessments
  activeId: string | null
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  return (
    <aside style={{
      width: 224,
      minWidth: 224,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--ab-panel-bg)',
    }}>
      <div style={{
        padding: '10px 10px 4px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.07em',
        color: 'var(--muted-foreground)',
        flexShrink: 0,
      }}>
        Assessments
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 6px 6px' }}>
        {assessments.map(a => {
          const isActive = activeId === a.id
          const diff = a.diffDistribution ?? { Easy: 0, Medium: 0, Hard: 0 }
          const total = diff.Easy + diff.Medium + diff.Hard
          const pct = (n: number) => total > 0 ? (n / total) * 100 : 0
          return (
            <Button
              key={a.id}
              variant="ghost"
              size="sm"
              onClick={() => onOpen(a.id)}
              className="w-full h-auto text-left flex-col items-start"
              style={{
                borderRadius: 7,
                padding: '8px 10px',
                marginBottom: 2,
                background: isActive ? 'var(--accent)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--ab-active-border)' : 'transparent',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '2px 0 6px' }}>
                {a.questionCount} questions
              </div>
              <div style={{
                display: 'flex',
                height: 4,
                borderRadius: 2,
                overflow: 'hidden',
                gap: 1,
                width: '100%',
              }}>
                <div style={{ width: `${pct(diff.Easy)}%`, background: 'var(--qb-diff-easy)', opacity: 0.7, borderRadius: 2, transition: 'width .2s' }} />
                <div style={{ width: `${pct(diff.Medium)}%`, background: 'var(--qb-diff-medium)', opacity: 0.85, borderRadius: 2, transition: 'width .2s' }} />
                <div style={{ width: `${pct(diff.Hard)}%`, background: 'var(--qb-diff-hard)', borderRadius: 2, transition: 'width .2s' }} />
              </div>
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={onCreate}
          className="w-full mt-1"
          style={{ borderStyle: 'dashed', fontSize: 12, color: 'var(--muted-foreground)' }}
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          {' '}New assessment
        </Button>
      </div>
    </aside>
  )
}

// ─── Question picker (Task 14) ────────────────────────────────────────────────

function ABQuestionPicker({ selectedIds, onToggle, activeAsmt, smartViews, activeViewId, onViewChange, onSaveView }: {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeAsmt: AssessmentDraft
  smartViews: SmartView[]
  activeViewId: string
  onViewChange: (id: string) => void
  onSaveView: (v: SmartView) => void
}) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveConfirmed, setSaveConfirmed] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  const activeView = smartViews.find(v => v.id === activeViewId) ?? smartViews[0]

  const filteredQuestions = useMemo(() => {
    const { difficulty, type, blooms, unusedOnly } = activeView?.filters ?? {}
    return MOCK_QB_QUESTIONS.filter(q => {
      if (difficulty?.length && !difficulty.includes(q.difficulty)) return false
      if (type?.length && !type.includes(q.type)) return false
      if (blooms?.length && !blooms.includes(q.blooms)) return false
      if (unusedOnly && (q.usage ?? 0) > 0) return false
      return true
    })
  }, [activeView])

  const distribution = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    return {
      Easy:   picked.filter(q => q.difficulty === 'Easy').length,
      Medium: picked.filter(q => q.difficulty === 'Medium').length,
      Hard:   picked.filter(q => q.difficulty === 'Hard').length,
    }
  }, [selectedIds])

  function handleSaveView() {
    if (!newViewName.trim()) return
    onSaveView({
      id: `user-${Date.now()}`,
      label: newViewName.trim(),
      isSystem: false,
      filters: activeView?.filters ?? {},
    })
    setNewViewName('')
    setSaveDialogOpen(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Assessment context header */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{activeAsmt.title}</span>
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>· {selectedIds.size} questions selected</span>
      </div>

      {/* Smart view chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        flexShrink: 0,
        background: 'var(--ab-smart-view-bar-bg)',
      }}>
        {smartViews.map(view => {
          const isActive = activeViewId === view.id
          return (
            <Button
              key={view.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange(view.id)}
              className="shrink-0 rounded-full text-[11px] h-7 px-3"
              style={!view.isSystem && !isActive
                ? { borderStyle: 'dashed', color: 'var(--brand-color)', borderColor: 'var(--brand-color)' }
                : undefined}
            >
              {!view.isSystem && (
                <i className="fa-solid fa-star text-[9px] mr-1" aria-hidden="true" />
              )}
              {view.label}
            </Button>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          className="shrink-0 rounded-full text-[11px] h-7 px-3"
          style={{ color: 'var(--brand-color)', opacity: 0.7 }}
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          {' '}Save view
        </Button>
      </div>

      {/* Question list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}></TableHead>
              <TableHead>Question</TableHead>
              <TableHead style={{ width: 80 }}>Difficulty</TableHead>
              <TableHead style={{ width: 100 }}>Type</TableHead>
              <TableHead style={{ width: 60 }}>Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No questions match this view
                </TableCell>
              </TableRow>
            ) : filteredQuestions.map(q => {
              const isPicked = selectedIds.has(q.id)
              const diffStyles: Record<string, { fontWeight: number; color: string }> = {
                Easy:   { fontWeight: 400, color: 'var(--qb-diff-easy)' },
                Medium: { fontWeight: 600, color: 'var(--qb-diff-medium)' },
                Hard:   { fontWeight: 800, color: 'var(--qb-diff-hard)' },
              }
              return (
                <TableRow
                  key={q.id}
                  onClick={() => onToggle(q.id)}
                  style={{ cursor: 'pointer', background: isPicked ? 'var(--ab-picker-selected-bg)' : undefined }}
                >
                  <TableCell>
                    <Checkbox
                      checked={isPicked}
                      onCheckedChange={() => onToggle(q.id)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      aria-label={`Select ${q.title}`}
                    />
                  </TableCell>
                  <TableCell style={{ fontSize: 12, maxWidth: 400 }}>
                    <div style={{
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {q.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: 11.5, ...(diffStyles[q.difficulty] ?? {}) }}>{q.difficulty}</span>
                  </TableCell>
                  <TableCell style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontWeight: 500 }}>
                    {q.type}
                  </TableCell>
                  <TableCell style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {(q.usage ?? 0) > 0 ? `${q.usage}×` : '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer diff chart */}
      <ABDiffChart
        distribution={distribution}
        saveConfirmed={saveConfirmed}
        onSave={() => { setSaveConfirmed(true); setTimeout(() => setSaveConfirmed(false), 2000) }}
        onCancel={() => {}}
      />

      {/* Save smart view dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save smart view</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 8 }}>
            Saves the current filter configuration as &ldquo;{activeView?.label}&rdquo; with a custom name.
          </p>
          <Input
            autoFocus
            value={newViewName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewViewName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSaveView()}
            placeholder="View name…"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveView} disabled={!newViewName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Difficulty distribution chart (Task 15) ─────────────────────────────────

function ABDiffChart({ distribution, saveConfirmed, onSave, onCancel: _onCancel }: {
  distribution: { Easy: number; Medium: number; Hard: number }
  saveConfirmed: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const total = distribution.Easy + distribution.Medium + distribution.Hard
  const bars = [
    { label: 'Easy',   count: distribution.Easy,   color: 'var(--qb-diff-easy)',   weight: 400 },
    { label: 'Medium', count: distribution.Medium, color: 'var(--qb-diff-medium)', weight: 600 },
    { label: 'Hard',   count: distribution.Hard,   color: 'var(--qb-diff-hard)',   weight: 800 },
  ]
  const maxCount = Math.max(...bars.map(b => b.count), 1)

  return (
    <div style={{
      padding: '10px 16px 12px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexShrink: 0,
      background: 'var(--ab-chart-bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 48 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: bar.color }}>
              {bar.count > 0 ? bar.count : ''}
            </span>
            <div style={{
              width: 28,
              borderRadius: '3px 3px 0 0',
              background: bar.color,
              height: bar.count === 0 ? 3 : `${(bar.count / maxCount) * 32}px`,
              transition: 'height .2s ease',
              opacity: bar.count === 0 ? 0.25 : 1,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{ fontWeight: bar.weight, color: bar.color, width: 44 }}>{bar.label}</span>
            <span style={{ color: 'var(--muted-foreground)' }}>
              {bar.count} question{bar.count !== 1 ? 's' : ''}
            </span>
            {total > 0 && (
              <span style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
                ({Math.round((bar.count / total) * 100)}%)
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {total === 0 && (
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            Select questions to build assessment
          </span>
        )}
        <Button size="sm" disabled={total === 0 || saveConfirmed} onClick={onSave}>
          {saveConfirmed ? 'Saved ✓' : 'Save assessment'}
        </Button>
      </div>
    </div>
  )
}
