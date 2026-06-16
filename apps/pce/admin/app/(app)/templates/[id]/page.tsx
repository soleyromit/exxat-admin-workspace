'use client'

import { useState, useRef } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Checkbox,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING } from '@/lib/list-status-badges'
import { MOCK_SUBJECTS } from '@/lib/pce-mock-data'
import type { TemplateQuestion, CourseTypeFilter, SubjectKey } from '@/lib/pce-mock-data'
// SubjectKey is used for predefined subjects; custom subjects use plain strings

const COURSE_TYPE_OPTIONS: { value: CourseTypeFilter; label: string }[] = [
  { value: 'didactic', label: 'Didactic' },
  { value: 'clinical', label: 'Clinical' },
]

type AnswerType = TemplateQuestion['answerType']

const Q_TYPE_OPTIONS: { value: AnswerType; label: string; icon: string }[] = [
  { value: 'likert',    label: 'Likert Scale',              icon: 'fa-sliders' },
  { value: 'free_text', label: 'Short / Long Answer',       icon: 'fa-align-left' },
]

function qTypeLabel(type: AnswerType): string {
  return Q_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type
}

type QMeta = {
  helpText: string
  reportTitle: string
  naEnabled: boolean
  commentsEnabled: boolean
  mandatory: boolean
}
const DEFAULT_Q_META: QMeta = {
  helpText: '', reportTitle: '', naEnabled: false, commentsEnabled: false, mandatory: false,
}

