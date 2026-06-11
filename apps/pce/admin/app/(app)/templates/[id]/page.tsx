'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Badge,
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
  ToggleSwitch,
  Field,
  FieldLabel,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import type { TemplateQuestion, CourseTypeFilter } from '@/lib/pce-mock-data'

const COURSE_TYPE_OPTIONS: { value: CourseTypeFilter; label: string }[] = [
  { value: 'didactic', label: 'Didactic' },
  { value: 'clinical', label: 'Clinical' },
]

type AnswerType = TemplateQuestion['answerType']

const Q_TYPE_OPTIONS: { value: AnswerType; label: string; icon: string }[] = [
  { value: 'single_choice',   label: 'Single Choice Question',   icon: 'fa-circle-dot' },
  { value: 'multiple_choice', label: 'Multiple Choice Question', icon: 'fa-square-check' },
  { value: 'free_text',       label: 'Short/Long Answer Question', icon: 'fa-align-left' },
  { value: 'title',           label: 'Title',                    icon: 'fa-heading' },
  { value: 'number',          label: 'Number',                   icon: 'fa-hashtag' },
  { value: 'select_dropdown', label: 'Select from dropdown',     icon: 'fa-chevron-down' },
  { value: 'date_picker',     label: 'Date picker',              icon: 'fa-calendar' },
]

function qTypeLabel(type: AnswerType): string {
  return Q_TYPE_OPTIONS.find(o => o.value === type)?.label
    ?? (type === 'likert' ? 'Likert (5-point)' : type)
}

