'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Badge,
  Separator,
  Textarea,
  LocalBanner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DragHandleGripIcon,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import type { TemplateQuestion, PceTemplateSection } from '@/lib/pce-mock-data'
import { SubjectPickerSheet } from '@/components/pce/subject-picker-sheet'

function answerTypeBadgeLabel(type: 'likert' | 'free_text', likertPointer: number) {
  return type === 'likert' ? `Likert ${likertPointer}` : 'Free-text'
}

// Inline expand card used for both "Add question" and "Edit question"
function QuestionExpandCard({
  initialText = '',
  initialType = 'likert' as 'likert' | 'free_text',
  onSave,
  onCancel,
}: {
  initialText?: string
  initialType?: 'likert' | 'free_text'
  onSave: (text: string, type: 'likert' | 'free_text') => void
  onCancel: () => void
}) {
  const [text, setText] = useState(initialText)
  const [type, setType] = useState<'likert' | 'free_text'>(initialType)

  return (
    <div
      style={{
        border: '1.5px solid var(--brand-color)',
        borderRadius: 'var(--radius)',
        padding: 16,
        background: 'var(--background)',
        margin: '4px 0 8px',
      }}
    >
      <Textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your question…"
        rows={3}
        style={{ resize: 'none' }}
        className="text-sm border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent"
      />
      <div className="flex items-center justify-between mt-3">
        {/* Answer type toggle */}
        <div
          className="flex items-center rounded-md overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {(['likert', 'free_text'] as const).map(t => (
            <button
              key={t}
              type="button"
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: type === t ? 'var(--foreground)' : 'transparent',
                color: type === t ? 'var(--background)' : 'var(--muted-foreground)',
              }}
              onClick={() => setType(t)}
            >
              {t === 'likert' ? 'Likert' : 'Free text'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!text.trim()}
            onClick={() => { if (text.trim()) onSave(text.trim(), type) }}
          >
            {initialText ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ======

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const {
    templates, updateTemplate,
    addTemplateSection, removeTemplateSection, reorderTemplateSections,
    updateTemplateSection,
    addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
  } = usePce()

  const template = templates.find(t => t.id === id)

  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [expandedAdd, setExpandedAdd] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

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

  const activeSectionIdResolved = activeSectionId ?? sections[0]?.id ?? null
  const activeSection = sections.find(s => s.id === activeSectionIdResolved) ?? null

  function switchSection(sectionId: string) {
    setActiveSectionId(sectionId)
    setExpandedAdd(false)
    setEditingQuestionId(null)
  }

  function handlePickerConfirm(subjectKey: string, title: string) {
    addTemplateSection(t.id, {
      subjectKey: subjectKey as PceTemplateSection['subjectKey'],
      title,
      questions: [],
    })
    setPickerOpen(false)
    // Auto-select newly added section (it will be last)
    // Delay one tick so state has propagated
    setTimeout(() => {
      const updated = templates.find(tmpl => tmpl.id === id)
      const last = updated?.templateSections?.at(-1)
      if (last) switchSection(last.id)
    }, 0)
  }

  function handleAddQuestion(text: string, type: 'likert' | 'free_text') {
    if (!activeSection) return
    const newId = `q-${Date.now()}`
    addSectionQuestion(t.id, activeSection.id, text, type, undefined, newId)
    setExpandedAdd(false)
  }

  function handleSaveQuestion(text: string, type: 'likert' | 'free_text') {
    if (!activeSection || !editingQuestionId) return
    updateSectionQuestion(t.id, activeSection.id, editingQuestionId, { text, answerType: type })
    setEditingQuestionId(null)
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

      {/* ── SiteHeader ── */}
      <SiteHeader title={t.name} />

      {/* ── Editor header bar ── */}
      <div
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '12px 24px' }}
      >
        <Link href="/templates" className="text-sm shrink-0" style={{ color: 'var(--muted-foreground)' }}>
          Templates
        </Link>
        <i className="fa-light fa-chevron-right text-xs shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <input
          className="text-sm font-semibold flex-1 min-w-0 bg-transparent outline-none truncate"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}
          value={t.name}
          aria-label="Template name"
          onChange={e => updateTemplate(t.id, { name: e.target.value })}
          onBlur={e => {
            const trimmed = e.target.value.trim()
            if (!trimmed) updateTemplate(t.id, { name: 'Untitled template' })
          }}
        />
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
        <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
          {sections.length} section{sections.length !== 1 ? 's' : ''} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
        </span>
        <Separator orientation="vertical" className="h-4" />
        <Button
          variant="ghost"
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
      </div>

      {/* ── Description ── */}
      <div className="border-b border-border shrink-0" style={{ paddingInline: 24, paddingBlock: 8 }}>
        <input
          type="text"
          value={t.description ?? ''}
          onChange={e => updateTemplate(t.id, { description: e.target.value })}
          placeholder="Add a description…"
          aria-label="Template description"
          className="w-full text-sm bg-transparent outline-none"
          style={{ color: 'var(--muted-foreground)' }}
        />
      </div>

      {saved && (
        <div style={{ paddingInline: 24, paddingTop: 10 }}>
          <LocalBanner variant="success" dismissible onDismiss={() => setSaved(false)}>
            Draft saved.
          </LocalBanner>
        </div>
      )}

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: section navigator */}
        <aside
          className="flex flex-col border-r border-border shrink-0"
          style={{ width: 168, background: 'var(--sidebar)' }}
        >
          <div className="flex-1 overflow-y-auto py-1">
            {sections.length === 0 ? (
              <p
                className="text-xs px-3 py-3"
                style={{ color: 'var(--muted-foreground)' }}
              >
                No sections yet.
              </p>
            ) : (
              sections.map(sec => {
                const isActive = sec.id === activeSectionIdResolved
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className="w-full flex items-center justify-between gap-1 text-left transition-colors"
                    style={{
                      padding: '8px 12px',
                      background: isActive ? 'var(--background)' : 'transparent',
                      color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onClick={() => switchSection(sec.id)}
                  >
                    <span className="text-sm flex-1 min-w-0 leading-snug truncate">{sec.title}</span>
                    <span
                      className="tabular-nums text-xs shrink-0"
                      style={{ color: isActive ? 'var(--muted-foreground)' : 'var(--muted-foreground)' }}
                    >
                      {sec.questions.length}
                    </span>
                  </button>
                )
              })
            )}
          </div>
          <div className="shrink-0 border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => setPickerOpen(true)}
            >
              <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
              Add section
            </Button>
          </div>
        </aside>

        {/* Main: question list */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>

          {sections.length === 0 ? (
            /* Empty state — no sections yet */
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
          ) : !activeSection ? null : (
            <>
              {/* Section heading */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {activeSection.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {activeSection.questions.length} question{activeSection.questions.length !== 1 ? 's' : ''}
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
                        disabled={activeSection.questions.length > 0}
                        onClick={() => {
                          if (activeSection.questions.length > 0) return
                          removeTemplateSection(t.id, activeSection.id)
                          setActiveSectionId(null)
                        }}
                      >
                        <i className="fa-light fa-trash" aria-hidden="true" /> Remove section
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Questions */}
              {activeSection.questions.length === 0 && !expandedAdd ? (
                <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>
                  No questions yet — add one below.
                </p>
              ) : (
                activeSection.questions.map((q, qIndex) => {
                  if (editingQuestionId === q.id) {
                    return (
                      <QuestionExpandCard
                        key={q.id}
                        initialText={q.text}
                        initialType={(q.answerType === 'likert' || q.answerType === 'free_text') ? q.answerType : 'likert'}
                        onSave={handleSaveQuestion}
                        onCancel={() => setEditingQuestionId(null)}
                      />
                    )
                  }

                  return (
                    <div
                      key={q.id}
                      draggable
                      className="flex gap-3 group"
                      style={{ borderBottom: '1px solid var(--border)', paddingBlock: 12 }}
                      onDragStart={() => handleQDragStart(activeSection.id, qIndex)}
                      onDragOver={e => handleQDragOver(e, activeSection.id, qIndex)}
                      onDragEnd={handleQDragEnd}
                    >
                      <div style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }} className="shrink-0 opacity-0 group-hover:opacity-40 text-muted-foreground transition-opacity mt-0.5">
                        <DragHandleGripIcon />
                      </div>
                      <span
                        className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground mt-0.5"
                        style={{ width: 16, textAlign: 'right' }}
                      >
                        {qIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-medium leading-snug">
                            {q.text || <span style={{ color: 'var(--muted-foreground)' }}>Untitled question</span>}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                            >
                              {answerTypeBadgeLabel(
                                (q.answerType === 'likert' || q.answerType === 'free_text') ? q.answerType : 'likert',
                                t.likertPointer,
                              )}
                            </span>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Question actions"
                                  onClick={e => e.stopPropagation()}
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                  <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingQuestionId(q.id)
                                    setExpandedAdd(false)
                                  }}
                                >
                                  <i className="fa-light fa-pen" aria-hidden="true" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    deleteSectionQuestion(t.id, activeSection.id, q.id)
                                    if (editingQuestionId === q.id) setEditingQuestionId(null)
                                  }}
                                >
                                  <i className="fa-light fa-trash" aria-hidden="true" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Add question — expand card or button */}
              {expandedAdd ? (
                <QuestionExpandCard
                  onSave={handleAddQuestion}
                  onCancel={() => setExpandedAdd(false)}
                />
              ) : (
                <div className="pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      setExpandedAdd(true)
                      setEditingQuestionId(null)
                    }}
                  >
                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                    Add question
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <SubjectPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingSubjectKeys={existingSubjectKeys}
        onConfirm={handlePickerConfirm}
      />
    </div>
  )
}
