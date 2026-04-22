'use client'
import { useState } from 'react'
import { QBProvider } from './qb-state'
import { QBLayoutInner } from './qb-layout'
import { QBHeader } from './qb-header'
import { QBSidebar } from './qb-sidebar'
import { QBTitle } from './qb-title'
import { QBTable } from './qb-table'
import { useQB } from './qb-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button,
} from '@exxat/ds/packages/ui/src'

function RequestAccessDialog({
  open,
  onOpenChange,
  facultyName,
  facultyRole,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  facultyName: string
  facultyRole: string
}) {
  const [copied, setCopied] = useState(false)
  const [copiedSubject, setCopiedSubject] = useState(false)

  const subject = `Question Bank Access Request — ${facultyName}`

  const body = `Dear Department Head / Administrator,

I am writing to request access to the Question Bank in the Exxat Exam Management system.

As ${facultyRole} faculty, I currently do not have access to any course question bank folders. Access would allow me to view questions relevant to my teaching assignments and contribute to the question pool for my courses.

Could you please assign the appropriate course folder(s) to my account at your earliest convenience?

Thank you for your time and assistance.

Best regards,
${facultyName}
${facultyRole}`

  function copySubject() {
    navigator.clipboard.writeText(subject)
    setCopiedSubject(true)
    setTimeout(() => setCopiedSubject(false), 2000)
  }

  function copyBody() {
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyAll() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 13, color: 'var(--brand-color)' }} />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">Request access email</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Copy and send to your department head or admin</p>
            </div>
          </div>
        </DialogHeader>

        {/* Email template */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Subject line */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Subject</span>
              <Button
                variant="ghost" size="icon-xs"
                aria-label="Copy subject line"
                onClick={copySubject}
                style={{ color: copiedSubject ? 'var(--brand-color)' : 'var(--muted-foreground)', gap: 4, width: 'auto', padding: '0 6px', fontSize: 11 }}
              >
                <i className={`fa-light ${copiedSubject ? 'fa-check' : 'fa-copy'}`} aria-hidden="true" style={{ fontSize: 11 }} />
                {copiedSubject ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
              fontSize: 13,
              color: 'var(--foreground)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}>
              {subject}
            </div>
          </div>

          {/* Body */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Message</span>
            </div>
            <div style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              fontSize: 13,
              color: 'var(--foreground)',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-sans)',
            }}>
              {body}
            </div>
          </div>

          {/* Tip */}
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 10, marginRight: 4 }} />
            You can edit this message before sending. Ask your admin to share the course folder directly in Exxat.
          </p>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={copyAll}
            style={{ gap: 6, minWidth: 140 }}
          >
            <i className={`fa-light ${copied ? 'fa-check' : 'fa-copy'}`} aria-hidden="true" style={{ fontSize: 12 }} />
            {copied ? 'Copied to clipboard!' : 'Copy full message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QBContent() {
  const { currentPersona, selectedFolderId, accessibleFolderIds } = useQB()
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const isAdmin = currentPersona.role === 'exam_admin'
  const isFaculty = !isAdmin
  const hasFolderSelected = selectedFolderId !== null
  const hasAssignedCourses = accessibleFolderIds.size > 0

  if (isFaculty && !hasAssignedCourses) {
    return (
      <>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 }}>
          {/* Illustration */}
          <div style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%', backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-light fa-lock-keyhole" aria-hidden="true" style={{ fontSize: 34, color: 'var(--brand-color)', opacity: 0.85 }} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', backgroundColor: 'var(--background)', border: '1.5px solid var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 10, color: 'var(--brand-color)' }} />
            </span>
            <span style={{ position: 'absolute', bottom: 8, left: 6, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'var(--background)', border: '1.5px solid var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 8, color: 'var(--brand-color)' }} />
            </span>
          </div>

          {/* Text */}
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--foreground)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>No question banks assigned yet</h2>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              Once your department admin shares a course folder with you, questions from that course will appear here — filtered to what&apos;s relevant to your teaching.
            </p>
          </div>

          {/* CTA card */}
          <button
            type="button"
            onClick={() => setRequestDialogOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px', borderRadius: 12,
              backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))',
              border: '1px solid color-mix(in oklch, var(--brand-color) 20%, var(--background))',
              width: '100%', maxWidth: 380,
              cursor: 'pointer', textAlign: 'left',
              transition: 'background-color 120ms, border-color 120ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'color-mix(in oklch, var(--brand-color) 12%, var(--background))'
              e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--brand-color) 30%, var(--background))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'color-mix(in oklch, var(--brand-color) 8%, var(--background))'
              e.currentTarget.style.borderColor = 'color-mix(in oklch, var(--brand-color) 20%, var(--background))'
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--brand-color) 14%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-light fa-envelope" aria-hidden="true" style={{ fontSize: 15, color: 'var(--brand-color)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-color)', marginBottom: 2 }}>Request access from your admin</p>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>Ask your department head to assign a course folder to your account.</p>
            </div>
            <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)', flexShrink: 0, opacity: 0.7 }} />
          </button>
        </div>

        <RequestAccessDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          facultyName={currentPersona.name}
          facultyRole={currentPersona.role}
        />
      </>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <QBTitle />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <QBTable />
      </div>
    </div>
  )
}

function QBInner() {
  return (
    <QBLayoutInner>
      <QBHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <QBSidebar />
        <QBContent />
      </div>
    </QBLayoutInner>
  )
}

export function QuestionBankClient() {
  return (
    <QBProvider>
      <QBInner />
    </QBProvider>
  )
}
