'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Badge,
  Separator,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Textarea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { MOCK_SUBJECTS } from '@/lib/pce-mock-data'
import type { TemplateQuestion, PceTemplateSection } from '@/lib/pce-mock-data'
import { SubjectPickerSheet } from '@/components/pce/subject-picker-sheet'

// ── Question edit sheet (non-disruptive — doesn't push the question list) ────
interface QuestionSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: 'new' | 'edit'
  initialText: string
  initialType: 'likert' | 'free_text'
  likertPointer: number
  onSave: (text: string, type: 'likert' | 'free_text') => void
}

function QuestionSheet({ open, onOpenChange, mode, initialText, initialType, likertPointer, onSave }: QuestionSheetProps) {
  const [text, setText] = useState(initialText)
  const [type, setType] = useState<'likert' | 'free_text'>(initialType)

  // Reset state when sheet opens with new values
  function handleOpenChange(v: boolean) {
    if (v) {
      setText(initialText)
      setType(initialType)
    }
    onOpenChange(v)
  }

  function handleSave() {
    if (!text.trim()) return
    onSave(text.trim(), type)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle>{mode === 'new' ? 'Add question' : 'Edit question'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Question</label>
            <Textarea
              autoFocus
              placeholder="Type your question…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
              }}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Answer type</label>
            <div className="flex gap-2">
              <Button
                variant={type === 'likert' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('likert')}
                className="flex-1"
              >
                <i className="fa-light fa-chart-bar" aria-hidden="true" />
                Likert {likertPointer}
              </Button>
              <Button
                variant={type === 'free_text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('free_text')}
                className="flex-1"
              >
                <i className="fa-light fa-align-left" aria-hidden="true" />
                Free text
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {type === 'likert'
                ? `Students rate on a ${likertPointer}-point scale. Results are averaged and compared across sections and terms.`
                : 'Students type a free-form response. Responses are shown in moderation before release.'}
            </p>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border shrink-0 flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="default" size="sm" disabled={!text.trim()} onClick={handleSave}>
            {mode === 'new' ? 'Add question' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const {
    templates, updateTemplate,
    addTemplateSection, removeTemplateSection, reorderTemplateSections,
    addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
  } = usePce()

  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<TemplateQuestion | null>(null)
  const dragIndex = useRef<number | null>(null)
  const sectionDragIndex = useRef<number | null>(null)

  const template = templates.find(t => t.id === id)

  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    () => template?.templateSections?.[0]?.id ?? null
  )

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
  const activeSection = sections.find(s => s.id === activeSectionId) ?? null
  const sectionQs = activeSection?.questions ?? []
  const existingSubjectKeys = sections.map(s => s.subjectKey)
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const canPublish = sections.length > 0 && totalQuestions > 0

  const activeSubjectMeta = activeSection
    ? MOCK_SUBJECTS.find(s => s.key === activeSection.subjectKey)
    : null

  // ── Drag handlers ───────────────────────────────────────────────────────────
  function handleDragStart(index: number) { dragIndex.current = index }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index || !activeSection) return
    reorderSectionQuestions(t.id, activeSection.id, dragIndex.current, index)
    dragIndex.current = index
  }
  function handleDragEnd() { dragIndex.current = null }

  function handleSectionDragStart(index: number) { sectionDragIndex.current = index }
  function handleSectionDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (sectionDragIndex.current === null || sectionDragIndex.current === index) return
    reorderTemplateSections(t.id, sectionDragIndex.current, index)
    sectionDragIndex.current = index
  }
  function handleSectionDragEnd() { sectionDragIndex.current = null }

  // ── Question sheet actions ──────────────────────────────────────────────────
  function openNewQuestion() {
    setEditingQuestion(null)
    setSheetOpen(true)
  }

  function openEditQuestion(q: TemplateQuestion) {
    setEditingQuestion(q)
    setSheetOpen(true)
  }

  function handleSheetSave(text: string, type: 'likert' | 'free_text') {
    if (!activeSection) return
    if (editingQuestion) {
      updateSectionQuestion(t.id, activeSection.id, editingQuestion.id, { text, answerType: type })
    } else {
      addSectionQuestion(t.id, activeSection.id, text, type)
    }
  }

  // ── Template actions ────────────────────────────────────────────────────────
  function handleSaveDraft() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handlePublish() { updateTemplate(t.id, { status: 'active' }) }
  function handleUnpublish() { updateTemplate(t.id, { status: 'draft' }) }

  function handlePickerConfirm(subjectKey: string, title: string) {
    addTemplateSection(t.id, { subjectKey: subjectKey as PceTemplateSection['subjectKey'], title, questions: [] })
    setPickerOpen(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Header ── */}
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
          Templates
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1
          className="text-sm font-semibold flex-1 truncate"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t.name}
        </h1>
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {sections.length} section{sections.length !== 1 ? 's' : ''} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
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
      </header>

      {/* ── Save confirmation ── */}
      {saved && (
        <div style={{ paddingInline: 28, paddingTop: 12 }}>
          <LocalBanner variant="success" dismissible onDismiss={() => setSaved(false)}>
            Draft saved.
          </LocalBanner>
        </div>
      )}

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: section navigator */}
        <aside
          className="flex flex-col border-r border-border shrink-0 overflow-y-auto"
          style={{ width: 200, background: 'var(--background)' }}
        >
          <SidebarGroup>
            <SidebarGroupLabel>Sections</SidebarGroupLabel>
            <SidebarMenu>
              {sections.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">No sections yet</p>
              )}

              {sections.map((sec, index) => {
                const count = sec.questions.length
                const isActive = sec.id === activeSectionId
                const canRemove = count === 0
                const subjectMeta = MOCK_SUBJECTS.find(s => s.key === sec.subjectKey)

                return (
                  <SidebarMenuItem key={sec.id}>
                    <div
                      className="flex items-center gap-1 group/sec"
                      draggable
                      onDragStart={() => handleSectionDragStart(index)}
                      onDragOver={(e) => handleSectionDragOver(e, index)}
                      onDragEnd={handleSectionDragEnd}
                      style={{ cursor: 'grab' }}
                    >
                      <div className="shrink-0 pl-1 opacity-20 group-hover/sec:opacity-50 transition-opacity text-muted-foreground">
                        <DragHandleGripIcon />
                      </div>
                      <SidebarMenuButton
                        isActive={isActive}
                        size="sm"
                        onClick={() => setActiveSectionId(sec.id)}
                        className="flex-col items-start h-auto gap-0 py-1.5 data-active:bg-muted data-active:shadow-none data-active:ring-0"
                      >
                        <div className="flex items-center justify-between w-full gap-1">
                          <span className="text-xs leading-tight truncate">{sec.title}</span>
                          <span className="text-xs tabular-nums shrink-0 text-muted-foreground">{count}</span>
                        </div>
                        {subjectMeta && (
                          <span className="text-[11px] leading-none text-muted-foreground truncate w-full">
                            {subjectMeta.label}
                          </span>
                        )}
                      </SidebarMenuButton>
                      {canRemove ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove ${sec.title} section`}
                              className="shrink-0 opacity-0 group-hover/sec:opacity-100 focus:opacity-100"
                              style={{ width: 20, height: 20 }}
                              onClick={() => {
                                removeTemplateSection(t.id, sec.id)
                                if (activeSectionId === sec.id) {
                                  const next = sections.find(s => s.id !== sec.id)
                                  setActiveSectionId(next?.id ?? null)
                                }
                              }}
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
                              className="shrink-0 opacity-0 group-hover/sec:opacity-40 flex items-center justify-center cursor-default"
                              style={{ width: 20, height: 20 }}
                              tabIndex={0}
                            >
                              <i className="fa-light fa-xmark text-xs text-muted-foreground" aria-hidden="true" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">Remove all questions first</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </SidebarMenuItem>
                )
              })}

              <SidebarMenuItem>
                <SidebarMenuButton size="sm" onClick={() => setPickerOpen(true)}>
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                  Add section
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </aside>

        {/* Right: question editor */}
        <main className="flex flex-col flex-1 overflow-y-auto">
          {activeSection ? (
            <>
              {/* Section header — the primary anchor of the work area */}
              <div
                className="flex items-start justify-between px-8 py-5 border-b border-border shrink-0"
                style={{ background: 'var(--background)' }}
              >
                <div className="flex flex-col gap-0.5">
                  <h2
                    className="text-base font-semibold"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {activeSection.title}
                  </h2>
                  {activeSubjectMeta && (
                    <p className="text-xs text-muted-foreground">
                      {activeSubjectMeta.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {sectionQs.length} question{sectionQs.length !== 1 ? 's' : ''}
                  </span>
                  <Button variant="default" size="sm" onClick={openNewQuestion}>
                    <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                    Add question
                  </Button>
                </div>
              </div>

              {/* Question list */}
              <div className="flex-1 overflow-y-auto px-8 py-4">
                {sectionQs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <i
                      className="fa-light fa-list-ul text-3xl text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">No questions yet</p>
                      <p className="text-sm text-muted-foreground mt-0.5" style={{ maxWidth: 280 }}>
                        Questions in this section will be answered by students for the {activeSection.title} subject.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={openNewQuestion}>
                      <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                      Add first question
                    </Button>
                  </div>
                ) : (
                  <div style={{ maxWidth: 640 }}>
                    {sectionQs.map((q, index) => (
                      <div
                        key={q.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className="flex items-center gap-3 group"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          paddingBlock: 12,
                          cursor: 'grab',
                        }}
                      >
                        {/* Number */}
                        <span
                          className="shrink-0 tabular-nums text-xs font-medium text-muted-foreground"
                          style={{ width: 20, textAlign: 'right' }}
                        >
                          {index + 1}
                        </span>

                        {/* Drag handle */}
                        <DragHandleGripIcon className="shrink-0 opacity-0 group-hover:opacity-40 text-muted-foreground transition-opacity" />

                        {/* Question text */}
                        <span className="text-sm flex-1 min-w-0 leading-snug">{q.text}</span>

                        {/* Answer type chip */}
                        <span
                          className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md tabular-nums"
                          style={{
                            backgroundColor: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          {q.answerType === 'likert' ? `Likert ${t.likertPointer}` : 'Free text'}
                        </span>

                        {/* Actions */}
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Question actions"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => openEditQuestion(q)}>
                              <i className="fa-light fa-pen" aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteSectionQuestion(t.id, activeSection.id, q.id)}
                            >
                              <i className="fa-light fa-trash" aria-hidden="true" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-center flex-1">
              <i className="fa-light fa-rectangle-list text-4xl text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">No sections yet</p>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ maxWidth: 280 }}>
                  Add a section to define who or what is being evaluated — Course Content, Instructor, Coordinator.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
                Add section
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ── Question sheet ── */}
      <QuestionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={editingQuestion ? 'edit' : 'new'}
        initialText={editingQuestion?.text ?? ''}
        initialType={editingQuestion?.answerType ?? 'likert'}
        likertPointer={t.likertPointer}
        onSave={handleSheetSave}
      />

      {/* ── Subject picker sheet ── */}
      <SubjectPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        existingSubjectKeys={existingSubjectKeys}
        onConfirm={handlePickerConfirm}
      />
    </div>
  )
}