// Right-panel attributes editor — shown when a question is selected
function AttributesPanel({
  question,
  meta,
  onTextBlur,
  onMetaChange,
  onClose,
}: {
  question: TemplateQuestion
  meta: QMeta
  onTextBlur: (text: string) => void
  onMetaChange: (patch: Partial<QMeta>) => void
  onClose: () => void
}) {
  const [text, setText] = useState(question.text)
  const [metaOpen, setMetaOpen] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-sm font-semibold">Attributes</span>
        <Button variant="ghost" size="icon-xs" aria-label="Close attributes panel" onClick={onClose}>
          <i className="fa-light fa-xmark text-sm" aria-hidden="true" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="field-details" className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <TabsList variant="line">
            <TabsTrigger value="field-details">Field Details</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="field-details" className="flex-1 overflow-y-auto m-0">
          <div className="flex flex-col gap-5" style={{ padding: '16px' }}>

            {/* Question text */}
            <Field orientation="vertical">
              <FieldLabel htmlFor="attr-q-text">Question</FieldLabel>
              <Input
                id="attr-q-text"
                value={text}
                onChange={e => setText(e.target.value)}
                onBlur={() => onTextBlur(text)}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                placeholder="Untitled Question"
                className="text-sm"
              />
            </Field>

            {/* Meta Information — collapsible */}
            <Collapsible open={metaOpen} onOpenChange={setMetaOpen}>
              <div
                className="flex items-center justify-between"
                style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}
              >
                <span className="text-sm font-medium">Meta Information</span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon-xs" aria-label="Toggle meta information">
                    <i className={`fa-light fa-chevron-${metaOpen ? 'up' : 'down'} text-xs`} aria-hidden="true" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="flex flex-col gap-3 pt-3">
                <Field orientation="vertical">
                  <FieldLabel htmlFor="attr-help">Help Information</FieldLabel>
                  <Input
                    id="attr-help"
                    value={meta.helpText}
                    onChange={e => onMetaChange({ helpText: e.target.value })}
                    placeholder='Shows under a "?" on hover'
                    className="text-sm"
                  />
                </Field>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="attr-report">Report Title</FieldLabel>
                  <Input
                    id="attr-report"
                    value={meta.reportTitle}
                    onChange={e => onMetaChange({ reportTitle: e.target.value })}
                    placeholder="Replaces description in reports"
                    className="text-sm"
                  />
                </Field>
              </CollapsibleContent>
            </Collapsible>

            {/* Toggles */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={meta.naEnabled}
                  onChange={() => onMetaChange({ naEnabled: !meta.naEnabled })}
                  aria-label="Include Not Applicable option"
                />
                <span className="text-sm">
                  Include <span className="font-medium">Not Applicable</span> Option
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={meta.commentsEnabled}
                  onChange={() => onMetaChange({ commentsEnabled: !meta.commentsEnabled })}
                  aria-label="Enable comments"
                />
                <span className="text-sm">Comments</span>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={meta.mandatory}
                  onChange={() => onMetaChange({ mandatory: !meta.mandatory })}
                  aria-label="Make this mandatory"
                />
                <span className="text-sm">Make This Mandatory</span>
              </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const backHref = pathname.includes('/programmatic/') ? '/templates/programmatic' : '/templates'
  const {
    templates, updateTemplate,
    addTemplateSection, removeTemplateSection, updateTemplateSection,
    addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
  } = usePce()

  const template = templates.find(t => t.id === id)

  const [saved, setSaved] = useState(false)
  const [closedSectionIds, setClosedSectionIds] = useState<Set<string>>(new Set())
  const [selectedQuestion, setSelectedQuestion] = useState<{ sectionId: string; questionId: string } | null>(null)
  const [qMeta, setQMeta] = useState<Record<string, QMeta>>({})
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionTitle, setEditingSectionTitle] = useState('')
  // Subject group tabs — each group has a key, display label, and list of evaluated roles
  const [subjectGroups, setSubjectGroups] = useState<Array<{ key: string; label: string; roles: string[] }>>([
    { key: 'course_content', label: 'Course', roles: [] },
    { key: 'faculty', label: 'Faculty', roles: [] },
  ])
  const [activeGroup, setActiveGroup] = useState('course_content')
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [rolePickerGroupKey, setRolePickerGroupKey] = useState<string | null>(null)
  const [roleSearch, setRoleSearch] = useState('')


  const questionDragInfo = useRef<{ sectionId: string; index: number } | null>(null)

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center" style={{ minHeight: 240 }}>
        <i className="fa-light fa-circle-exclamation text-4xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Template not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>Back to Templates</Link>
        </Button>
      </div>
    )
  }

  const t = template
  const isProgrammatic = t.surveyType === 'programmatic'
  const sections = t.templateSections ?? []
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const canPublish = sections.length > 0 && totalQuestions > 0

  const selectedSec = selectedQuestion ? sections.find(s => s.id === selectedQuestion.sectionId) : null
  const selectedQ = selectedSec?.questions.find(q => q.id === selectedQuestion?.questionId) ?? null

  function toggleSection(sectionId: string) {
    setClosedSectionIds(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function handleAddGroup() {
    const label = newGroupName.trim()
    if (!label) return
    const key = `grp-${Date.now()}`
    setSubjectGroups(prev => [...prev, { key, label, roles: [] }])
    setActiveGroup(key)
    setGroupPickerOpen(false)
    setNewGroupName('')
  }

  function handleRemoveGroup(key: string) {
    if (key === 'course_content') return
    sections.filter(s => s.subjectKey === key).forEach(s => {
      removeTemplateSection(t.id, s.id)
      if (selectedQuestion?.sectionId === s.id) setSelectedQuestion(null)
    })
    setSubjectGroups(prev => prev.filter(g => g.key !== key))
    setActiveGroup('course_content')
  }

  function handleAddRole(groupKey: string, roleKey: string) {
    setSubjectGroups(prev => prev.map(g =>
      g.key === groupKey ? { ...g, roles: [...g.roles, roleKey] } : g
    ))
  }

  function handleRemoveRole(groupKey: string, roleKey: string) {
    setSubjectGroups(prev => prev.map(g =>
      g.key === groupKey ? { ...g, roles: g.roles.filter(r => r !== roleKey) } : g
    ))
  }

  function handleAddSection(subjectKey?: string) {
    const key = subjectKey ?? (isProgrammatic ? 'course_content' : activeGroup)
    if (!key) return
    const newId = `sec-${Date.now()}`
    addTemplateSection(t.id, { subjectKey: key, title: 'Untitled Section', questions: [] }, newId)
    setEditingSectionId(newId)
    setEditingSectionTitle('Untitled Section')
    setClosedSectionIds(prev => { const n = new Set(prev); n.delete(newId); return n })
  }

  function handleAddQuestion(sectionId: string) {
    const newId = `q-${Date.now()}`
    addSectionQuestion(t.id, sectionId, 'Untitled Question', 'likert', undefined, newId)
    setClosedSectionIds(prev => { const next = new Set(prev); next.delete(sectionId); return next })
    setSelectedQuestion({ sectionId, questionId: newId })
  }

  function getQMeta(questionId: string): QMeta {
    return { ...DEFAULT_Q_META, ...qMeta[questionId] }
  }

  function patchQMeta(questionId: string, patch: Partial<QMeta>) {
    setQMeta(prev => ({ ...prev, [questionId]: { ...getQMeta(questionId), ...patch } }))
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

  // ── Role picker — checkmark list, multi-select, custom entry ────────────────
  function renderRolePickerContent(groupKey: string) {
    const group = subjectGroups.find(g => g.key === groupKey)
    const selected = new Set(group?.roles ?? [])
    const allRoles = MOCK_SUBJECTS
      .filter(s => s.key !== 'course_content' && s.key !== 'faculty')
      .sort((a, b) => a.label.localeCompare(b.label))
    const filtered = roleSearch
      ? allRoles.filter(s => s.label.toLowerCase().includes(roleSearch.toLowerCase()))
      : allRoles
    const isCustom = roleSearch.trim().length > 0 &&
      !allRoles.some(s => s.label.toLowerCase() === roleSearch.trim().toLowerCase()) &&
      !selected.has(roleSearch.trim())

    function toggleRole(roleKey: string) {
      if (selected.has(roleKey)) handleRemoveRole(groupKey, roleKey)
      else handleAddRole(groupKey, roleKey)
    }

    return (
      <Command shouldFilter={false} className="[&_[data-slot=input-group]]:bg-background [&_[data-slot=input-group]]:border-border/60">
        <CommandInput
          placeholder="Search or add role…"
          value={roleSearch}
          onValueChange={setRoleSearch}
        />
        <CommandList>
          {filtered.length === 0 && !isCustom && (
            <CommandEmpty>No roles found.</CommandEmpty>
          )}
          {filtered.length > 0 && (
            <CommandGroup>
              {filtered.map(s => {
                const checked = selected.has(s.key)
                return (
                  <CommandItem key={s.key} value={s.key} onSelect={() => toggleRole(s.key)} aria-selected={checked}>
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      className="pointer-events-none shrink-0 size-3.5 p-0"
                      aria-hidden="true"
                    />
                    <span className="flex-1 ml-2 truncate">{s.label}</span>
                    {(s.prismCount ?? 0) > 0 && (
                      <span className="text-xs ml-2 shrink-0 tabular-nums text-muted-foreground">
                        {s.prismCount} in Prism
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {isCustom && (
            <CommandGroup>
              <CommandItem
                value={roleSearch.trim()}
                onSelect={() => { handleAddRole(groupKey, roleSearch.trim()); setRoleSearch('') }}
              >
                <i className="fa-light fa-plus text-xs shrink-0" aria-hidden="true" />
                <span className="ml-2">Add &ldquo;{roleSearch.trim()}&rdquo;</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    )
  }

  // ── Section card ─────────────────────────────────────────────────────────────
  function renderSectionCard(sec: typeof sections[0]) {
    const isOpen = !closedSectionIds.has(sec.id)
    return (
      <div
        key={sec.id}
        className="border border-border overflow-hidden"
        style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)' }}
      >
        {/* Section header */}
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
            <i className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'} text-xs`} aria-hidden="true" />
          </Button>

          <div className="flex-1 min-w-0">
            {editingSectionId === sec.id ? (
              <Input
                autoFocus
                aria-label="Section title"
                value={editingSectionTitle}
                onChange={e => setEditingSectionTitle(e.target.value)}
                onBlur={() => {
                  updateTemplateSection(t.id, sec.id, { title: editingSectionTitle.trim() || 'Untitled Section' })
                  setEditingSectionId(null)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setEditingSectionId(null)
                }}
                onClick={e => e.stopPropagation()}
                className="h-7 text-sm font-semibold bg-transparent border-0 border-b border-transparent focus-visible:border-foreground focus-visible:ring-0 rounded-none shadow-none px-0"
              />
            ) : (
              <span
                className="text-sm font-semibold truncate cursor-text block"
                onClick={e => {
                  e.stopPropagation()
                  setEditingSectionTitle(sec.title)
                  setEditingSectionId(sec.id)
                }}
              >
                {sec.title}
              </span>
            )}
          </div>

          <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            {sec.questions.length}q
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
                onClick={() => {
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
          <div className="flex flex-col gap-2" style={{ padding: '10px 12px 14px' }}>
            {sec.questions.map((q, qIndex) => {
              const isSelected = selectedQuestion?.questionId === q.id && selectedQuestion?.sectionId === sec.id
              return (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => handleQDragStart(sec.id, qIndex)}
                  onDragOver={e => handleQDragOver(e, sec.id, qIndex)}
                  onDragEnd={handleQDragEnd}
                  className="group rounded-lg border cursor-pointer"
                  style={{
                    background: 'var(--muted)',
                    borderColor: isSelected ? 'var(--foreground)' : 'var(--border)',
                    outline: isSelected ? '1px solid var(--foreground)' : 'none',
                  }}
                  onClick={() => setSelectedQuestion({ sectionId: sec.id, questionId: q.id })}
                >
                  {/* Type label row */}
                  <div className="flex items-center justify-end gap-1 px-3 pt-2">
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {qTypeLabel(q.answerType)}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Question info"
                          className="opacity-40"
                          onClick={e => e.stopPropagation()}
                        >
                          <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Click to edit attributes</TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Hover toolbar */}
                  <div
                    className="flex items-center gap-0.5 px-2 pb-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={qIndex === 0}
                      onClick={() => handleMoveQuestion(sec.id, qIndex, 'up')}>
                      <i className="fa-light fa-arrow-up text-xs" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={qIndex === sec.questions.length - 1}
                      onClick={() => handleMoveQuestion(sec.id, qIndex, 'down')}>
                      <i className="fa-light fa-arrow-down text-xs" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Duplicate question"
                      onClick={() => handleDuplicateQuestion(sec.id, q)}>
                      <i className="fa-light fa-copy text-xs" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Delete question"
                      onClick={() => handleDeleteQuestion(sec.id, q.id)}>
                      <i className="fa-light fa-trash text-xs" aria-hidden="true" style={{ color: 'var(--destructive)' }} />
                    </Button>
                    <div
                      style={{ cursor: 'grab', marginLeft: 'auto' }}
                      className="shrink-0 text-muted-foreground flex items-center opacity-50"
                    >
                      <DragHandleGripIcon />
                    </div>
                  </div>
                  {/* Question text */}
                  <div className="px-4 pb-4">
                    <span className="text-sm font-semibold">
                      {q.text || <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>Untitled Question</span>}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Add question — centered filled button */}
            <div className="flex justify-center pt-2">
              <Button
                variant="default"
                size="sm"
                className="font-semibold"
                onClick={() => handleAddQuestion(sec.id)}
              >
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add question
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: 'Templates', href: backHref }]}
        title={t.name}
      />

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
          <h1
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
          </h1>
          {t.status === 'active'
            ? <ListHubStatusBadge label="Active" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
            : <ListHubStatusBadge label="Draft" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-pen-to-square" />
          }
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
        <TabsContent value="builder" className="flex-1 min-h-0 flex flex-row m-0">
          {/* Left — section list */}
          <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          {isProgrammatic ? (
            /* Programmatic surveys — flat section list */
            <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
              <div style={{ maxWidth: 720 }}>
                {sections.length === 0 ? (
                  <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
                    <Button variant="link" size="sm" onClick={() => handleAddSection()} className="font-semibold">
                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                      Add section
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {sections.map(sec => renderSectionCard(sec))}
                    <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
                      <Button variant="link" size="sm" onClick={() => handleAddSection()} className="font-semibold">
                        <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                        Add section
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Course evaluation — dynamic subject group tabs, default (pill) variant */
            <Tabs
              value={activeGroup}
              onValueChange={setActiveGroup}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Subject group strip — default variant (pill), visually distinct from Details/Builder */}
              <div
                className="flex items-center gap-3 shrink-0"
                style={{ paddingInline: 40, paddingBlock: 10, borderBottom: '1px solid var(--border)' }}
              >
                <TabsList variant="default">
                  {subjectGroups.map(g => (
                    <TabsTrigger
                      key={g.key}
                      value={g.key}
                      className={g.key !== 'course_content' ? 'gap-1.5 pr-1' : ''}
                    >
                      {g.label}
                      {g.key !== 'course_content' && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remove ${g.label} group`}
                          className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
                          onClick={e => { e.stopPropagation(); handleRemoveGroup(g.key) }}
                        >
                          <i className="fa-solid fa-xmark text-[10px]" aria-hidden="true" />
                        </Button>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* + Add group */}
                <Popover
                  open={groupPickerOpen}
                  onOpenChange={open => { setGroupPickerOpen(open); if (!open) setNewGroupName('') }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="xs" className="shrink-0">
                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                      Add group
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-3 w-52" align="start" sideOffset={8}>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium">Group name</p>
                      <Input
                        autoFocus
                        placeholder="e.g. Clinical Site"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddGroup() }}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" onClick={handleAddGroup} disabled={!newGroupName.trim()}>
                        Create group
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tab content — scrollable */}
              <div className="flex-1 overflow-y-auto" style={{ padding: '28px 40px 48px' }}>
                {subjectGroups.map(group => {
                  const groupSections = sections.filter(s => s.subjectKey === group.key)
                  return (
                    <TabsContent key={group.key} value={group.key} className="m-0">
                      <div style={{ maxWidth: 720 }} className="flex flex-col gap-4">

                        {/* Role tags row — non-course groups only */}
                        {group.key === 'course_content' ? (
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            Shown once per course
                          </p>
                        ) : (
                          <div
                            className="flex items-start gap-3 pb-3"
                            style={{ borderBottom: '1px solid var(--border)' }}
                          >
                            {/* Label — fixed left */}
                            <span className="text-sm font-medium shrink-0 pt-0.5">Evaluates</span>

                            {/* Tags — wrap freely in middle */}
                            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                              {group.roles.length === 0 ? (
                                <span className="text-sm" style={{ color: 'var(--muted-foreground)', paddingTop: 2 }}>
                                  No roles selected — sections shown once per role member when added
                                </span>
                              ) : group.roles.map(roleKey => {
                                const role = MOCK_SUBJECTS.find(s => s.key === roleKey)
                                return (
                                  <span
                                    key={roleKey}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium rounded-full"
                                    style={{
                                      background: 'var(--muted)',
                                      color: 'var(--foreground)',
                                      padding: '3px 10px 3px 12px',
                                    }}
                                  >
                                    {role?.label ?? roleKey}
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label={`Remove ${role?.label ?? roleKey}`}
                                      className="opacity-50 hover:opacity-100 -mr-1"
                                      onClick={() => handleRemoveRole(group.key, roleKey)}
                                    >
                                      <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                                    </Button>
                                  </span>
                                )
                              })}
                            </div>

                            {/* Add role — pinned right, never shifts */}
                            <Popover
                              open={rolePickerGroupKey === group.key}
                              onOpenChange={open => {
                                setRolePickerGroupKey(open ? group.key : null)
                                if (!open) setRoleSearch('')
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="xs" className="shrink-0">
                                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                                  Add role
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 w-72" align="end" sideOffset={8}>
                                {renderRolePickerContent(group.key)}
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}

                        {/* Sections */}
                        {groupSections.length === 0 ? (
                          <div
                            className="flex items-center justify-center rounded-lg border border-dashed"
                            style={{ padding: '28px 16px', borderColor: 'var(--border)' }}
                          >
                            <Button variant="link" size="sm" onClick={() => handleAddSection(group.key)} className="font-semibold">
                              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                              Add section
                            </Button>
                          </div>
                        ) : (
                          <>
                            {groupSections.map(sec => renderSectionCard(sec))}
                            <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
                              <Button variant="link" size="sm" onClick={() => handleAddSection(group.key)} className="font-semibold">
                                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                                Add section
                              </Button>
                            </div>
                          </>
                        )}

                      </div>
                    </TabsContent>
                  )
                })}
              </div>
            </Tabs>
          )}
          </div>

          {/* Right — Attributes panel */}
          {selectedQ && selectedQuestion && (
            <div
              className="w-80 shrink-0 flex flex-col overflow-hidden"
              style={{ borderLeft: '1px solid var(--border)' }}
            >
              <AttributesPanel
                key={selectedQuestion.questionId}
                question={selectedQ}
                meta={getQMeta(selectedQuestion.questionId)}
                onTextBlur={text =>
                  updateSectionQuestion(t.id, selectedQuestion.sectionId, selectedQuestion.questionId, { text })
                }
                onMetaChange={patch => patchQMeta(selectedQuestion.questionId, patch)}
                onClose={() => setSelectedQuestion(null)}
              />
            </div>
          )}
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
              <div className="flex gap-2" role="radiogroup" aria-label="Course type">
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
                      className="flex items-center gap-2 rounded-lg h-auto"
                      style={{
                        padding: '6px 10px',
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
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Shown before the first question. Optional.
                </p>
              </div>
              <div>
                <FieldLabel
                  htmlFor="tmpl-instr-title"
                >
                  Instruction title
                </FieldLabel>
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
                <FieldLabel
                  htmlFor="tmpl-instr-desc"
                >
                  Instruction text
                </FieldLabel>
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



    </div>
  )
}
