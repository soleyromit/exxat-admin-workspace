'use client'
import { useState, useRef, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Textarea,
  Field, FieldLabel,
} from '@exxat/ds/packages/ui/src'

// ── Request Edit Access Modal ─────────────────────────────────────────────────
export function RequestEditAccessModal({ questionTitle, open, onOpenChange }: {
  questionTitle: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current) }
  }, [])

  function submit() {
    setSent(true)
    submitTimerRef.current = setTimeout(() => {
      onOpenChange(false)
      setSent(false)
      setMessage('')
      submitTimerRef.current = null
    }, 1800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-light fa-lock-keyhole-open" aria-hidden="true" style={{ fontSize: 16, color: 'var(--brand-color)' }} />
            </div>
            <div>
              <DialogTitle>Request Edit Access</DialogTitle>
              <DialogDescription className="text-xs" style={{ marginTop: 2 }}>
                The owner will be notified and can approve or decline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {sent
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--qb-status-saved-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-light fa-circle-check" aria-hidden="true" style={{ fontSize: 22, color: 'var(--qb-status-saved-fg)' }} />
              </div>
              <div>
                <div className="text-sm font-semibold">Request sent</div>
                <div className="text-xs text-muted-foreground" style={{ marginTop: 2 }}>
                  You&apos;ll get an email when the owner responds.
                </div>
              </div>
            </div>
          )
          : (
            <>
              {/* Question context preview */}
              <div className="text-xs text-muted-foreground" style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--muted)', lineHeight: 1.4 }}>
                <i className="fa-light fa-file-lines" aria-hidden="true" style={{ marginRight: 6 }} />
                {questionTitle.length > 80 ? questionTitle.slice(0, 80) + '…' : questionTitle}
              </div>

              <Field orientation="vertical">
                <FieldLabel htmlFor="req-message">Message (optional)</FieldLabel>
                <Textarea
                  id="req-message"
                  placeholder="Let the owner know why you need edit access…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="text-sm"
                  style={{ resize: 'none' }}
                />
              </Field>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button variant="default" size="sm" onClick={submit}>
                  <i className="fa-light fa-paper-plane" aria-hidden="true" />
                  Send Request
                </Button>
              </DialogFooter>
            </>
          )
        }
      </DialogContent>
    </Dialog>
  )
}

