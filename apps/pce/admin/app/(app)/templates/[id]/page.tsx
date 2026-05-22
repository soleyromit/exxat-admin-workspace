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

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const {
    templates, updateTemplate,
    addTemplateSection, removeTemplateSection, reorderTemplateSections,
    addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
  } = usePce()

  const [openCard, setOpenCard] = useState<'new' | string | null>(null)
  const [cardText, setCardText] = useState('')
  const [cardType, setCardType] = useState<'likert' | 'free_text'>('likert')
  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const sectionDragIndex = useRef<number | null>(null)

  const template = templates.find(t => t.id === id)

  // Active section state — must be declared before any early return
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    () => template?.templateSections?.[0]?.id ?? null
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

  const t = template

  const sections = t.templateSections ?? []
  const activeSection = sections.find(s => s.id === activeSectionId) ?? null

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const canPublish = sections.length > 0 && totalQuestions > 0

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
    if (!cardText.trim() || !activeSection) return
    addSectionQuestion(t.id, activeSection.id, cardText.trim(), cardType)
    closeCard()
  }

  function handleEditSave(questionId: string) {
    if (!cardText.trim() || !activeSection) return
    updateSectionQuestion(t.id, activeSection.id, questionId, { text: cardText.trim(), answerType: cardType })
    closeCard()
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index || !activeSection) return
    reorderSectionQuestions(t.id, activeSection.id, dragIndex.current, index)
    dragIndex.current = index
  }

  function handleDragEnd() {
    dragIndex.current = null
  }

  // Section drag handlers
  function handleSectionDragStart(index: number) {
    sectionDragIndex.current = index
  }

  function handleSectionDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (sectionDragIndex.current === null || sectionDragIndex.current === index) return
    reorderTemplateSections(t.id, sectionDragIndex.current, index)
    sectionDragIndex.current = index
  }

  function handleSectionDragEnd() {
    sectionDragIndex.current = null
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

  function handlePickerConfirm(subjectKey: string, title: string) {
    addTemplateSection(t.id, { subjectKey: subjectKey as PceTemplateSection['subjectKey'], title, questions: [] })
    setPickerOpen(false)
  }

  const sectionQs = activeSection?.questions ?? []
  const existingSubjectKeys = sections.map(s => s.subjectKey)

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
            ? { backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }
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
                <TooltipContent>Add at least one section with a question before publishing</TooltipContent>
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
          className="flex flex-col border-r border-border shrink-0 overflow-y-auto"
          style={{ width: 200, background: 'var(--sidebar)' }}
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
                        onClick={() => { setActiveSectionId(sec.id); closeCard() }}
                        className="flex-col items-start h-auto gap-0 py-1.5"
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

        <main className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '20px 28px 32px' }}>
          {activeSection ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold">{activeSection.title}</h2>
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
                        Add your first question to the {activeSection.title} section.
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
                      className="flex items-center gap-2 group"
                      style={{ borderBottom: '1px solid var(--border)', paddingBlock: 10, cursor: 'grab' }}
                    >
                      <DragHandleGripIcon className="shrink-0 opacity-30 group-hover:opacity-60 text-muted-foreground transition-opacity" />
                      <span className="text-sm flex-1 min-w-0 leading-snug">{q.text}</span>
                      <Badge
                        variant="secondary"
                        className="rounded shrink-0"
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          paddingInline: 6,
                          paddingBlock: 2,
                          backgroundColor: 'var(--muted)',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {q.answerType === 'likert'
                          ? <><i className="fa-light fa-chart-bar" aria-hidden="true" style={{ marginRight: 4 }} />Likert {t.likertPointer}</>
                          : <><i className="fa-light fa-align-left" aria-hidden="true" style={{ marginRight: 4 }} />Free text</>
                        }
                      </Badge>
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
                          <DropdownMenuItem onClick={() => openEditCard(q)}>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openAddCard}
                    className="w-full justify-start border border-dashed"
                    style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                    Add question
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <i className="fa-light fa-rectangle-list text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-sm font-medium">No sections yet</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Add your first section to start building this template.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add section
              </Button>
            </div>
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
      className="flex flex-col gap-3 border border-border p-4"
      style={{ background: 'var(--muted)' }}
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
