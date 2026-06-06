'use client'

import { useState } from 'react'
import { Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@exxatdesignux/ui'
import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
import { facultyListRows } from '@/lib/faculty-mock-data'

interface Props {
  activeAsmt: AssessmentDraft
  onUpdateSection: (sectionId: string, patch: Partial<AssessmentSection>) => void
  onAddSection?: (title: string) => void
  activeSectionId: string | null
  onSetActiveSection: (id: string | null) => void
}

export function SectionsOutline({
  activeAsmt, onUpdateSection, onAddSection,
  activeSectionId, onSetActiveSection,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  function handleAddSection() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAddSection?.(trimmed)
    setNewTitle('')
    setShowAddForm(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] shrink-0">
        <span className="text-xs font-semibold text-[var(--foreground)]">
          {activeAsmt.sections.length} section{activeAsmt.sections.length !== 1 ? 's' : ''}
        </span>
        {activeSectionId && (
          <Button
            variant="ghost" size="icon-xs"
            aria-label="Deselect section"
            onClick={() => onSetActiveSection(null)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <i className="fa-light fa-xmark text-[10px]" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto py-1">
        {activeAsmt.sections.map((section, idx) => (
          <SectionNavItem
            key={section.id}
            section={section}
            index={idx}
            isActive={activeSectionId === section.id}
            onSelect={() => onSetActiveSection(activeSectionId === section.id ? null : section.id)}
            onUpdateSection={onUpdateSection}
          />
        ))}

        {/* Add section */}
        {onAddSection && (
          <div className="px-3 pt-1 pb-2">
            {showAddForm ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSection()
                    if (e.key === 'Escape') { setShowAddForm(false); setNewTitle('') }
                  }}
                  placeholder="Section title…"
                  autoFocus
                  className="flex-1 text-xs px-2 py-1 rounded border border-[var(--border-control-35)] bg-[var(--background)] text-[var(--foreground)] outline-none"
                  aria-label="New section title"
                />
                <Button size="sm" onClick={handleAddSection} className="h-6 px-2 text-xs">Add</Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewTitle('') }} className="h-6 px-2 text-xs">✕</Button>
              </div>
            ) : (
              <Button
                variant="ghost" size="xs"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-0 h-auto py-0.5 w-full justify-start"
              >
                <i className="fa-light fa-plus text-[10px]" aria-hidden="true" />
                Add section
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionNavItem({
  section, index, isActive, onSelect, onUpdateSection,
}: {
  section: AssessmentSection
  index: number
  isActive: boolean
  onSelect: () => void
  onUpdateSection: (sectionId: string, patch: Partial<AssessmentSection>) => void
}) {
  const assignedFaculty = section.facultyId
    ? facultyListRows.find(f => f.id === section.facultyId)
    : null
  const isReady = section.status === 'ready'

  return (
    <div
      className="group relative"
      style={{
        background: isActive ? 'var(--muted)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
      }}
    >
      {/* Main clickable row */}
      <Button
        variant="ghost"
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2 h-auto justify-start rounded-none"
        aria-pressed={isActive}
        aria-label={`Select section ${section.title}`}
      >
        {/* Index */}
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted-foreground)] w-4 text-right">
          {index + 1}.
        </span>

        {/* Title */}
        <span className="flex-1 min-w-0 text-sm truncate font-medium text-[var(--foreground)]">
          {section.title}
        </span>

        {/* Count chip */}
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted-foreground)] bg-[var(--muted)] rounded px-1.5 py-0.5 leading-none">
          {section.questionIds.length}
        </span>

        {/* Ready badge */}
        {isReady && (
          <Badge
            variant="outline"
            className="shrink-0 h-4 px-1.5 text-[10px] border-[var(--chart-2)] text-[var(--chart-2)] leading-none"
          >
            Ready
          </Badge>
        )}
      </Button>

      {/* Faculty initials — secondary info, muted */}
      {assignedFaculty && !isReady && (
        <div className="px-3 pb-1.5 -mt-1 flex items-center gap-1">
          <span className="text-[10px] text-[var(--muted-foreground)]" title={assignedFaculty.fullName}>
            <i className="fa-light fa-user text-[9px] mr-0.5" aria-hidden="true" />
            {assignedFaculty.fullName.split(' ').map((n: string) => n[0]).join('')}
          </span>
        </div>
      )}

      {/* Options menu — hover-only */}
      <div className="absolute right-1 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="icon-xs"
              aria-label={`Options for section ${section.title}`}
              className="h-6 w-6"
            >
              <i className="fa-regular fa-ellipsis text-[10px]" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onUpdateSection(section.id, { status: isReady ? 'drafting' : 'ready' })}>
              <i className={`fa-regular ${isReady ? 'fa-rotate-left' : 'fa-circle-check'} text-xs`} aria-hidden="true" />
              {isReady ? 'Reopen' : 'Mark ready'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[var(--destructive)]" onClick={() => onUpdateSection(section.id, { status: 'drafting' })}>
              <i className="fa-regular fa-trash text-xs" aria-hidden="true" />
              Remove section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
