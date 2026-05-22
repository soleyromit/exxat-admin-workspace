'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Checkbox, Label, Textarea,
} from '@exxat/ds/packages/ui/src'
import { facultyListRows } from '@/lib/faculty-mock-data'
import type { AssessmentReviewRequest } from '@/lib/qb-types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (req: AssessmentReviewRequest) => void
}

export function SendForReviewDialog({ open, onOpenChange, onSubmit }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [dueDate, setDueDate] = useState('')

  const reviewers = facultyListRows.filter(f =>
    f.status === 'active' &&
    (f.adminPosition === 'Program Director' || f.adminPosition === 'Course Coordinator')
  )

  function toggle(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (selectedIds.length === 0) return
    onSubmit({
      reviewerIds: selectedIds,
      message: message.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      sentAt: new Date().toISOString(),
    })
    onOpenChange(false)
    setSelectedIds([])
    setMessage('')
    setDueDate('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Send for review</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Reviewer(s) <span className="text-destructive">*</span>
            </p>
            <div className="flex flex-col gap-2.5">
              {reviewers.map(f => (
                <div key={f.id} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`reviewer-${f.id}`}
                    checked={selectedIds.includes(f.id)}
                    onCheckedChange={() => toggle(f.id)}
                  />
                  <Label htmlFor={`reviewer-${f.id}`} className="text-sm cursor-pointer leading-none">
                    {f.fullName}
                    <span className="text-muted-foreground ml-1.5 text-xs">· {f.adminPosition}</span>
                  </Label>
                </div>
              ))}
            </div>
            {reviewers.length === 0 && (
              <p className="text-xs text-muted-foreground">No Program Directors or Course Coordinators found.</p>
            )}
          </div>

          <div>
            <Label htmlFor="review-message" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Message <span className="font-normal normal-case">— optional</span>
            </Label>
            <Textarea
              id="review-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add context for the reviewer…"
              className="text-sm min-h-[68px] resize-none"
              rows={3}
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
              style={{
                width: '100%', height: 36, padding: '0 10px', fontSize: 13,
                border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