function hasChoices(type: AnswerType) {
  return type === 'single_choice' || type === 'multiple_choice' || type === 'select_dropdown'
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
  const [closedSectionIds, setClosedSectionIds] = useState<Set<string>>(new Set())
  const [selectedQuestion, setSelectedQuestion] = useState<{ sectionId: string; questionId: string } | null>(null)
  const [metaOpen, setMetaOpen] = useState(false)

  // Per-question local UI state (not persisted to data model)
  const [naToggles, setNaToggles] = useState<Record<string, boolean>>({})
  const [commentToggles, setCommentToggles] = useState<Record<string, boolean>>({})
  const [optionInputs, setOptionInputs] = useState<Record<string, string[]>>({})

  const questionDragInfo = useRef<{ sectionId: string; index: number } | null>(null)

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center" style={{ minHeight: 240 }}>
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

  function handleAddSection() {
    addTemplateSection(t.id, {
      subjectKey: 'course_content',
      title: 'Untitled Section',
      questions: [],
    })
  }

  function handleAddQuestion(sectionId: string, type: AnswerType) {
    const newId = `q-${Date.now()}`
    addSectionQuestion(t.id, sectionId, '', type, undefined, newId)
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
    addSectionQuestion(t.id, sectionId, q.text, q.answerType, q.choices, newId)
    setSelectedQuestion({ sectionId, questionId: newId })
  }

  function handleDeleteQuestion(sectionId: string, questionId: string) {
    deleteSectionQuestion(t.id, sectionId, questionId)
    if (selectedQuestion?.questionId === questionId) setSelectedQuestion(null)
  }

  function handleAddOption(questionId: string) {
    setOptionInputs(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), ''],
    }))
  }

  function handleOptionChange(questionId: string, idx: number, val: string) {
    setOptionInputs(prev => {
      const arr = [...(prev[questionId] ?? [])]
      arr[idx] = val
      return { ...prev, [questionId]: arr }
    })
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: 'Templates', href: '/templates' }]}
        title={t.name}
      />
      <h1 className="sr-only">{t.name}</h1>

      {saved && (
        <div style={{ paddingInline: 24, paddingTop: 10 }}>
          <LocalBanner variant="success" dismissible onDismiss={() => setSaved(false)}>
            Draft saved.
          </LocalBanner>
        </div>
      )}

      {/* Title row — heading + badge left, actions right-flush to match Ask Leo (pe-2 outer + pe-2 inner = 16px) */}
      <div style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 28 }}>
        <div className="flex items-center gap-3 mb-5">
          <p
            className="min-w-0 truncate"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 32,
              fontWeight: 300,
              color: 'var(--foreground)',
              lineHeight: 1.2,
            }}
          >
            {t.name || 'Untitled template'}
          </p>
          <Badge variant={t.status === 'active' ? 'default' : 'outline'} className="shrink-0">
            {t.status === 'active' ? 'Active' : 'Draft'}
          </Badge>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
            >
              Save draft
            </Button>
            {t.status === 'active' ? (
              <Button variant="outline" size="sm" onClick={() => updateTemplate(t.id, { status: 'draft' })}>
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
                      onClick={() => updateTemplate(t.id, { status: 'active' })}
                    >
                      Publish
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canPublish && (
                  <TooltipContent>Add at least one section with a question to publish</TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue={sections.length > 0 ? 'builder' : 'details'} className="flex flex-col flex-1 min-h-0">
        <div style={{ paddingInline: 40, borderBottom: '1px solid var(--border)' }}>
          <TabsList variant="line">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Builder tab ── */}
        <TabsContent value="builder" className="flex-1 overflow-y-auto m-0" style={{ padding: '32px 40px' }}>
          <div style={{ maxWidth: 720 }}>

          {sections.length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
              <Button
                variant="link"
                size="sm"
                onClick={handleAddSection}
                className="font-semibold text-[var(--brand-color)]"
              >
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add new section
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sections.map(sec => {
                const isOpen = !closedSectionIds.has(sec.id)
                return (
                  <div
                    key={sec.id}
                    className="border border-border overflow-hidden"
                    style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)' }}
                  >
                    {/* Section header — muted background strip */}
                    <div
                      className="flex items-center gap-2"
                      style={{
                        background: 'var(--muted)',
                        padding: '10px 14px',
                        borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={isOpen ? `Collapse ${sec.title}` : `Expand ${sec.title}`}
                        onClick={() => toggleSection(sec.id)}
                        className="shrink-0"
                      >
                        <i
                          className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'} text-xs`}
                          aria-hidden="true"
                        />
                      </Button>
                      <span className="text-sm font-bold flex-1 min-w-0 truncate">{sec.title}</span>
                      <span
                        className="text-xs tabular-nums shrink-0"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {sec.questions.length} question{sec.questions.length !== 1 ? 's' : ''}
                      </span>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Section actions">
                            <i className="fa-regular fa-ellipsis text-xs" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
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
                      <div className="flex flex-col">
                        {/* Question cards */}
                        {sec.questions.map((q, qIndex) => {
                          const isSelected =
                            selectedQuestion?.questionId === q.id &&
                            selectedQuestion?.sectionId === sec.id
                          return (
                            <div
                              key={q.id}
                              draggable
                              onDragStart={() => handleQDragStart(sec.id, qIndex)}
                              onDragOver={e => handleQDragOver(e, sec.id, qIndex)}
                              onDragEnd={handleQDragEnd}
                              style={{
                                borderBottom: '1px solid var(--border)',
                                background: isSelected ? 'var(--muted)' : 'transparent',
                              }}
                            >
                              <div
                                className="flex items-start gap-2"
                                style={{ padding: '10px 14px' }}
                              >
                                {/* Question text */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 min-w-0 justify-start text-sm font-medium text-left h-auto p-0 hover:bg-transparent"
                                  onClick={() => setSelectedQuestion({ sectionId: sec.id, questionId: q.id })}
                                >
                                  {q.text || (
                                    <span style={{ color: 'var(--muted-foreground)' }}>
                                      Untitled Question
                                    </span>
                                  )}
                                </Button>

                                {/* Type label + toolbar */}
                                <div className="flex items-center gap-0.5 shrink-0 ml-1">
                                  <span
                                    className="text-xs mr-1 shrink-0"
                                    style={{ color: 'var(--muted-foreground)' }}
                                  >
                                    {qTypeLabel(q.answerType)}
                                  </span>
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
                                    <i
                                      className="fa-light fa-trash text-xs"
                                      aria-hidden="true"
                                      style={{ color: 'var(--destructive)' }}
                                    />
                                  </Button>
                                  <div
                                    style={{ cursor: 'grab' }}
                                    className="shrink-0 text-muted-foreground flex items-center"
                                  >
                                    <DragHandleGripIcon />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}

                        {/* Add question — centered solid button */}
                        <div
                          className="flex items-center justify-center"
                          style={{ padding: '20px 14px' }}
                        >
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="default" size="sm">
                                <i className="fa-light fa-plus" aria-hidden="true"  />
                                Add question
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-56">
                              {Q_TYPE_OPTIONS.map(opt => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onClick={() => handleAddQuestion(sec.id, opt.value)}
                                >
                                  <i
                                    className={`fa-light ${opt.icon} shrink-0`}
                                    aria-hidden="true"
                                    style={{ width: 16, textAlign: 'center', color: 'var(--muted-foreground)' }}
                                  />
                                  {opt.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add section link below */}
              <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleAddSection}
                  className="font-semibold text-[var(--brand-color)]"
                >
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                  Add new section
                </Button>
              </div>
            </div>
          )}
          </div>
        </TabsContent>

        {/* ── Details tab ── */}
        <TabsContent value="details" className="flex-1 overflow-y-auto m-0" style={{ padding: '32px 40px' }}>
          <div style={{ maxWidth: 560 }} className="space-y-5">

            {/* Title */}
            <Field orientation="vertical">
              <FieldLabel htmlFor="tmpl-name">Title</FieldLabel>
              <Input
                id="tmpl-name"
                key={t.id}
                defaultValue={t.name}
                onBlur={e => {
                  const v = e.currentTarget.value.trim()
                  if (v && v !== t.name) updateTemplate(t.id, { name: v })
                  else if (!v) e.currentTarget.value = t.name
                }}
                placeholder="Untitled template"
                className="h-9 text-sm"
              />
            </Field>

            {/* Description */}
            <Field orientation="vertical">
              <FieldLabel htmlFor="tmpl-desc">Description</FieldLabel>
              <Textarea
                id="tmpl-desc"
                key={t.id}
                defaultValue={t.description ?? ''}
                onBlur={e => {
                  const v = e.currentTarget.value.trim()
                  if (v !== (t.description ?? '')) updateTemplate(t.id, { description: v || undefined })
                }}
                placeholder="What is this template for?"
                rows={3}
                className="text-sm"
                style={{ resize: 'none' }}
              />
            </Field>

            {/* Course type */}
            <div>
              <p className="text-sm font-medium mb-2">Course type</p>
              <div className="flex flex-col gap-1" role="radiogroup" aria-label="Course type">
                {COURSE_TYPE_OPTIONS.map(opt => {
                  const active = t.courseType === opt.value
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      role="radio"
                      aria-checked={active}
                      className="flex items-center gap-3 justify-start rounded-lg text-left h-auto w-full"
                      style={{
                        padding: '7px 10px',
                        background: active ? 'var(--muted)' : 'transparent',
                      }}
                      onClick={() => updateTemplate(t.id, { courseType: opt.value })}
                    >
                      <div
                        className="shrink-0 rounded-full border-2 flex items-center justify-center"
                        style={{
                          width: 16, height: 16,
                          borderColor: active ? 'var(--foreground)' : 'var(--border)',
                        }}
                      >
                        {active && (
                          <div
                            className="rounded-full"
                            style={{ width: 7, height: 7, background: 'var(--foreground)' }}
                          />
                        )}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Opening instructions */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">Opening instructions</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Shown before the first question. Optional.
                </p>
              </div>
              <div>
                <label
                  htmlFor="tmpl-instr-title"
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Instruction title
                </label>
                <Input
                  id="tmpl-instr-title"
                  key={`${t.id}-instr-title`}
                  defaultValue={t.formInstructionTitle ?? ''}
                  onBlur={e => {
                    const v = e.currentTarget.value.trim()
                    if (v !== (t.formInstructionTitle ?? '')) updateTemplate(t.id, { formInstructionTitle: v || undefined })
                  }}
                  placeholder="e.g. Before you begin"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="tmpl-instr-desc"
                  className="text-xs font-medium block mb-1.5"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Instruction text
                </label>
                <Textarea
                  id="tmpl-instr-desc"
                  key={`${t.id}-instr-desc`}
                  defaultValue={t.formInstructionDescription ?? ''}
                  onBlur={e => {
                    const v = e.currentTarget.value.trim()
                    if (v !== (t.formInstructionDescription ?? '')) updateTemplate(t.id, { formInstructionDescription: v || undefined })
                  }}
                  placeholder="Instructions shown to respondents before the first question…"
                  rows={4}
                  className="text-sm"
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>

      {/* Field Details sheet — opens when a question is selected in the builder */}
      <Sheet open={selectedQuestion !== null} onOpenChange={open => { if (!open) setSelectedQuestion(null) }}>
        <SheetContent side="right" style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <SheetHeader style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
            <SheetTitle>Field Details</SheetTitle>
          </SheetHeader>
          {selectedQ && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Question type */}
              <div>
                <label
                  htmlFor="q-type-select"
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Question Type
                </label>
                <Select
                  value={selectedQ.answerType}
                  onValueChange={val => updateSelectedQ({ answerType: val as AnswerType })}
                >
                  <SelectTrigger id="q-type-select" className="h-8 text-sm w-full" aria-label="Question type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Q_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <i
                            className={`fa-light ${opt.icon} shrink-0`}
                            aria-hidden="true"
                            style={{ width: 14, textAlign: 'center', color: 'var(--muted-foreground)' }}
                          />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question text */}
              <div>
                <label
                  htmlFor="q-text-area"
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Question
                </label>
                <Textarea
                  id="q-text-area"
                  value={selectedQ.text}
                  onChange={e => updateSelectedQ({ text: e.target.value })}
                  placeholder="Type your question…"
                  rows={3}
                  style={{ resize: 'none' }}
                  className="text-sm"
                />
              </div>

              {/* Meta Information */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost" size="sm"
                      className="w-full justify-between px-0 hover:bg-transparent"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <span className="text-xs font-medium">Meta Information</span>
                      <i
                        className={`fa-light fa-chevron-${metaOpen ? 'up' : 'down'} text-xs`}
                        aria-hidden="true"
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    <div>
                      <label
                        htmlFor="q-help-text"
                        className="text-xs font-medium mb-1.5 block"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        Help Information
                      </label>
                      <Textarea
                        id="q-help-text"
                        rows={2}
                        className="text-sm"
                        placeholder="Optional helper text shown to respondents"
                        style={{ resize: 'none' }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="q-report-title"
                        className="text-xs font-medium mb-1.5 block"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        Report Title
                      </label>
                      <Input id="q-report-title" className="h-8 text-sm" placeholder="Same as question text" />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Answer choices */}
              {hasChoices(selectedQ.answerType) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <p
                    className="text-xs font-medium mb-2"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Answer Choices
                  </p>
                  <div className="flex flex-col gap-1.5 mb-2">
                    {(optionInputs[selectedQ.id] ?? []).map((opt, idx) => (
                      <Input
                        key={idx}
                        value={opt}
                        onChange={e => handleOptionChange(selectedQ.id, idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="h-8 text-sm"
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddOption(selectedQ.id)}
                  >
                    <i className="fa-light fa-plus" aria-hidden="true"  />
                    Add options
                  </Button>
                </div>
              )}

              {/* Toggles */}
              <div
                className="flex flex-col gap-3"
                style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <label
                    className="text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Include Not Applicable Option
                  </label>
                  <ToggleSwitch
                    checked={naToggles[selectedQ.id] ?? false}
                    onChange={() =>
                      setNaToggles(prev => ({
                        ...prev,
                        [selectedQ.id]: !prev[selectedQ.id],
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    className="text-xs font-medium"
                    style={{ color: 'var(--foreground)' }}
                  >
                    Comments
                  </label>
                  <ToggleSwitch
                    checked={commentToggles[selectedQ.id] ?? false}
                    onChange={() =>
                      setCommentToggles(prev => ({
                        ...prev,
                        [selectedQ.id]: !prev[selectedQ.id],
                      }))
                    }
                  />
                </div>
              </div>

            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}
