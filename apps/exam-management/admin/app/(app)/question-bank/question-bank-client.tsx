'use client'
import { QBProvider } from './qb-state'
import { QBLayoutInner } from './qb-layout'
import { QBHeader } from './qb-header'
import { QBSidebar } from './qb-sidebar'
import { QBTable } from './qb-table'
import { useQB } from './qb-state'

function QBContent() {
  const { currentPersona, accessibleFolderIds } = useQB()
  const isAdmin = currentPersona.role === 'exam_admin'
  const isFaculty = !isAdmin
  const hasAssignedCourses = accessibleFolderIds.size > 0

  if (isFaculty && !hasAssignedCourses) {
    return (
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
          <h2 className="text-xl font-bold text-foreground" style={{ marginBottom: 10, fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>No question banks assigned yet</h2>
          <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>
            Once your department admin shares a course folder with you, questions from that course will appear here — filtered to what&apos;s relevant to your teaching.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <QBTable />
    </div>
  )
}

function QBInner() {
  return (
    <QBLayoutInner>
      <QBHeader />
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
