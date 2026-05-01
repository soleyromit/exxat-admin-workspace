'use client'
import React, { useState, useMemo, useCallback } from 'react'
import {
  Button, Badge,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Checkbox,
} from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import type { AssessmentDraft, SmartView, QType, QDiff } from '@/lib/qb-types'
import { SYSTEM_SMART_VIEWS } from '@/lib/qb-types'

// Estimated minutes per question type (base, before difficulty adjustment)
const TIME_BY_TYPE: Record<QType, number> = {
  'MCQ':        1.5,
  'Fill blank':  2.0,
  'Hotspot':    2.5,
  'Ordering':   3.0,
  'Matching':   3.0,
}

// Difficulty multiplier on base time
const DIFF_MULT: Record<QDiff, number> = {
  Easy:   1.0,
  Medium: 1.25,
  Hard:   1.5,
}

function formatMin(min: number): string {
  if (!min || !isFinite(min)) return '—'
  const rounded = Math.round(min)
  if (rounded < 60) return `~${rounded} min`
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

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
      durationMinutes: source.durationMinutes,
    })
  }

  function createAssessment() {
    setActiveAsmt({
      id: `asmt-new-${Date.now()}`,
      title: 'New Assessment',
      courseId,
      offeringId,
      questions: [],
      durationMinutes: 60,
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
        <span className="text-xs font-semibold text-muted-foreground">Course</span>
        <Select value={courseId} onValueChange={(val) => {
          setCourseId(val)
          const first = mockCourseOfferings.find(o => o.courseId === val)
          if (first) setOfferingId(first.id)
          setActiveAsmt(null)
        }}>
          <SelectTrigger className="text-sm" style={{ width: 180, height: 32 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockCourses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs font-semibold text-muted-foreground">Offering</span>
        <Select value={offeringId} onValueChange={(val) => { setOfferingId(val); setActiveAsmt(null) }}>
          <SelectTrigger className="text-sm" style={{ width: 148, height: 32 }}>
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
            onDurationChange={(min) => setActiveAsmt(prev => prev ? { ...prev, durationMinutes: min } : prev)}
            smartViews={allSmartViews}
            activeViewId={smartViewId}
            onViewChange={setSmartViewId}
            onSaveView={saveSmartView}
          />
        ) : (
          <div className="text-muted-foreground" style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
          }}>
            <i className="fa-light fa-pen-ruler" aria-hidden="true" style={{ fontSize: 32, opacity: 0.4 }} />
            <span className="text-sm">Select an assessment to start picking questions</span>
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
      <div className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground" style={{
        padding: '10px 10px 4px',
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
              <div className="text-sm font-semibold text-foreground">{a.title}</div>
              <div className="text-xs text-muted-foreground" style={{ margin: '2px 0 6px' }}>
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
                <div style={{ width: `${pct(diff.Easy)}%`, background: 'var(--qb-diff-bar-easy)', opacity: 0.7, borderRadius: 2, transition: 'width .2s' }} />
                <div style={{ width: `${pct(diff.Medium)}%`, background: 'var(--qb-diff-bar-medium)', opacity: 0.85, borderRadius: 2, transition: 'width .2s' }} />
                <div style={{ width: `${pct(diff.Hard)}%`, background: 'var(--qb-diff-bar-hard)', borderRadius: 2, transition: 'width .2s' }} />
              </div>
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={onCreate}
          className="w-full mt-1 text-sm text-muted-foreground"
          style={{ borderStyle: 'dashed' }}
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          {' '}New assessment
        </Button>
      </div>
    </aside>
  )
}

// ─── Question picker (Task 14) ────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: '20 min',  value: 20  },
  { label: '30 min',  value: 30  },
  { label: '45 min',  value: 45  },
  { label: '60 min',  value: 60  },
  { label: '90 min',  value: 90  },
  { label: '2 hours', value: 120 },
  { label: '2.5 hrs', value: 150 },
  { label: '3 hours', value: 180 },
]

