'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Checkbox, Label, Textarea, Separator,
} from '@exxatdesignux/ui'
import { facultyListRows } from '@/lib/faculty-mock-data'
import type { AssessmentReviewRequest } from '@/lib/qb-types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (req: AssessmentReviewRequest) => void
}

export function SendForReviewDialog({ open, onOpenChange, onSubmit }: Props) {
  const [l1Ids, setL1Ids] = useState<string[]>([])
  const [l2Ids, setL2Ids] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [dueDate, setDueDate] = useState('')

  const l1Reviewers = facultyListRows.filter(f =>
    f.status === 'active' &&
    (f.adminPosition === 'Course Coordinator' || f.adminPosition === 'Instructor')
  )
  const l2Reviewers = facultyListRows.filter(f =>
    f.status === 'active' &&
    f.adminPosition === 'Program Director'
  )

  function toggleL1(id: string) {
    setL1Ids(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleL2(id: string) {
    setL2Ids(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (l1Ids.length === 0) return
    onSubmit({
      reviewerIds: l1Ids,
      l2ReviewerIds: l2Ids.length > 0 ? l2Ids : undefined,
      reviewLevel: 1,
      l1ApprovedAt: null,
      message: message.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      sentAt: new Date().toISOString(),
    })
    onOpenChange(false)
    reset()
  }

  function reset() {
    setL1Ids([])
    setL2Ids([])
    setMessage('')
    setDueDate('')
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Send for review</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            High-stakes exams go through two levels of review before publishing.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          {/* L1 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>LEVEL 1</span>
              <p className="text-xs font-semibold text-foreground">Peer review</p>
              <span className="text-xs text-destructive ms-auto">Required</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Coordinators or instructors who review question quality.</p>
            {l1Reviewers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {l1Reviewers.map(f => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`l1-${f.id}`}
                      checked={l1Ids.includes(f.id)}
                      onCheckedChange={() => toggleL1(f.id)}
                    />
                    <Label htmlFor={`l1-${f.id}`} className="text-sm cursor-pointer leading-none">
                      {f.fullName}
                      <span className="text-muted-foreground ml-1.5 text-xs">· {f.adminPosition}</span>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No coordinators or instructors available — add faculty to this course before sending for review.
              </p>
            )}
          </div>

          <Separator />

          {/* L2 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>LEVEL 2</span>
              <p className="text-xs font-semibold text-foreground">Chairperson approval</p>
              <span className="text-xs text-muted-foreground ms-auto">Optional</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">A Program Director gives final approval to publish.</p>
            {l2Reviewers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {l2Reviewers.map(f => (
                  <div key={f.id} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`l2-${f.id}`}
                      checked={l2Ids.includes(f.id)}
                      onCheckedChange={() => toggleL2(f.id)}
                    />
                    <Label htmlFor={`l2-${f.id}`} className="text-sm cursor-pointer leading-none">
                      {f.fullName}
                      <span className="text-muted-foreground ml-1.5 text-xs">· {f.adminPosition}</span>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No Program Directors found.</p>
            )}
          </div>

          <Separator />

          <div>
            <Label htmlFor="review-message" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Message <span className="font-normal normal-case">— optional</span>
            </Label>
            <Textarea
              id="review-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add context for reviewers…"
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="review-due" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Due date <span className="font-normal normal-case">— optional</span>
            </Label>
            <input
              id="review-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              aria-label="Review due date"
              className="w-full h-9 px-2.5 text-[13px] rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={l1Ids.length === 0} onClick={handleSubmit} className="gap-1.5">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
