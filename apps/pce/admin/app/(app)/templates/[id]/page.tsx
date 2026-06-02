'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Badge,
  Separator,
  Textarea,
  Input,
  LocalBanner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DragHandleGripIcon,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import type { TemplateQuestion, PceTemplateSection } from '@/lib/pce-mock-data'
import { SubjectPickerSheet } from '@/components/pce/subject-picker-sheet'
import { QuestionBankPickerDialog } from '@/components/pce/question-bank-picker-dialog'
import { PdfImportDialog } from '@/components/pce/pdf-import-dialog'

function answerTypeBadgeLabel(type: 'likert' | 'free_text') {
  return type === 'likert' ? 'Likert (5-point)' : 'Free-text'
}

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const {
    templates, updateTemplate,
    addTemplateSection, removeTemplateSection,
    addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
  } = usePce()

  const template = templates.find(t => t.id === id)

  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [closedSectionIds, setClosedSectionIds] = useState<Set<string>>(new Set())
  const [selectedQuestion, setSelectedQuestion] = useState<{ sectionId: string; questionId: string } | null>(null)
  const [metaOpen, setMetaOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [qbSectionId, setQbSectionId] = useState<string | null>(null)
  const [pdfSectionId, setPdfSectionId] = useState<string | null>(null)

  const questionDragInfo = useRef<{ sectionId: string; index: number } | null>(null)

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <i className="fa-light fa-circle-exclamation text-4xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Template not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/templates">Back to Templates</Link>
        </Button>
      </div>
    )
  }

  const t = template
  const sections = t.templateSections ?? []
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const canPublish = sections.length > 0 && totalQuestions > 0
  const existingSubjectKeys = sections.map(s => s.subjectKey)

  const selectedQ = selectedQuestion
    ? sections.find(s => s.id === selectedQuestion.sectionId)
        ?.questions.find(q => q.id === selectedQuestion.questionId) ?? null
    : null

  function toggleSection(sectionId: string) {
    setClosedSectionIds(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function handlePickerConfirm(subjectKey: string, title: string) {
    addTemplateSection(t.id, {
      subjectKey: subjectKey as PceTemplateSection['subjectKey'],
      title,
      questions: [],
    })
    setPickerOpen(false)
  }

  function handleAddQuestion(sectionId: string) {
    const newId = `q-${Date.now()}`
    addSectionQuestion(t.id, sectionId, '', 'likert', undefined, newId)
    setClosedSectionIds(prev => {
      const next = new Set(prev)
      next.delete(sectionId)
      return next
    })
    setSelectedQuestion({ sectionId, questionId: newId })
  }

  function updateSelectedQ(patch: Partial<Pick<TemplateQuestion, 'text' | 'answerType'>>) {
    if (!selectedQuestion) return
    updateSectionQuestion(t.id, selectedQuestion.sectionId, selectedQuestion.questionId, patch)
  }

  function handleMoveQuestion(sectionId: string, index: number, direction: 'up' | 'down') {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return
    const toIndex = direction === 'up' ? index - 1 : index + 1
    if (toIndex < 0 || toIndex >= section.questions.length) return
    reorderSectionQuestions(t.id, sectionId, index, toIndex)
  }

  function handleDuplicateQuestion(sectionId: string, q: TemplateQuestion) {
    const newId = `q-${Date.now()}`
    addSectionQuestion(t.id, sectionId, q.text, q.answerType === 'free_text' ? 'free_text' : 'likert', undefined, newId)
    setSelectedQuestion({ sectionId, questionId: newId })
  }

  function handleAddFromQB(sectionId: string) {
    setClosedSectionIds(prev => { const next = new Set(prev); next.delete(sectionId); return next })
    setQbSectionId(sectionId)
  }

  function handleAddFromPdf(sectionId: string) {
    setClosedSectionIds(prev => { const next = new Set(prev); next.delete(sectionId); return next })
    setPdfSectionId(sectionId)
  }

  function handleQBAdd(questions: Pick<TemplateQuestion, 'text' | 'answerType'>[]) {
    if (!qbSectionId) return
    let lastId = ''
    questions.forEach(q => {
      lastId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      addSectionQuestion(t.id, qbSectionId, q.text, q.answerType, undefined, lastId)
    })
    if (lastId) setSelectedQuestion({ sectionId: qbSectionId, questionId: lastId })
    setQbSectionId(null)
  }

  function handlePdfAdd(questions: Pick<TemplateQuestion, 'text' | 'answerType'>[]) {
    if (!pdfSectionId) return
    let lastId = ''
    questions.forEach(q => {
      lastId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      addSectionQuestion(t.id, pdfSectionId, q.text, q.answerType, undefined, lastId)
    })
    if (lastId) setSelectedQuestion({ sectionId: pdfSectionId, questionId: lastId })
    setPdfSectionId(null)
  }

  function handleDeleteQuestion(sectionId: string, questionId: string) {
    deleteSectionQuestion(t.id, sectionId, questionId)
    if (selectedQuestion?.questionId === questionId) setSelectedQuestion(null)
  }

  function handleQDragStart(sectionId: string, index: number) {
    questionDragInfo.current = { sectionId, index }
  }
  function handleQDragOver(e: React.DragEvent, sectionId: string, index: number) {
    e.preventDefault()
    const info = questionDragInfo.current
    if (!info || info.sectionId !== sectionId || info.index === index) return
    reorderSectionQuestions(t.id, sectionId, info.index, index)
    questionDragInfo.current = { sectionId, index }
  }
  function handleQDragEnd() { questionDragInfo.current = null }

  const headerActions = (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit template"
            className="shrink-0"
            onClick={() => { setEditName(t.name); setEditDesc(t.description ?? ''); setEditOpen(true) }}
          >
            <i className="fa-light fa-pen text-xs" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Edit name &amp; description</TooltipContent>
      </Tooltip>
      <Badge
        variant="secondary"
        className="rounded shrink-0"
        style={t.status === 'active'
          ? { backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }
          : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
        }
      >
        {t.status === 'active' ? 'Active' : 'Draft'}
      </Badge>
      <span className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0"
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
      >
        Save draft
      </Button>
      {t.status === 'active' ? (
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => updateTemplate(t.id, { status: 'draft' })}>
          Unpublish
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0">
              <Button
                variant="default"
                size="sm"
                disabled={!canPublish}
                onClick={() => updateTemplate(t.id, { status: 'active' })}
                style={!canPublish ? { pointerEvents: 'none' } : undefined}
              >
                <i className="fa-light fa-circle-check" aria-hidden="true" style={{ fontSize: 12 }} />
                Publish
              </Button>
            </span>
          </TooltipTrigger>
          {!canPublish && (
            <TooltipContent>Add at least one section with a question to publish</TooltipContent>
          )}
        </Tooltip>
      )}
    </>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">{/* overflow-hidden safe — floating uses Radix Portal */}

      <SiteHeader
        breadcrumbs={[{ label: 'Templates', href: '/templates' }]}
        title={t.name}
        actions={headerActions}
      />
      <h1 className="sr-only">{t.name}</h1>

      {saved && (
        <div style={{ paddingInline: 24, paddingTop: 10 }}>
          <LocalBanner variant="success" dismissible onDismiss={() => setSaved(false)}>
            Draft saved.
          </LocalBanner>
        </div>
      )}

      {/* ── Builder body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sections accordion */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>

          {sections.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <i className="fa-light fa-rectangle-list text-4xl text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No sections yet</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 260 }}>
                Add a section to define who or what is being evaluated.
              </p>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                Add section
              </Button>
            </div>
          ) : (
            <>
              {sections.map(sec => {
                const isOpen = !closedSectionIds.has(sec.id)
                return (
                  <div key={sec.id} className="rounded-xl border border-border mb-4 overflow-hidden">

                    {/* Section header */}
                    <div
                      className="flex items-center gap-2 px-3 py-2.5"
                      style={{ borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={isOpen ? `Collapse ${sec.title}` : `Expand ${sec.title}`}
                        onClick={() => toggleSection(sec.id)}
                      >
                        <i className={`fa-light fa-chevron-${isOpen ? 'down' : 'right'} text-xs`} aria-hidden="true" />
                      </Button>
                      <span className="text-sm font-semibold flex-1 min-w-0 truncate">{sec.title}</span>
                      <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                        {sec.questions.length} question{sec.questions.length !== 1 ? 's' : ''}
                      </span>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Section actions">
                            <i className="fa-regular fa-ellipsis text-xs" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={sec.questions.length > 0}
                            onClick={() => {
                              if (sec.questions.length > 0) return
                              removeTemplateSection(t.id, sec.id)
                              if (selectedQuestion?.sectionId === sec.id) setSelectedQuestion(null)
                            }}
                          >
                            <i className="fa-light fa-trash" aria-hidden="true" /> Remove section
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Section body */}
                    {isOpen && (
                      <div>
                        {sec.questions.length === 0 && (
                          <div className="px-4 py-4 flex flex-col gap-1.5">
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                              Add your first question
                            </p>
                            <AddQuestionMethod
                              icon="fa-pen-line"
                              label="Write question manually"
                              description="Type a new question from scratch"
                              onClick={() => handleAddQuestion(sec.id)}
                            />
                            <AddQuestionMethod
                              icon="fa-database"
                              label="Add from templates"
                              description="Reuse questions from an existing template"
                              onClick={() => handleAddFromQB(sec.id)}
                            />
                            <AddQuestionMethod
                              icon="fa-file-pdf"
                              label="Import from PDF"
                              description="Extract questions from a document"
                              onClick={() => handleAddFromPdf(sec.id)}
                            />
                          </div>
                        )}
                        {sec.questions.map((q, qIndex) => {
                          const isSelected =
                            selectedQuestion?.questionId === q.id &&
                            selectedQuestion?.sectionId === sec.id
                          return (
                            <div
                              key={q.id}
                              role="button"
                              tabIndex={0}
                              draggable
                              className="flex items-start gap-3 group cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                              style={{
                                padding: '10px 16px',
                                paddingLeft: isSelected ? 14 : 16,
                                borderBottom: '1px solid var(--border)',
                                background: isSelected ? 'var(--muted)' : 'transparent',
                                borderLeft: isSelected
                                  ? '2px solid var(--brand-color)'
                                  : '2px solid transparent',
                              }}
                              onClick={() => setSelectedQuestion({ sectionId: sec.id, questionId: q.id })}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedQuestion({ sectionId: sec.id, questionId: q.id }) } }}
                              onDragStart={() => handleQDragStart(sec.id, qIndex)}
                              onDragOver={e => handleQDragOver(e, sec.id, qIndex)}
                              onDragEnd={handleQDragEnd}
                            >
                              <div
                                style={{ cursor: 'grab' }}
                                className="shrink-0 opacity-0 group-hover:opacity-40 text-muted-foreground transition-opacity mt-0.5"
                              >
                                <DragHandleGripIcon />
                              </div>
                              <span
                                className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground mt-0.5"
                                style={{ width: 16, textAlign: 'right' }}
                              >
                                {qIndex + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium leading-snug">
                                  {q.text || (
                                    <span style={{ color: 'var(--muted-foreground)' }}>Untitled question</span>
                                  )}
                                </span>
                                <span
                                  className="inline-block text-xs px-2 py-0.5 rounded-md ml-2 align-middle"
                                  style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                                >
                                  {answerTypeBadgeLabel(q.answerType === 'free_text' ? 'free_text' : 'likert')}
                                </span>
                              </div>
                              {isSelected && (
                                <div
                                  className="flex items-center gap-0.5 shrink-0"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost" size="icon-sm" aria-label="Move up"
                                    disabled={qIndex === 0}
                                    onClick={() => handleMoveQuestion(sec.id, qIndex, 'up')}
                                  >
                                    <i className="fa-light fa-arrow-up text-xs" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon-sm" aria-label="Move down"
                                    disabled={qIndex === sec.questions.length - 1}
                                    onClick={() => handleMoveQuestion(sec.id, qIndex, 'down')}
                                  >
                                    <i className="fa-light fa-arrow-down text-xs" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon-sm" aria-label="Duplicate question"
                                    onClick={() => handleDuplicateQuestion(sec.id, q)}
                                  >
                                    <i className="fa-light fa-copy text-xs" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon-sm" aria-label="Delete question"
                                    onClick={() => handleDeleteQuestion(sec.id, q.id)}
                                  >
                                    <i className="fa-light fa-trash text-xs" aria-hidden="true"
                                       style={{ color: 'var(--destructive)' }} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <div
                          className="flex items-center gap-1 flex-wrap"
                          style={{ padding: '6px 12px', borderTop: '1px solid var(--border)' }}
                        >
                          <Button
                            variant="ghost" size="sm" className="text-muted-foreground"
                            onClick={() => handleAddQuestion(sec.id)}
                          >
                            <i className="fa-light fa-pen-line text-xs" aria-hidden="true" />
                            Write question
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="text-muted-foreground"
                            onClick={() => handleAddFromQB(sec.id)}
                          >
                            <i className="fa-light fa-database text-xs" aria-hidden="true" />
                            Templates
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="text-muted-foreground"
                            onClick={() => handleAddFromPdf(sec.id)}
                          >
                            <i className="fa-light fa-file-pdf text-xs" aria-hidden="true" />
                            Import PDF
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <Button
                variant="ghost" size="sm" className="text-muted-foreground"
                onClick={() => setPickerOpen(true)}
              >
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add section
              </Button>
            </>
          )}
        </main>

        {/* Attributes panel */}
        <aside
          className="flex flex-col shrink-0"
          style={{ width: 280, borderLeft: '1px solid var(--border)', background: 'var(--background)' }}
        >
          {!selectedQ ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center px-6">
              <i className="fa-light fa-sliders text-2xl" aria-hidden="true"
                 style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                Select a question to adjust its properties.
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex items-center justify-between shrink-0 px-4"
                style={{ borderBottom: '1px solid var(--border)', height: 40 }}
              >
                <span className="text-sm font-medium">Field Details</span>
                <Button
                  variant="ghost" size="icon-sm" aria-label="Close attributes panel"
                  onClick={() => setSelectedQuestion(null)}
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                <div>
                  <label htmlFor="q-type-select" className="text-xs font-medium mb-1.5 block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    Question type
                  </label>
                  <Select
                    value={selectedQ.answerType === 'free_text' ? 'free_text' : 'likert'}
                    onValueChange={val => updateSelectedQ({ answerType: val as 'likert' | 'free_text' })}
                  >
                    <SelectTrigger id="q-type-select" className="h-8 text-sm w-full" aria-label="Question type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="likert">Likert (5-point)</SelectItem>
                      <SelectItem value="free_text">Free-text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="q-text-area" className="text-xs font-medium mb-1.5 block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    Question
                  </label>
                  <Textarea
                    id="q-text-area"
                    value={selectedQ.text}
                    onChange={e => updateSelectedQ({ text: e.target.value })}
                    placeholder="Type your question…"
                    rows={4}
                    style={{ resize: 'none' }}
                    className="text-sm"
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost" size="sm"
                        className="w-full justify-between px-0 hover:bg-transparent"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        <span className="text-xs font-medium">Meta Information</span>
                        <i className={`fa-light fa-chevron-${metaOpen ? 'up' : 'down'} text-xs`} aria-hidden="true" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <div>
                        <label htmlFor="q-report-title" className="text-xs font-medium mb-1.5 block"
                               style={{ color: 'var(--muted-foreground)' }}>
                          Report title
                        </label>
                        <Input id="q-report-title" className="h-8 text-sm" placeholder="Same as question text" />
                      </div>
                      <div>
                        <label htmlFor="q-help-text" className="text-xs font-medium mb-1.5 block"
                               style={{ color: 'var(--muted-foreground)' }}>
                          Help text
                        </label>
                        <Textarea
                          id="q-help-text" rows={2} className="text-sm"
                          placeholder="Optional helper text shown to evaluators"
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <SubjectPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingSubjectKeys={existingSubjectKeys}
        onConfirm={handlePickerConfirm}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <label htmlFor="edit-template-name" className="text-xs font-medium mb-1.5 block"
                     style={{ color: 'var(--muted-foreground)' }}>
                Name
              </label>
              <Input
                id="edit-template-name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Template name"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-template-desc" className="text-xs font-medium mb-1.5 block"
                     style={{ color: 'var(--muted-foreground)' }}>
                Description
              </label>
              <Textarea
                id="edit-template-desc"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Optional description"
                rows={3}
                className="text-sm"
                style={{ resize: 'none' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              variant="default"
              size="sm"
              disabled={!editName.trim()}
              onClick={() => {
                updateTemplate(t.id, { name: editName.trim() || 'Untitled template', description: editDesc.trim() || undefined })
                setEditOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuestionBankPickerDialog
        open={!!qbSectionId}
        onOpenChange={v => { if (!v) setQbSectionId(null) }}
        onAddQuestions={handleQBAdd}
      />
      <PdfImportDialog
        open={!!pdfSectionId}
        onOpenChange={v => { if (!v) setPdfSectionId(null) }}
        onAddQuestions={handlePdfAdd}
      />
    </div>
  )
}

function AddQuestionMethod({
  icon,
  label,
  description,
  onClick,
}: {
  icon: string
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto w-full justify-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted"
      onClick={onClick}
    >
      <i className={`fa-light ${icon} text-base shrink-0`} aria-hidden="true"
         style={{ color: 'var(--muted-foreground)', width: 20, textAlign: 'center' }} />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium leading-tight" style={{ color: 'var(--foreground)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
      </div>
      <i className="fa-light fa-arrow-right text-xs shrink-0" aria-hidden="true"
         style={{ color: 'var(--muted-foreground)' }} />
    </Button>
  )
}
