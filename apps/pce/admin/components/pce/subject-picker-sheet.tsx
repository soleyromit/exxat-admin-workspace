'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Button,
  Input,
  Label,
  Separator,
} from '@exxatdesignux/ui'
import { MOCK_SUBJECTS } from '@/lib/pce-mock-data'
import type { SubjectKey, PceSubject } from '@/lib/pce-mock-data'

interface SubjectPickerSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Subject keys already used in this template — shown as disabled */
  existingSubjectKeys: SubjectKey[]
  onConfirm: (subjectKey: SubjectKey, title: string) => void
}

export function SubjectPickerSheet({
  open,
  onOpenChange,
  existingSubjectKeys,
  onConfirm,
}: SubjectPickerSheetProps) {
  const [selected, setSelected] = useState<SubjectKey | null>(null)
  const [titleInput, setTitleInput] = useState('')
  const [search, setSearch] = useState('')

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setSelected(null)
      setTitleInput('')
      setSearch('')
    }
  }, [open])

  // Pre-fill title when subject is selected
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: 480, maxWidth: '100vw' }}>
        <SheetHeader>
          <SheetTitle>Add section</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 px-4">
          {/* Subject selection */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="subject-search">
              Subject <span style={{ color: 'var(--destructive)' }}>*</span>
            </Label>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              What entity will this section evaluate?
            </p>

            {/* Search */}
            <div className="relative mt-1">
              <Input
                id="subject-search"
                placeholder="Search subjects…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* General group */}
          {generalSubjects.length > 0 && (
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: 'var(--muted-foreground)' }}
              >
                General
              </p>
              {generalSubjects.map(subject => (
                <SubjectCard
                  key={subject.key}
                  subject={subject}
                  isSelected={selected === subject.key}
                  isDisabled={existingSubjectKeys.includes(subject.key)}
                  onSelect={() => handleSelect(subject)}
                />
              ))}
            </div>
          )}

          {/* From Your Program group */}
          {programSubjects.length > 0 && (
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color: 'var(--muted-foreground)' }}
              >
                From your program
              </p>
              {programSubjects.map(subject => (
                <SubjectCard
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
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
              No subjects match your search.
            </p>
          )}

          {/* Section title override */}
          <div className="flex flex-col gap-1.5 mt-2">
            <Label htmlFor="section-title">Section title <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span></Label>
            <Input
              id="section-title"
              placeholder={`e.g. "Faculty Evaluation"`}
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              disabled={!selected}
            />
          </div>
        </div>

        <Separator />

        <SheetFooter className="flex flex-row items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={!selected}
            onClick={handleConfirm}
          >
            Add section
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface SubjectCardProps {
  subject: PceSubject
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}

function SubjectCard({ subject, isSelected, isDisabled, onSelect }: SubjectCardProps) {
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onClick={isDisabled ? undefined : onSelect}
      onKeyDown={isDisabled ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors"
      style={{
        borderColor: isSelected ? 'var(--brand-color)' : 'var(--border)',
        backgroundColor: isSelected
          ? 'var(--brand-tint)'
          : isDisabled
          ? 'var(--muted)'
          : 'var(--card)',
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? 'none' : 'auto',
        cursor: isDisabled ? 'default' : 'pointer',
      }}
    >
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-tight"
          style={{ color: isSelected ? 'var(--brand-color)' : 'var(--foreground)' }}
        >
          {subject.label}
        </p>
        {subject.description && (
          <p className="text-xs leading-snug" style={{ color: 'var(--muted-foreground)' }}>
            {subject.description}
          </p>
        )}
        {/* Zero prismCount warning */}
        {!subject.isGeneral && subject.prismCount === 0 && !isDisabled && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--chart-4)' }}>
            No {subject.label.toLowerCase()}s assigned yet. Will auto-suppress.
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {isDisabled ? (
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Already added
          </span>
        ) : subject.isGeneral ? (
          <span
            className="inline-flex items-center rounded text-xs px-2 py-0.5 font-medium"
            style={{
              backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
              color: 'var(--brand-color)',
            }}
          >
            Always visible
          </span>
        ) : subject.prismCount === 0 ? (
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--chart-4)' }}
          >
            0 in Prism
          </span>
        ) : (
          <span
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {subject.prismCount} in Prism
          </span>
        )}
      </div>
    </div>
  )
}
