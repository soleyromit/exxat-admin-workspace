'use client'

/**
 * ASSIGN PRACTICE DIALOG — Aarti's "course-coordinator-meets-student" workflow.
 *
 * Aarti's email: post-exam, the course coordinator analyzes bottom-20% students
 * and assigns targeted practice questions in their weak content areas before
 * the next exam. ExamSoft does not offer this — it's our differentiator.
 *
 * Inputs:
 *   1. Student selection — usually pre-seeded with bottom-20% performers,
 *      faculty can toggle individuals off
 *   2. Competency / content area (where they were weak)
 *   3. Question count + difficulty mix
 *   4. Optional message that the student will see in their assigned packs list
 *   5. Optional due date
 *
 * On submit, the assignment becomes a Faculty Pack visible on each student's
 * /resources page (Faculty assigned tab).
 */

import { useState, useMemo } from 'react'
import {
  Avatar, AvatarFallback,
  Badge, Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Checkbox,
  Input,
  Label,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Textarea,
  LocalBanner,
} from '@exxat/ds/packages/ui/src'

interface PracticeStudent {
  id: string
  name: string
  initials: string
  scoreOnAssessment: number
  weakArea: string
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  assessmentTitle: string
  defaultStudents: PracticeStudent[]
  contentAreas: { id: string; name: string }[]
  onAssign?: (payload: {
    studentIds: string[]
    contentAreaId: string
    questionCount: number
    message: string
    dueDate: string | null
  }) => void
}

export function AssignPracticeDialog({
  open, onOpenChange, assessmentTitle, defaultStudents, contentAreas, onAssign,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultStudents.map(s => s.id))
  )
  const [contentAreaId, setContentAreaId] = useState<string>(contentAreas[0]?.id ?? '')
  const [count, setCount] = useState(15)
  const [message, setMessage] = useState('')
  const [dueDate, setDueDate] = useState('')

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const selectAll  = () => setSelected(new Set(defaultStudents.map(s => s.id)))
  const clearAll   = () => setSelected(new Set())

  const selectedCount = selected.size
  const canSubmit = selectedCount > 0 && contentAreaId && count > 0

  const submit = () => {
    if (!canSubmit) return
    onAssign?.({
      studentIds: Array.from(selected),
      contentAreaId,
      questionCount: count,
      message,
      dueDate: dueDate || null,
    })
    onOpenChange(false)
  }

  // For preview: show the chosen content area's name
  const chosenArea = useMemo(
    () => contentAreas.find(a => a.id === contentAreaId)?.name ?? '',
    [contentAreas, contentAreaId]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="fa-duotone fa-solid fa-bullseye-arrow text-brand" aria-hidden="true" />
            Assign practice to bottom-20% students
          </DialogTitle>
          <DialogDescription>
            From <span className="font-medium text-foreground">{assessmentTitle}</span>.
            Each selected student will see this pack in their{' '}
            <span className="font-medium text-foreground">Study Resources → Faculty assigned</span> tab.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">

          {/* ─── Students ─────────────────────────────────────────────── */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Students <span className="text-muted-foreground font-normal">({selectedCount} selected)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-auto py-0.5 text-xs" onClick={selectAll}>
                  Select all
                </Button>
                <Button variant="ghost" size="sm" className="h-auto py-0.5 text-xs" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1 rounded-lg border border-border p-1 max-h-56 overflow-y-auto">
              {defaultStudents.map(s => {
                const isSelected = selected.has(s.id)
                const tone =
                  s.scoreOnAssessment < 60 ? 'var(--state-error-text-dark)'  :
                  s.scoreOnAssessment < 70 ? 'var(--state-warning-dark)'      :
                                              'var(--state-info-blue-dark)'
                return (
                  <Button
                    key={s.id}
                    variant="ghost"
                    onClick={() => toggle(s.id)}
                    aria-pressed={isSelected}
                    className="flex items-center justify-start gap-3 h-auto rounded-md px-2 py-2 text-start whitespace-normal w-full"
                    style={isSelected ? { backgroundColor: 'color-mix(in oklch, var(--brand-color) 6%, var(--background))' } : {}}
                  >
                    <Checkbox checked={isSelected} aria-hidden="true" tabIndex={-1} className="pointer-events-none" />
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                        {s.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Weak in <span className="text-foreground">{s.weakArea}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: tone }}>
                      {s.scoreOnAssessment}%
                    </span>
                  </Button>
                )
              })}
            </div>
          </section>

          {/* ─── Pack config ─────────────────────────────────────────── */}
          <section className="grid gap-4 grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ap-area" className="text-sm font-medium">Content area</Label>
              <Select value={contentAreaId} onValueChange={setContentAreaId}>
                <SelectTrigger id="ap-area">
                  <SelectValue placeholder="Pick a content area…" />
                </SelectTrigger>
                <SelectContent>
                  {contentAreas.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ap-count" className="text-sm font-medium">Number of questions</Label>
              <Input
                id="ap-count"
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="ap-due" className="text-sm font-medium">
                Due date <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="ap-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </section>

          {/* ─── Message ─────────────────────────────────────────────── */}
          <section className="flex flex-col gap-1.5">
            <Label htmlFor="ap-msg" className="text-sm font-medium">
              Message to student <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="ap-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              rows={3}
              placeholder={`E.g. "Based on your ${assessmentTitle} performance, focus on these ${chosenArea ? chosenArea.toLowerCase() : 'topics'} questions before the next exam."`}
              className="resize-none"
            />
            <span className="text-[10px] text-muted-foreground self-end tabular-nums">{message.length}/500</span>
          </section>

          {/* ─── Preview strip ───────────────────────────────────────── */}
          <LocalBanner
            variant="promo"
            icon="fa-eye"
            title={chosenArea ? `${chosenArea} — Catch-up Pack` : 'Catch-up Pack'}
          >
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-0.5">
              Student preview
            </span>
            {count} {count === 1 ? 'question' : 'questions'} · assigned to {selectedCount} {selectedCount === 1 ? 'student' : 'students'}
            {dueDate && ` · due ${new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </LocalBanner>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!canSubmit} className="gap-2">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Assign to {selectedCount} {selectedCount === 1 ? 'student' : 'students'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