function ABQuestionPicker({ selectedIds, onToggle, activeAsmt, onDurationChange, smartViews, activeViewId, onViewChange, onSaveView }: {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeAsmt: AssessmentDraft
  onDurationChange: (min: number) => void
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

  const bloomsMetrics = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    if (picked.length === 0) return []
    const counts: Record<string, number> = {}
    for (const q of picked) counts[q.blooms] = (counts[q.blooms] ?? 0) + 1
    const total = picked.length
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([level, count]) => ({ level, count, pct: Math.round((count / total) * 100) }))
  }, [selectedIds])

  const timeMetrics = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    if (picked.length === 0) return { totalMin: 0, avgMin: 0 }
    const totalMin = picked.reduce(
      (sum, q) => sum + (TIME_BY_TYPE[q.type] ?? 2) * (DIFF_MULT[q.difficulty] ?? 1),
      0
    )
    return { totalMin, avgMin: totalMin / picked.length }
  }, [selectedIds])

  const overtimeMetrics = useMemo(() => {
    if (timeMetrics.totalMin === 0) return null
    const delta = timeMetrics.totalMin - activeAsmt.durationMinutes
    const pct = Math.round((timeMetrics.totalMin / activeAsmt.durationMinutes) * 100)
    return { allottedMin: activeAsmt.durationMinutes, delta, pct }
  }, [timeMetrics.totalMin, activeAsmt.durationMinutes])

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
        <span className="text-sm font-semibold">{activeAsmt.title}</span>
        <span className="text-xs text-muted-foreground">· {selectedIds.size} questions selected</span>
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
                <TableCell colSpan={5} className="text-sm text-muted-foreground" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  No questions match this view
                </TableCell>
              </TableRow>
            ) : filteredQuestions.map(q => {
              const isPicked = selectedIds.has(q.id)
              // Custom qb tokens — kept in style (no Tailwind class exists)
              const diffColor: Record<string, string> = {
                Easy:   'var(--qb-diff-bar-easy)',
                Medium: 'var(--qb-diff-bar-medium)',
                Hard:   'var(--qb-diff-bar-hard)',
              }
              const diffWeight: Record<string, string> = {
                Easy: 'font-normal', Medium: 'font-semibold', Hard: 'font-extrabold',
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
                  <TableCell className="text-sm" style={{ maxWidth: 400 }}>
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
                    <span className={`text-xs ${diffWeight[q.difficulty] ?? ''}`} style={{ color: diffColor[q.difficulty] }}>{q.difficulty}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {q.type}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
        timeMetrics={timeMetrics}
        overtimeMetrics={overtimeMetrics}
        durationMinutes={activeAsmt.durationMinutes}
        onDurationChange={onDurationChange}
        bloomsMetrics={bloomsMetrics}
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
          <p className="text-sm text-muted-foreground" style={{ marginBottom: 8 }}>
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
            <Button variant="default" size="sm" onClick={handleSaveView} disabled={!newViewName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Difficulty distribution chart (Task 15) ─────────────────────────────────

function ABDiffChart({ distribution, timeMetrics, overtimeMetrics, durationMinutes, onDurationChange, bloomsMetrics, saveConfirmed, onSave, onCancel: _onCancel }: {
  distribution: { Easy: number; Medium: number; Hard: number }
  timeMetrics: { totalMin: number; avgMin: number }
  overtimeMetrics: { allottedMin: number; delta: number; pct: number } | null
  durationMinutes: number
  onDurationChange: (min: number) => void
  bloomsMetrics: { level: string; count: number; pct: number }[]
  saveConfirmed: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const [inputMin, setInputMin] = useState(String(durationMinutes))
  // Sync input when durationMinutes changes externally (e.g. opening a different assessment)
  React.useEffect(() => { setInputMin(String(durationMinutes)) }, [durationMinutes])

  function commitInput(raw: string) {
    const n = parseInt(raw)
    if (!isNaN(n) && n >= 5) onDurationChange(n)
    else setInputMin(String(durationMinutes))
  }

  const total = distribution.Easy + distribution.Medium + distribution.Hard
  const bars = [
    { label: 'E', count: distribution.Easy,   color: 'var(--qb-diff-bar-easy)'   },
    { label: 'M', count: distribution.Medium, color: 'var(--qb-diff-bar-medium)' },
    { label: 'H', count: distribution.Hard,   color: 'var(--qb-diff-bar-hard)'   },
  ]
  const maxCount = Math.max(...bars.map(b => b.count), 1)

  const overtime = overtimeMetrics ? (() => {
    const { delta } = overtimeMetrics
    if (delta > 0)  return { icon: 'fa-triangle-exclamation', label: `+${Math.round(delta)} min over`, color: 'var(--destructive)',         cls: 'text-destructive'         }
    if (delta > -5) return { icon: 'fa-clock',                label: 'Tight',                          color: 'var(--chart-4)',             cls: 'text-[color:var(--chart-4)]' }
    return               { icon: 'fa-circle-check',           label: 'On time',                        color: 'var(--qb-trust-senior-color)', cls: 'text-[color:var(--qb-trust-senior-color)]' }
  })() : null

  const SEP = () => <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', margin: '0 4px' }} />

  return (
    <div style={{
      padding: '12px 20px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexShrink: 0,
      background: 'var(--ab-chart-bg)',
    }}>
      {/* Difficulty bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="text-xs font-semibold" style={{ color: bar.color, lineHeight: 1 }}>
              {bar.count > 0 ? bar.count : ''}
            </span>
            <div style={{
              width: 24, borderRadius: '3px 3px 0 0',
              background: bar.color,
              height: bar.count === 0 ? 3 : `${(bar.count / maxCount) * 32}px`,
              transition: 'height .2s ease',
              opacity: bar.count === 0 ? 0.2 : 1,
            }} />
            <span className="text-xs text-muted-foreground" style={{ lineHeight: 1 }}>{bar.label}</span>
          </div>
        ))}
      </div>

      <SEP />

      {/* Est. time + overtime */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Total */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Total</span>
            <span className="text-sm font-semibold text-foreground" style={{ lineHeight: 1 }}>{formatMin(timeMetrics.totalMin)}</span>
          </div>
          {/* Avg / question */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Avg / Q</span>
            <span className="text-sm font-semibold text-foreground" style={{ lineHeight: 1 }}>
              {timeMetrics.avgMin > 0 ? formatMin(timeMetrics.avgMin) : '—'}
            </span>
          </div>
          {/* Allotted — number input + preset select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Allotted</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                type="number"
                min={5}
                step={5}
                value={inputMin}
                onChange={e => setInputMin(e.target.value)}
                onBlur={e => commitInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitInput(inputMin) }}
                className="text-sm font-semibold text-foreground text-center"
                style={{ width: 48, height: 26, padding: '0 4px' }}
              />
              <Select
                value={DURATION_OPTIONS.some(o => o.value === durationMinutes) ? String(durationMinutes) : ''}
                onValueChange={v => { onDurationChange(Number(v)); setInputMin(v) }}
              >
                <SelectTrigger className="text-xs" style={{ width: 76, height: 26 }}>
                  <SelectValue placeholder="preset" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {overtime ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={`fa-solid ${overtime.icon} ${overtime.cls}`} aria-hidden="true" style={{ fontSize: 11 }} />
            <span className={`text-[11px] font-semibold ${overtime.cls}`}>{overtime.label}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Select questions to estimate</span>
        )}
      </div>

      {/* Bloom's */}
      {bloomsMetrics.length > 0 && (
        <>
          <SEP />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Bloom&rsquo;s
            </span>
            {bloomsMetrics.slice(0, 3).map(b => (
              <div key={b.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 136 }}>
                <span className="text-xs text-foreground">{b.level}</span>
                <span className="text-xs font-semibold text-foreground">{b.pct}%</span>
              </div>
            ))}
            {bloomsMetrics.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{bloomsMetrics.length - 3} more</span>
            )}
          </div>
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {total === 0 && (
          <span className="text-xs text-muted-foreground">Select questions to build</span>
        )}
        <Button variant="default" size="sm" disabled={total === 0 || saveConfirmed} onClick={onSave}>
          {saveConfirmed ? 'Saved ✓' : 'Save assessment'}
        </Button>
      </div>
    </div>
  )
}
