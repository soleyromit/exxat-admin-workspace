'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@exxatdesignux/ui'
import { MOCK_SUBJECTS } from '@/lib/pce-mock-data'
import type { SubjectKey, PceSubject } from '@/lib/pce-mock-data'

interface SubjectPickerSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  existingSubjectKeys: SubjectKey[]
  onConfirm: (subjectKey: SubjectKey, title: string) => void
  mode?: 'add' | 'edit'
  initialSubjectKey?: SubjectKey
  initialTitle?: string
}

export function SubjectPickerSheet({
  open,
  onOpenChange,
  existingSubjectKeys,
  onConfirm,
  mode = 'add',
  initialSubjectKey,
  initialTitle,
}: SubjectPickerSheetProps) {
  const [selected, setSelected] = useState<SubjectKey | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setSelected(initialSubjectKey ?? null)
      setTitleInput(initialTitle ?? '')
      setSearch('')
    }
  }, [open, initialSubjectKey, initialTitle])

  function handleSelect(subject: PceSubject) {
    setSelected(subject.key)
    setTitleInput(subject.label)
  }

  function handleConfirm() {
    if (!selected) return
    const selectedSubject = MOCK_SUBJECTS.find(s => s.key === selected)
    const finalTitle = titleInput.trim() || selectedSubject?.label || selected
    onConfirm(selected, finalTitle)
    onOpenChange(false)
  }

  const lowerSearch = search.toLowerCase()
  const filteredSubjects = search
    ? MOCK_SUBJECTS.filter(
        s =>
          s.label.toLowerCase().includes(lowerSearch) ||
          (s.description ?? '').toLowerCase().includes(lowerSearch)
      )
    : MOCK_SUBJECTS

  const generalSubjects = filteredSubjects.filter(s => s.isGeneral)
  const programSubjects = filteredSubjects.filter(s => !s.isGeneral)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg flex flex-col gap-0 p-0"
        style={{ maxHeight: '80vh' }}
      >
        {/* ── Fixed header ── */}
        <DialogHeader className="shrink-0 px-5 pt-5 pb-3">
          <DialogTitle>{mode === 'edit' ? 'Edit section' : 'Add section'}</DialogTitle>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {mode === 'edit' ? 'Change the subject or rename this section.' : 'Choose what this section will evaluate.'}
          </p>
          <Input
            autoFocus
            placeholder="Search subjects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mt-3 h-8 text-sm"
          />
        </DialogHeader>

        {/* ── Scrollable subject list ── */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4" style={{ minHeight: 0 }}>
          {generalSubjects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                General
              </p>
              {generalSubjects.map(subject => (
                <SubjectRow
                  key={subject.key}
                  subject={subject}
                  isSelected={selected === subject.key}
                  isDisabled={existingSubjectKeys.includes(subject.key)}
                  onSelect={() => handleSelect(subject)}
                />
              ))}
            </div>
          )}

          {programSubjects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                From your program
              </p>
              {programSubjects.map(subject => (
                <SubjectRow
                  key={subject.key}
                  subject={subject}
                  isSelected={selected === subject.key}
                  isDisabled={existingSubjectKeys.includes(subject.key)}
                  onSelect={() => handleSelect(subject)}
                />
              ))}
            </div>
          )}

          {filteredSubjects.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              No subjects match your search.
            </p>
          )}
        </div>

        {/* ── Fixed footer: title + actions ── */}
        <div className="shrink-0 border-t border-border px-5 pt-4 pb-2">
          <div className="mb-4">
            <Label htmlFor="section-title" className="text-xs font-medium mb-1.5 block"
                   style={{ color: 'var(--muted-foreground)' }}>
              Section title
              <span className="ml-1 font-normal" style={{ color: 'var(--muted-foreground)' }}>
                (optional)
              </span>
            </Label>
            <Input
              id="section-title"
              placeholder={selected ? 'Customise the section name…' : 'Select a subject first'}
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              disabled={!selected}
              className="h-8 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" disabled={!selected} onClick={handleConfirm}>
              {mode === 'edit' ? 'Save changes' : 'Add section'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SubjectRowProps {
  subject: PceSubject
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}

function SubjectRow({ subject, isSelected, isDisabled, onSelect }: SubjectRowProps) {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onClick={isDisabled ? undefined : onSelect}
      onKeyDown={isDisabled ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors"
      style={{
        borderColor: isSelected ? 'var(--brand-color)' : 'var(--border)',
        background: isSelected ? 'var(--brand-tint)' : isDisabled ? 'var(--muted)' : 'var(--card)',
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
        cursor: isDisabled ? 'default' : 'pointer',
      }}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-sm font-medium leading-tight"
           style={{ color: isSelected ? 'var(--brand-color)' : 'var(--foreground)' }}>
          {subject.label}
        </p>
        {subject.description && (
          <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
            {subject.description}
          </p>
        )}
        {!subject.isGeneral && subject.prismCount === 0 && !isDisabled && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--chart-4)' }}>
            No {subject.label.toLowerCase()}s assigned yet — will auto-suppress.
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {isDisabled ? (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Already added</span>
        ) : subject.isGeneral ? (
          <span className="inline-flex items-center rounded text-xs px-2 py-0.5 font-medium"
                style={{ background: 'var(--brand-tint)', color: 'var(--brand-color)' }}>
            Always visible
          </span>
        ) : subject.prismCount === 0 ? (
          <span className="text-xs" style={{ color: 'var(--chart-4)' }}>0 in Prism</span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {subject.prismCount} in Prism
          </span>
        )}
      </div>
    </div>
  )
}
