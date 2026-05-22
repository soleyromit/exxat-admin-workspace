'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Badge,
  Separator,
  SidebarTrigger,
  Textarea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  LocalBanner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DragHandleGripIcon,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SECTION_LABELS } from '@/lib/pce-mock-data'
import type { TemplateSection, TemplateQuestion } from '@/lib/pce-mock-data'

const ALL_SECTIONS: TemplateSection[] = ['course_content', 'faculty_performance', 'course_director']

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { templates, updateTemplate, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = usePce()

  const [openCard, setOpenCard] = useState<'new' | string | null>(null)
  const [cardText, setCardText] = useState('')
  const [cardType, setCardType] = useState<'likert' | 'free_text'>('likert')
  const [saved, setSaved] = useState(false)
  const dragIndex = useRef<number | null>(null)

  const template = templates.find(t => t.id === id)

  // Derive activeSection lazily — must be declared before early return
  const [activeSection, setActiveSection] = useState<TemplateSection>(
    () => template?.sections[0] ?? 'course_content'
  )

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <i className="fa-light fa-circle-exclamation text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <p className="text-sm font-medium">Template not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/templates">Back to Templates</Link>
        </Button>
      </div>
    )
  }

  // template is guaranteed non-undefined beyond this point (early return above)
  const t = template

  const totalQuestions = Object.values(t.questions).flat().length
  const canPublish = totalQuestions > 0

  function openAddCard() {
    setOpenCard('new')
    setCardText('')
    setCardType('likert')
  }

  function openEditCard(q: TemplateQuestion) {
    setOpenCard(q.id)
    setCardText(q.text)
    setCardType(q.answerType)
  }

  function closeCard() {
    setOpenCard(null)
    setCardText('')
    setCardType('likert')
  }

  function handleAdd() {
    if (!cardText.trim()) return
    addQuestion(t.id, activeSection, cardText.trim(), cardType)
    closeCard()
  }

  function handleEditSave(questionId: string) {
    if (!cardText.trim()) return
    updateQuestion(t.id, activeSection, questionId, { text: cardText.trim(), answerType: cardType })
    closeCard()
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    reorderQuestions(t.id, activeSection, dragIndex.current, index)
    dragIndex.current = index
  }

  function handleDragEnd() {
    dragIndex.current = null
  }

  function handleSaveDraft() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handlePublish() {
    updateTemplate(t.id, { status: 'active' })
  }

  function handleUnpublish() {
    updateTemplate(t.id, { status: 'draft' })
  }

  function handleRemoveSection(section: TemplateSection) {
    const nextSections = t.sections.filter(s => s !== section)
    updateTemplate(t.id, { sections: nextSections })
    if (activeSection === section) {
      setActiveSection(nextSections.find(s => s !== section) ?? nextSections[0] ?? 'course_content')
    }
  }

  const sectionQs = t.questions[activeSection]
  const availableSections = ALL_SECTIONS.filter(s => !t.sections.includes(s))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/templates" className="text-sm text-muted-foreground hover:underline">
          Templates
        </Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1 truncate">{t.name}</span>
        <Badge
          variant="secondary"
          className="rounded shrink-0"
          style={t.status === 'active'
            ? { backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', color: 'var(--brand-color-dark)' }
            : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
          }
        >
          {t.status === 'active' ? 'Active' : 'Draft'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save draft
          </Button>
          {t.status === 'active' ? (
            <Button variant="outline" size="sm" onClick={handleUnpublish}>
              Unpublish
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!canPublish}
                    onClick={handlePublish}
                    style={!canPublish ? { pointerEvents: 'none' } : undefined}
                  >
                    Publish
                  </Button>
                </span>
              </TooltipTrigger>
              {!canPublish && (
                <TooltipContent>Add at least one question before publishing</TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </header>

      {saved && (
        <div style={{ paddingInline: 28, paddingTop: 12 }}>
          <LocalBanner variant="success" dismissible onDismiss={() => setSaved(false)}>
            Draft saved.
          </LocalBanner>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex flex-col gap-1 border-r border-border shrink-0 overflow-y-auto"
          style={{ width: 168, padding: '16px 10px', background: 'var(--muted)' }}
        >
          {/* Course type field */}
          <div className="flex flex-col gap-1 mb-4" style={{ paddingInline: 6 }}>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--muted-foreground)', marginBottom: 2 }}
            >
              Course type
            </p>
            <Select
              value={t.courseType ?? 'any'}
              onValueChange={(v) =>
                updateTemplate(t.id, { courseType: v as 'any' | 'didactic' | 'clinical' })
              }
            >
              <SelectTrigger aria-label="Course type" style={{ height: 30, fontSize: 12 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="didactic">Didactic</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p
            className="text-xs font-medium"
            style={{ color: 'var(--muted-foreground)', marginBottom: 6, paddingInline: 6 }}
          >
            Sections
          </p>

          {t.sections.map(section => {
            const count = t.questions[section].length
            const isActive = section === activeSection
            const canRemove = count === 0

            return (
              <div key={section} className="flex items-center group">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActiveSection(section); closeCard() }}
                  className="flex items-center justify-between text-sm px-2.5 py-2 text-left flex-1 h-auto"
                  style={isActive
                    ? { background: 'var(--brand-tint)', color: 'var(--brand-color)', fontWeight: 600 }
                    : { color: count === 0 ? 'var(--muted-foreground)' : 'var(--foreground)' }
                  }
                >
                  <span className="leading-tight">{SECTION_LABELS[section]}</span>
                  <span
                    className="text-xs tabular-nums ml-2"
                    style={{ color: isActive ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
                  >
                    {count}
                  </span>
                </Button>

                {/* Remove section button — only shown when section has 0 questions */}
                {canRemove ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${SECTION_LABELS[section]} section`}
                        className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        style={{ width: 20, height: 20 }}
                        onClick={() => handleRemoveSection(section)}
                      >
                        <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Remove section</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center"
                        style={{ width: 20, height: 20, cursor: 'default' }}
                        tabIndex={0}
                      >
                        <i className="fa-light fa-xmark text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">Remove all questions first</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )
          })}

          {/* Add section button */}
          {availableSections.length > 0 && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start mt-1 text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                  Add section
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" style={{ minWidth: 180 }}>
                {availableSections.map(s => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      updateTemplate(t.id, { sections: [...t.sections, s] })
                      setActiveSection(s)
                    }}
                  >
                    {SECTION_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </aside>

        <main className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '20px 28px 32px' }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold">{SECTION_LABELS[activeSection]}</h2>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              · {sectionQs.length} question{sectionQs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col gap-2" style={{ maxWidth: 680 }}>
            {sectionQs.length === 0 && openCard !== 'new' && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <i className="fa-light fa-list-ul text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                <div>
                  <p className="text-sm font-medium">No questions yet</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Add your first question to the {SECTION_LABELS[activeSection]} section.
                  </p>
                </div>
              </div>
            )}

            {sectionQs.map((q, index) => (
              openCard === q.id ? (
                <ExpandCard
                  key={q.id}
                  text={cardText}
                  answerType={cardType}
                  likertPointer={t.likertPointer}
                  onTextChange={setCardText}
                  onTypeChange={setCardType}
                  onAdd={() => handleEditSave(q.id)}
                  onCancel={closeCard}
                  addLabel="Save"
                  title="Edit question"
                />
              ) : (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-start gap-0 rounded-lg border border-border bg-card overflow-hidden group"
                  style={{ cursor: 'grab' }}
                >
                  {/* Colored left strip — answer type indicator */}
                  <div
                    className="shrink-0"
                    style={{
                      width: 3,
                      alignSelf: 'stretch',
                      background: q.answerType === 'likert'
                        ? 'var(--brand-color)'
                        : 'var(--border)',
                    }}
                  />
                  {/* Drag handle */}
                  <div className="flex items-center px-2 pt-3 shrink-0 self-start">
                    <DragHandleGripIcon className="opacity-30 group-hover:opacity-60 text-muted-foreground transition-opacity" />
                  </div>
                  {/* Content */}
                  <div className="flex flex-col gap-2 flex-1 min-w-0 py-3 pr-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm leading-snug flex-1">{q.text}</span>
                      {/* Type badge — Aboard style, top-right */}
                      <Badge
                        variant="secondary"
                        className="rounded shrink-0"
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          paddingInline: 6,
                          paddingBlock: 2,
                          backgroundColor: q.answerType === 'likert'
                            ? 'var(--brand-tint)'
                            : 'var(--muted)',
                          color: q.answerType === 'likert'
                            ? 'var(--brand-color)'
                            : 'var(--muted-foreground)',
                        }}
                      >
                        {q.answerType === 'likert'
                          ? <><i className="fa-light fa-chart-bar" aria-hidden="true" style={{ marginRight: 4 }} />Likert {t.likertPointer}</>
                          : <><i className="fa-light fa-align-left" aria-hidden="true" style={{ marginRight: 4 }} />Free text</>
                        }
                      </Badge>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-start pt-2 pr-2 shrink-0">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Question actions"
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openEditCard(q)}>
                          <i className="fa-light fa-pen" aria-hidden="true" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => deleteQuestion(t.id, activeSection, q.id)}
                        >
                          <i className="fa-light fa-trash" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            ))}

            {openCard === 'new' && (
              <ExpandCard
                text={cardText}
                answerType={cardType}
                likertPointer={t.likertPointer}
                onTextChange={setCardText}
                onTypeChange={setCardType}
                onAdd={handleAdd}
                onCancel={closeCard}
                addLabel="Add"
                title="New question"
              />
            )}

            {openCard === null && (
              <button
                onClick={openAddCard}
                className="flex items-center gap-2 rounded-lg border border-dashed text-sm px-3 py-2.5 transition-colors hover:bg-muted"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add question
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

interface ExpandCardProps {
  text: string
  answerType: 'likert' | 'free_text'
  likertPointer: number
  addLabel: string
  title: string
  onTextChange: (v: string) => void
  onTypeChange: (v: 'likert' | 'free_text') => void
  onAdd: () => void
  onCancel: () => void
}

function ExpandCard({ text, answerType, likertPointer, addLabel, title, onTextChange, onTypeChange, onAdd, onCancel }: ExpandCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border-2 p-4"
      style={{ borderColor: 'var(--brand-color)', background: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--brand-color)' }}>{title}</p>
      <Textarea
        autoFocus
        placeholder="Type your question…"
        value={text}
        onChange={e => onTextChange(e.target.value)}
        rows={2}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onAdd()
          if (e.key === 'Escape') onCancel()
        }}
        style={{ resize: 'none' }}
      />
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Answer type</span>
        <div className="flex gap-1.5">
          <Button
            variant={answerType === 'likert' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('likert')}
          >
            Likert {likertPointer}
          </Button>
          <Button
            variant={answerType === 'free_text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('free_text')}
          >
            Free text
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="default" size="sm" disabled={!text.trim()} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </div>
  )
}
