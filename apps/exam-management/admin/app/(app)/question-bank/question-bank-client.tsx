'use client'
import { QBProvider } from './qb-state'
import { QBLayoutInner } from './qb-layout'
import { QBHeader } from './qb-header'
import { QBSidebar } from './qb-sidebar'
import { QBTitle } from './qb-title'
import { QBTable } from './qb-table'
import { useQB } from './qb-state'
import { ManageCollaboratorsModal } from './qb-modals'

function QBContent() {
  const { currentPersona, selectedFolderId } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const isFaculty = !isAdmin
  const hasFolderSelected = selectedFolderId !== null
  const hasAssignedCourses = (currentPersona.assignedFolders?.length ?? 0) > 0

  if (isFaculty && !hasAssignedCourses) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-regular fa-hourglass-half" aria-hidden="true" style={{ fontSize: 28, color: 'var(--muted-foreground)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>No courses assigned yet</h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', maxWidth: 340 }}>
            Your admin will assign course folders. You&apos;ll see your courses here as soon as they&apos;re assigned.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isFaculty && hasFolderSelected && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'color-mix(in oklch, var(--chart-1) 10%, var(--background))',
          borderBottom: '1px solid color-mix(in oklch, var(--chart-1) 20%, var(--background))',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <i className="fa-regular fa-circle-info" aria-hidden="true" style={{ color: 'var(--chart-1)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--foreground)' }}>
            Faculty view — browse saved questions, add your own, or request edit access on existing ones.
          </span>
        </div>
      )}
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
      <ManageCollaboratorsModal />
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
