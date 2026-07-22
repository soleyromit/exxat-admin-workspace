'use client'

import { useState, useRef, useEffect } from 'react'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  ToggleSwitch,
  RadioGroup,
  RadioGroupItem,
  Label,
  Field,
  FieldLabel,
  FieldDescription,
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
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { WizardNav } from '@/components/pce/wizard-nav'
import { usePce } from '@/components/pce/pce-state'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING } from '@/lib/list-status-badges'
import { EVAL_DEFAULT_SCALE, EVAL_FACULTY_ROLES, EVAL_DEFAULT_FACULTY_ROLE_IDS, TEMPLATE_IMPORT_LIBRARY, COURSE_TYPE_FULL_LABEL, type DeliveryMode } from '@/lib/pce-mock-data'
import { TemplateImportDialog } from '@/components/pce/template-import-dialog'

// Faculty roles offered in the builder = the program roles configured in Central
// Settings (Jun 30 meeting). Prism-sourced; no custom roles created here.
// Roles are declared on a ROLE SET, outside the section (Jul 1 constraint). A set targets
// one role (separate questions per role) or multiple roles (shared questions across roles).
const FACULTY_ROLE_OPTIONS: { key: string; label: string }[] =
  EVAL_FACULTY_ROLES.map(r => ({ key: r.id, label: r.label }))
const ROLE_LABEL = (key: string) => EVAL_FACULTY_ROLES.find(r => r.id === key)?.label ?? key
import type { TemplateQuestion, SubjectKey, PceTemplateSection, PceTemplateRoleSet, TemplateImportDoc } from '@/lib/pce-mock-data'
// SubjectKey is used for predefined subjects; custom subjects use plain strings

type SurveyPurpose = 'student_pulse' | 'faculty_self_eval' | 'alumni' | 'preceptor_eval'
const SURVEY_TYPE_OPTIONS: { value: SurveyPurpose; label: string; description: string }[] = [
  { value: 'student_pulse',     label: 'Student Pulse',   description: 'Mid-semester or end-of-year student wellbeing checks' },
  { value: 'faculty_self_eval', label: 'Faculty Self-Eval', description: 'Annual faculty self-reflection and development' },
  { value: 'alumni',            label: 'Alumni Survey',   description: 'Post-graduation outcomes and preparedness' },
  { value: 'preceptor_eval',    label: 'Preceptor Eval',  description: 'Clinical site and preceptor feedback' },
]

// Editor wizard steps — configure first, then build, then review before publishing.
type WizardStepKey = 'builder' | 'settings' | 'review'
const WIZARD_STEPS: { n: number; key: WizardStepKey; label: string }[] = [
  { n: 1, key: 'settings', label: 'Template settings' },
  { n: 2, key: 'builder',  label: 'Builder' },
  { n: 3, key: 'review',   label: 'Review' },
]

type AnswerType = TemplateQuestion['answerType']

// Answer types the student taker renders — grouped for the picker.
const Q_TYPE_GROUPS: { label: string; options: { value: AnswerType; label: string; icon: string }[] }[] = [
  { label: 'Scaled', options: [
    { value: 'likert',          label: 'Likert scale',       icon: 'fa-sliders' },
  ] },
  { label: 'Text', options: [
    { value: 'free_text',       label: 'Short / long answer', icon: 'fa-align-left' },
  ] },
  { label: 'Choice', options: [
    { value: 'single_choice',   label: 'Single choice',      icon: 'fa-circle-dot' },
    { value: 'multiple_choice', label: 'Multiple choice',    icon: 'fa-square-check' },
    { value: 'select_dropdown', label: 'Dropdown',           icon: 'fa-caret-down' },
  ] },
  { label: 'Other', options: [
    { value: 'number',          label: 'Number',             icon: 'fa-hashtag' },
    { value: 'date_picker',     label: 'Date',               icon: 'fa-calendar' },
    { value: 'title',           label: 'Section title',      icon: 'fa-heading' },
  ] },
]
const Q_TYPE_FLAT = Q_TYPE_GROUPS.flatMap(g => g.options)
const CHOICE_TYPES = new Set<AnswerType>(['single_choice', 'multiple_choice', 'select_dropdown'])

function qTypeLabel(type: AnswerType): string {
  return Q_TYPE_FLAT.find(o => o.value === type)?.label ?? type
}

// Editable option list for single / multiple choice + dropdown answer types.
function ChoicesEditor({ answerType, choices, onChange }: {
  answerType: AnswerType; choices: string[]; onChange: (c: string[]) => void
}) {
  const icon = answerType === 'multiple_choice' ? 'fa-square'
    : answerType === 'select_dropdown' ? 'fa-caret-down' : 'fa-circle'
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Options</span>
      <div className="flex flex-col gap-1.5">
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <i className={`fa-light ${icon} text-xs text-muted-foreground shrink-0`} aria-hidden="true" />
            <Input value={c}
              onChange={e => { const next = [...choices]; next[i] = e.target.value; onChange(next) }}
              placeholder={`Option ${i + 1}`} className="text-sm h-8" aria-label={`Option ${i + 1}`} />
            <Button variant="ghost" size="icon-xs" aria-label={`Remove option ${i + 1}`}
              disabled={choices.length <= 1}
              onClick={() => onChange(choices.filter((_, j) => j !== i))}>
              <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-fit"
        onClick={() => onChange([...choices, `Option ${choices.length + 1}`])}>
        <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add option
      </Button>
    </div>
  )
}

// Optional image upload (cover image / university logo) — Jun 30 PCE meeting.
// Self-contained clickable dropzone (Notion / Linear pattern): the box is sized to the
// image's true aspect ratio (`boxClassName`), the dimension guidance lives inside as the
// affordance, and Replace / Remove appear below only once an image exists — so both the
// wide cover and the square logo share one consistent structure.
function ImageUploadField({ label, description, value, onChange, boxClassName, recommend }: {
  label: string; description?: string; value: string | null; onChange: (v: string | null) => void
  boxClassName: string; recommend: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }
  return (
    <Field orientation="vertical">
      <FieldLabel>{label} <span className="text-xs font-normal text-muted-foreground">(optional)</span></FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}
      {value ? (
        <div className="flex flex-col gap-2 items-start">
          <div className={`${boxClassName} rounded-md border border-border bg-cover bg-center`}
            style={{ backgroundImage: `url(${value})` }} role="img" aria-label={`${label} preview`} />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Replace</Button>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}
          className={`${boxClassName} h-auto rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground hover:bg-transparent`}>
          <i className="fa-regular fa-arrow-up-from-bracket text-base" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Upload</span>
          <span className="text-xs tabular-nums">{recommend}</span>
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} aria-label={`Upload ${label}`} />
    </Field>
  )
}

// Static section in the Template settings panel — always visible (no accordion), with a
// clear label + one-line helper so each group is self-explanatory.
function SettingsSection({ label, hint, children }: {
  label: string; hint: string; children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 py-5 border-b border-border last:border-0">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold">{label}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  )
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
  onTypeChange,
  onChoicesChange,
  onMetaChange,
  onClose,
}: {
  question: TemplateQuestion
  meta: QMeta
  onTextBlur: (text: string) => void
  onTypeChange: (type: AnswerType) => void
  onChoicesChange: (choices: string[]) => void
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

            {/* Answer type */}
            <Field orientation="vertical">
              <FieldLabel htmlFor="attr-q-type">Answer type</FieldLabel>
              <Select value={question.answerType} onValueChange={v => onTypeChange(v as AnswerType)}>
                <SelectTrigger id="attr-q-type" className="text-sm" aria-label="Answer type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Q_TYPE_GROUPS.map(g => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.options.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="flex items-center gap-1.5">
                            <i className={`fa-light ${o.icon}`} aria-hidden="true" />
                            {o.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Likert preview — reads the program scale from Central Settings (locked, not per-question) */}
            {question.answerType === 'likert' && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Scale preview</span>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {EVAL_DEFAULT_SCALE.labels.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded-md border border-border flex items-center justify-center text-sm font-medium tabular-nums"
                      style={{ background: 'var(--muted)' }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>1 · {EVAL_DEFAULT_SCALE.labels[0]}</span>
                  <span>{EVAL_DEFAULT_SCALE.points} · {EVAL_DEFAULT_SCALE.labels[EVAL_DEFAULT_SCALE.labels.length - 1]}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {EVAL_DEFAULT_SCALE.points}-point scale — set program-wide in{' '}
                  <Link href="/admin/eval-settings" className="underline underline-offset-2 hover:text-foreground">Settings</Link>.
                </p>
              </div>
            )}

            {/* Options editor — single / multiple choice + dropdown */}
            {CHOICE_TYPES.has(question.answerType) && (
              <ChoicesEditor
                answerType={question.answerType}
                choices={question.choices ?? []}
                onChange={onChoicesChange}
              />
            )}

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

export function TemplateEditor({ templateId, embedded = false, onPublished, variant = 'rail' }: {
  /** Template to edit; falls back to the route param when rendered as a page. */
  templateId?: string
  /** Render without page chrome (SiteHeader) — e.g. inside the push wizard's Survey Design step. */
  embedded?: boolean
  /** Called after Publish (embedded hosts return to their own view). */
  onPublished?: (id: string) => void
  /** Builder-step layout (design-compare variants, iteration 3). Section cards
   *  (collapse/expand + in-section Add question) are IDENTICAL in every
   *  variant — only the layout around them changes.
   *  'rail' — default; switches between aspects.
   *  'bands' — sticky aspect band headers carry identity + actions.
   *  'document' — one centered column, sticky aspect chips, no side rail.
   *  'preview' — build left, live student-facing preview right.
   *  'minimal' — bare essentials: narrow column, plain headings, text actions.
   *  'columns' — all three aspects side by side as board lanes.
   *  'tabs' — horizontal aspect tabs, one aspect at a time worked
   *           sequentially; each faculty role set is a first-class tab
   *           (Monil Jul 21 proposal).
   *  'guided' — same sequential stops in a left checklist rail (Mercury
   *             onboarding pattern) — no chrome above the content. */
  variant?: 'rail' | 'bands' | 'document' | 'preview' | 'minimal' | 'columns' | 'tabs' | 'guided'
}) {
  const routeParams = useParams<{ id: string }>()
  const id = templateId ?? routeParams?.id
  const pathname = usePathname()
  const backHref = pathname?.includes('/programmatic/') ? '/templates/programmatic' : '/templates'
  const {
    templates, updateTemplate,
    addTemplateSection, removeTemplateSection, updateTemplateSection,
    addFacultyRoleSet, removeFacultyRoleSet, updateFacultyRoleSetRoles,
    addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
  } = usePce()

  const template = templates.find(t => t.id === id)

  const [saved, setSaved] = useState(false)
  const [closedSectionIds, setClosedSectionIds] = useState<Set<string>>(new Set())
  const [selectedQuestion, setSelectedQuestion] = useState<{ sectionId: string; questionId: string } | null>(null)
  const [qMeta, setQMeta] = useState<Record<string, QMeta>>({})
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionTitle, setEditingSectionTitle] = useState('')
  // Three fixed aspects (Jun 30 PCE meeting — dropped the "Add group" naming).
  // Faculty roles are chosen on role sets (outside the section) — Jul 1 constraint.
  const subjectGroups: Array<{ key: string; label: string }> = [
    { key: 'course_content', label: 'Course' },
    { key: 'faculty',        label: 'Faculty' },
    { key: 'general',        label: 'General' },
  ]
  const [activeGroup, setActiveGroup] = useState('course_content')
  // Tabs/guided variants — which sequential stop (aspect or faculty role set)
  // is on stage. Keys: 'course', `stop-<roleSetId>`, 'general'.
  const [activeStop, setActiveStop] = useState('course')
  // Document variant — scrollspy for the sticky aspect chip bar.
  const [docAspect, setDocAspect] = useState('course_content')
  useEffect(() => {
    if (variant !== 'document') return
    const els = ['course_content', 'faculty', 'general']
      .map(k => document.getElementById(`aspect-${k}`))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setDocAspect(visible[0].target.id.replace('aspect-', ''))
      },
      /* Top inset = sticky breadcrumb + chip bar; bottom bias keeps the chip on
         the aspect whose header just scrolled past. */
      { rootMargin: '-112px 0px -55% 0px' },
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [variant])
  // Template details live in the persistent right settings panel (Airtable/Typeform
  // pattern) — no tabs, no dialog. Publish just publishes.
  // Branding (Jun 30 meeting) — optional cover image + university logo for the student landing.
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [universityLogo, setUniversityLogo] = useState<string | null>(null)
  // Document-upload: which tab (+ optional faculty role set) is receiving the generated content.
  const [importCtx, setImportCtx] = useState<{ subjectKey: string; roleSetId?: string; label: string } | null>(null)
  const [importedBanner, setImportedBanner] = useState<{ file: string; sections: number; questions: number } | null>(null)
  // Upload opens the OS file chooser directly (one click); the dialog then opens on the picked file.
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<{ subjectKey: string; roleSetId?: string } | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  function handleUploadPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    const target = uploadTargetRef.current
    if (!f || !target) return
    setUploadedFileName(f.name)
    openImport(target.subjectKey, target.roleSetId)
  }
  // Editor is a 3-step wizard — Builder → Template settings → Review — ending in Publish.
  const [wizardStep, setWizardStep] = useState<WizardStepKey>('settings')
  const [maxStepReached, setMaxStepReached] = useState(1)
  const currentStepNum = WIZARD_STEPS.find(s => s.key === wizardStep)?.n ?? 1
  const goToStep = (key: WizardStepKey) => {
    const n = WIZARD_STEPS.find(s => s.key === key)?.n ?? 1
    setWizardStep(key)
    setMaxStepReached(prev => Math.max(prev, n))
  }
  const goToStepNum = (n: number) => {
    const s = WIZARD_STEPS.find(st => st.n === n)
    if (s) goToStep(s.key)
  }
  // Opening instruction PER aspect (Course/Faculty/General) — shown at the start of
  // that section in the evaluation (not a single common instruction).
  const [aspectInstructions, setAspectInstructions] = useState<Record<string, { title: string; text: string }>>({})
  const setAspectInstruction = (key: string, patch: Partial<{ title: string; text: string }>) =>
    setAspectInstructions(prev => ({ ...prev, [key]: { ...(prev[key] ?? { title: '', text: '' }), ...patch } }))
  // Opening-instruction accordion open state per aspect (collapsed by default).
  const [openInstruction, setOpenInstruction] = useState<Record<string, boolean>>({})
  // Faculty roles are declared on a ROLE SET (outside the section) — Jul 1 PCE constraint.
  // A set picks one OR multiple roles, then owns its own sections + questions: one role →
  // role-specific questions, multiple roles → shared questions, add a set for the next case.
  const [rolePickerSetId, setRolePickerSetId] = useState<string | null>(null)
  const [roleSearch, setRoleSearch] = useState('')


  const questionDragInfo = useRef<{ sectionId: string; index: number } | null>(null)

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center" style={{ minHeight: 240 }}>
        <i className="fa-light fa-circle-exclamation text-4xl text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-medium">Template not found</h1>
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

  // Aspect rail metadata (Jun 30 PCE meeting — vertical tabs with info + counts)
  const ASPECT_INFO: Record<string, string> = {
    course_content: 'Evaluates the course itself — asked once per course.',
    faculty:        'Evaluates teaching staff — sections group into role sets that evaluate one or more roles.',
    general:        'Evaluates the program overall — asked once per evaluation.',
  }
  const aspectCounts = (key: string) => {
    const secs = sections.filter(s => s.subjectKey === key)
    return { sections: secs.length, questions: secs.reduce((n, s) => n + s.questions.length, 0) }
  }

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

  // Roles live on the SET, not the section (Jul 1 constraint).
  const facultyRoleSets = t.facultyRoleSets ?? []
  function toggleRoleSetRole(set: PceTemplateRoleSet, roleKey: string) {
    const cur = set.roles ?? []
    updateFacultyRoleSetRoles(t.id, set.id, cur.includes(roleKey) ? cur.filter(r => r !== roleKey) : [...cur, roleKey])
  }
  function handleAddRoleSet() {
    const newId = `rs-${Date.now()}`
    addFacultyRoleSet(t.id, newId)
    setRolePickerSetId(newId) // open the role picker straight away so the user picks roles first
    return newId
  }

  // Sequential "stops" for the tabs/guided variants — Course, each faculty
  // role set as its own first-class stop (a role, not a "role set", drives
  // the sequence), then General.
  const builderStops: { key: string; label: string; subjectKey: string; roleSetId?: string }[] = [
    { key: 'course', label: 'Course', subjectKey: 'course_content' },
    ...facultyRoleSets.map(set => ({
      key: `stop-${set.id}`,
      label: set.roles.length ? `Faculty · ${set.roles.map(ROLE_LABEL).join(', ')}` : 'Faculty · pick roles',
      subjectKey: 'faculty',
      roleSetId: set.id,
    })),
    { key: 'general', label: 'General', subjectKey: 'general' },
  ]
  const stopSections = (stop: { subjectKey: string; roleSetId?: string }) =>
    sections.filter(s => s.subjectKey === stop.subjectKey && (stop.subjectKey !== 'faculty' || s.roleSetId === stop.roleSetId))
  const stopQuestionCount = (stop: { subjectKey: string; roleSetId?: string }) =>
    stopSections(stop).reduce((n, s) => n + s.questions.length, 0)
  const activeStopIdx = Math.max(0, builderStops.findIndex(s => s.key === activeStop))
  const curStop = builderStops[activeStopIdx]
  const handleAddRoleStop = () => {
    const newId = handleAddRoleSet()
    setActiveStop(`stop-${newId}`)
  }

  function handleAddSection(subjectKey?: string, roleSetId?: string): string | undefined {
    const key = subjectKey ?? (isProgrammatic ? 'course_content' : activeGroup)
    if (!key) return undefined
    const newId = `sec-${Date.now()}`
    addTemplateSection(t.id, { subjectKey: key, title: 'Untitled Section', questions: [], roleSetId }, newId)
    setEditingSectionId(newId)
    setEditingSectionTitle('Untitled Section')
    setClosedSectionIds(prev => { const n = new Set(prev); n.delete(newId); return n })
    return newId
  }

  // ── Document import — insert extracted sections + questions into a tab ───────
  function openImport(subjectKey: string, roleSetId?: string) {
    const label = subjectGroups.find(g => g.key === subjectKey)?.label ?? 'this tab'
    setImportCtx({ subjectKey, roleSetId, label })
  }
  function handleImportDocument(doc: TemplateImportDoc) {
    if (!importCtx) return
    const now = Date.now()
    doc.sections.forEach((sec, si) => {
      const questions: TemplateQuestion[] = sec.questions.map((q, qi) => ({
        id: `q-imp-${now}-${si}-${qi}`, text: q.text, answerType: q.answerType, choices: q.choices, order: qi,
      }))
      addTemplateSection(
        t.id,
        { subjectKey: importCtx.subjectKey, title: sec.title, questions, roleSetId: importCtx.roleSetId },
        `sec-imp-${now}-${si}`,
      )
    })
    setImportedBanner({
      file: doc.name,
      sections: doc.sections.length,
      questions: doc.sections.reduce((n, s) => n + s.questions.length, 0),
    })
    setImportCtx(null)
  }
  // Upload-to-generate — a distinct entry point (not a Fascia "Add section"
  // action), so it sits ABOVE the section list, scoped to the active aspect.
  const uploadDocAffordance = (subjectKey: string, roleSetId?: string) => (
    <div
      className="flex items-center gap-3 rounded-lg border border-dashed border-border"
      style={{ padding: '12px 14px' }}
    >
      <i className="fa-light fa-cloud-arrow-up" aria-hidden="true" style={{ fontSize: 18, color: 'var(--muted-foreground)' }} />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium">Upload a document</span>
        <span className="text-xs text-muted-foreground">Generate sections and questions automatically — edit them after.</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => { uploadTargetRef.current = { subjectKey, roleSetId }; uploadInputRef.current?.click() }}
      >
        <i className="fa-light fa-arrow-up-from-bracket text-xs" aria-hidden="true" />
        Upload document
      </Button>
    </div>
  )

  function handleAddQuestion(sectionId: string, type: AnswerType) {
    const newId = `q-${Date.now()}`
    addSectionQuestion(t.id, sectionId, 'Untitled Question', type, undefined, newId)
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

  // ── Role picker — checkmark list, multi-select (operates on a role SET) ─────
  function renderRolePickerContent(set: PceTemplateRoleSet) {
    const selected = new Set(set.roles ?? [])
    const allRoles = [...FACULTY_ROLE_OPTIONS].sort((a, b) => a.label.localeCompare(b.label))
    const filtered = roleSearch
      ? allRoles.filter(s => s.label.toLowerCase().includes(roleSearch.toLowerCase()))
      : allRoles

    function toggleRole(roleKey: string) {
      toggleRoleSetRole(set, roleKey)
    }

    return (
      <Command shouldFilter={false} className="[&_[data-slot=input-group]]:bg-background [&_[data-slot=input-group]]:border-border/60">
        <CommandInput
          placeholder="Search roles…"
          value={roleSearch}
          onValueChange={setRoleSearch}
        />
        <CommandList>
          {filtered.length === 0 && (
            <CommandEmpty>No roles found.</CommandEmpty>
          )}
          {filtered.length > 0 && (
            <CommandGroup>
              {filtered.map(s => {
                const checked = selected.has(s.key)
                return (
                  <CommandItem key={s.key} value={s.key} onSelect={() => toggleRole(s.key)} aria-selected={checked}>
                    {/* Non-interactive decorative checkbox — avoids nested-interactive WCAG violation.
                        CommandItem (role="option") handles all selection semantics. */}
                    <span
                      className="shrink-0 size-3.5 rounded-sm border flex items-center justify-center"
                      style={{
                        borderColor: checked ? 'var(--primary)' : 'var(--border-control-35)',
                        background: checked ? 'var(--primary)' : 'transparent',
                      }}
                      aria-hidden="true"
                    >
                      {checked && <i className="fa-solid fa-check text-[9px]" style={{ color: 'var(--primary-foreground)' }} aria-hidden="true" />}
                    </span>
                    <span className="flex-1 ml-2 truncate">{s.label}</span>
                  </CommandItem>
                )
              })}
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
        {/* Section header — anchor target for the canvas outline rail (small
            element, not the tall card, so scroll-spy tracks what's in view) */}
        <div
          id={`sec-${sec.id}`}
          className="flex items-center gap-2"
          style={{
            background: 'var(--muted)',
            padding: '10px 14px',
            borderBottom: isOpen ? '1px solid var(--border)' : 'none',
            scrollMarginTop: 12,
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
                className="h-7 text-sm font-semibold bg-transparent border-0 border-b border-transparent focus-visible:border-foreground focus-visible:ring-ring focus-visible:ring-offset-0 rounded-none shadow-none px-0"
              />
            ) : (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Rename section ${sec.title}`}
                className="text-sm font-semibold truncate cursor-text block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={e => {
                  e.stopPropagation()
                  setEditingSectionTitle(sec.title)
                  setEditingSectionId(sec.id)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    setEditingSectionTitle(sec.title)
                    setEditingSectionId(sec.id)
                  }
                }}
              >
                {sec.title}
              </span>
            )}
          </div>

          <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--muted-foreground)' }}>
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
              // Aspect stamp — cards are self-identifying mid-scroll (which
              // evaluation the question belongs to). Faculty adds the set's roles.
              const stampGroup = subjectGroups.find(g => g.key === sec.subjectKey)?.label
              const stampRoles = sec.subjectKey === 'faculty' && sec.roleSetId
                ? (facultyRoleSets.find(rs => rs.id === sec.roleSetId)?.roles ?? []).map(ROLE_LABEL).join(', ')
                : ''
              const cardStamp = isProgrammatic || !stampGroup ? '' : stampRoles ? `${stampGroup} — ${stampRoles}` : stampGroup
              return (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => handleQDragStart(sec.id, qIndex)}
                  onDragOver={e => handleQDragOver(e, sec.id, qIndex)}
                  onDragEnd={handleQDragEnd}
                  className="group relative rounded-lg border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  style={{
                    background: 'var(--muted)',
                    borderColor: isSelected ? 'var(--foreground)' : 'var(--border)',
                    outline: isSelected ? '1px solid var(--foreground)' : 'none',
                  }}
                  tabIndex={0}
                  onClick={() => setSelectedQuestion({ sectionId: sec.id, questionId: q.id })}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                      e.preventDefault()
                      setSelectedQuestion({ sectionId: sec.id, questionId: q.id })
                    }
                  }}
                >
                  {/* Question text leads the card */}
                  <div className="px-4 pt-3">
                    <span className="text-sm font-semibold">
                      {q.text || <span className="font-normal text-muted-foreground">Untitled Question</span>}
                    </span>
                  </div>
                  {/* Meta line — type · aspect stamp */}
                  <div className="px-4 pt-1 pb-3">
                    <span className="text-xs text-muted-foreground">
                      {qTypeLabel(q.answerType)}{cardStamp ? ` · ${cardStamp}` : ''}
                    </span>
                  </div>
                  {/* Actions — overlay so the card reserves no space at rest;
                      focus-within keeps them reachable by keyboard */}
                  <div
                    className="absolute flex items-center gap-0.5 rounded-lg opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                    style={{ top: 4, right: 8, background: 'var(--muted)' }}
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
                      <i className="fa-light fa-trash text-xs text-destructive" aria-hidden="true" />
                    </Button>
                    <div
                      style={{ cursor: 'grab' }}
                      className="shrink-0 text-muted-foreground flex items-center"
                    >
                      <DragHandleGripIcon />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add question — dropdown to pick type */}
            <div className="flex justify-center pt-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  {/* Outline, not filled — a repeated per-section action must not
                      outrank the page-level actions (P3). */}
                  <Button variant="outline" size="sm" className="font-semibold">
                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                    Add question
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" sideOffset={6}>
                  {Q_TYPE_GROUPS.map((g, gi) => (
                    <div key={g.label}>
                      {gi > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{g.label}</DropdownMenuLabel>
                      {g.options.map(o => (
                        <DropdownMenuItem key={o.value} onClick={() => handleAddQuestion(sec.id, o.value)}>
                          <i className={`fa-light ${o.icon}`} aria-hidden="true" />
                          {o.label}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Opening-instruction — one quiet text line (Zoom-builder pattern): a text
  // affordance when empty, the instruction text itself when filled; the editor
  // expands on demand. Chrome demoted after the Jul 21 crowding review.
  function renderAspectInstruction(key: string) {
    const aspectLabel = subjectGroups.find(g => g.key === key)?.label
    const instr = aspectInstructions[key]
    const summary = instr?.title || instr?.text
    const open = openInstruction[key] ?? false
    if (!open) {
      return (
        <Button
          variant="ghost"
          size="xs"
          className="w-fit -ms-2 text-muted-foreground font-normal"
          onClick={() => setOpenInstruction(p => ({ ...p, [key]: true }))}
        >
          <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
          {summary ? (
            <span className="truncate" style={{ maxWidth: 420 }}>Opening instruction · {summary}</span>
          ) : (
            'Add opening instruction'
          )}
        </Button>
      )
    }
    return (
      <div className="rounded-lg border border-border flex flex-col gap-2" style={{ padding: '10px 12px', background: 'var(--card)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Opening instruction — shown to students at the start of {aspectLabel}
          </span>
          <Button variant="ghost" size="icon-xs" aria-label="Collapse opening instruction"
            onClick={() => setOpenInstruction(p => ({ ...p, [key]: false }))}>
            <i className="fa-light fa-chevron-up text-xs" aria-hidden="true" />
          </Button>
        </div>
        <Input
          value={aspectInstructions[key]?.title ?? ''}
          onChange={e => setAspectInstruction(key, { title: e.target.value })}
          placeholder="Title (optional) — e.g. About this section"
          className="h-8 text-sm"
          aria-label={`Opening instruction title for ${key}`}
        />
        <Textarea
          value={aspectInstructions[key]?.text ?? ''}
          onChange={e => setAspectInstruction(key, { text: e.target.value })}
          placeholder="Instruction shown to students before this section's questions…"
          rows={2}
          className="text-sm"
          style={{ resize: 'none' }}
          aria-label={`Opening instruction text for ${key}`}
        />
      </div>
    )
  }

  // Role-set header (Evaluating + role chips + picker + actions) — shared by the
  // full aspect body and the focus variant's compact section list.
  function renderRoleSetHeader(set: PceTemplateRoleSet) {
    return (
      <div id={`roleset-${set.id}`} className="flex items-start gap-3"
        style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', scrollMarginTop: 12 }}>
        <span className="text-xs font-medium shrink-0" style={{ paddingTop: 6 }}>Evaluating</span>
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {set.roles.length === 0 ? (
            <span className="text-xs text-muted-foreground" style={{ paddingTop: 5 }}>Pick one or more roles</span>
          ) : set.roles.map(roleKey => {
            const label = ROLE_LABEL(roleKey)
            return (
              <span key={roleKey} className="inline-flex items-center gap-1 text-xs font-medium rounded-full"
                style={{ background: 'var(--muted)', color: 'var(--foreground)', padding: '2px 4px 2px 10px' }}>
                {label}
                <Button variant="ghost" size="icon-xs" aria-label={`Remove ${label}`}
                  className="opacity-50 hover:opacity-100" onClick={() => toggleRoleSetRole(set, roleKey)}>
                  <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                </Button>
              </span>
            )
          })}
        </div>
        <Popover open={rolePickerSetId === set.id}
          onOpenChange={open => { setRolePickerSetId(open ? set.id : null); if (!open) setRoleSearch('') }}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="xs" className="shrink-0">
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add role
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-72" align="end" sideOffset={8} aria-label="Add role">
            {renderRolePickerContent(set)}
          </PopoverContent>
        </Popover>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Role set actions" className="shrink-0">
              <i className="fa-regular fa-ellipsis text-xs" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => { uploadTargetRef.current = { subjectKey: 'faculty', roleSetId: set.id }; uploadInputRef.current?.click() }}>
              <i className="fa-light fa-sparkles" aria-hidden="true" /> Generate from document
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => removeFacultyRoleSet(t.id, set.id)}>
              <i className="fa-light fa-trash" aria-hidden="true" /> Remove role set
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Decision gate for an empty stop (tabs/guided variants) — upload OR build
  // manually, one choice on screen (Monil Jul 21: "one decision point is
  // taken and done").
  function renderStopGate(stop: { subjectKey: string; roleSetId?: string }) {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Button
          variant="outline"
          className="h-auto flex-col items-center gap-1"
          style={{ paddingBlock: 24 }}
          onClick={() => { uploadTargetRef.current = { subjectKey: stop.subjectKey, roleSetId: stop.roleSetId }; uploadInputRef.current?.click() }}
        >
          <i className="fa-light fa-sparkles text-base" aria-hidden="true" />
          <span className="text-sm font-semibold">Upload a document</span>
          <span className="text-xs text-muted-foreground font-normal whitespace-normal">Generate sections and questions automatically — edit them after</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col items-center gap-1"
          style={{ paddingBlock: 24 }}
          onClick={() => handleAddSection(stop.subjectKey, stop.roleSetId)}
        >
          <i className="fa-light fa-plus text-base" aria-hidden="true" />
          <span className="text-sm font-semibold">Build manually</span>
          <span className="text-xs text-muted-foreground font-normal whitespace-normal">Add sections and questions yourself</span>
        </Button>
      </div>
    )
  }

  // One stop's canvas (tabs/guided variants) — role chips for a faculty stop,
  // then the standard section cards or the decision gate when empty.
  function renderStopStage(stop: { subjectKey: string; roleSetId?: string }) {
    const secs = stopSections(stop)
    const set = stop.subjectKey === 'faculty' ? facultyRoleSets.find(rs => rs.id === stop.roleSetId) : undefined
    return (
      <div className="flex flex-col gap-3">
        {set && renderRoleSetHeader(set)}
        {secs.length === 0 ? renderStopGate(stop) : (
          <>
            {secs.map(sec => renderSectionCard(sec))}
            <div className="flex items-center justify-center">
              <Button variant="link" size="sm" className="font-semibold"
                onClick={() => handleAddSection(stop.subjectKey, stop.roleSetId)}>
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add section
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Prev/next between stops (outline — the wizard footer below owns the
  // single filled CTA).
  function renderStopNav() {
    const prev = activeStopIdx > 0 ? builderStops[activeStopIdx - 1] : null
    const next = activeStopIdx < builderStops.length - 1 ? builderStops[activeStopIdx + 1] : null
    return (
      <div className="flex items-center justify-between" style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        {prev ? (
          <Button variant="outline" size="sm" onClick={() => setActiveStop(prev.key)}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            {prev.label}
          </Button>
        ) : <span />}
        {next ? (
          <Button variant="outline" size="sm" onClick={() => setActiveStop(next.key)}>
            Next: {next.label}
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">All aspects covered — continue to Review</span>
        )}
      </div>
    )
  }

  // Compact upload entry — "Generate from document" as a header action instead
  // of the dashed panel (bands + minimal variants).
  const generateFromDocButton = (subjectKey: string, roleSetId?: string) => (
    <Button
      variant="outline"
      size="xs"
      className="shrink-0"
      onClick={() => { uploadTargetRef.current = { subjectKey, roleSetId }; uploadInputRef.current?.click() }}
    >
      <i className="fa-light fa-sparkles text-xs" aria-hidden="true" />
      Generate from document
    </Button>
  )

  // ── Preview variant — live student-facing rendering of the template ─────────
  function renderPreviewQuestion(q: TemplateQuestion, num: number) {
    const isSel = selectedQuestion?.questionId === q.id
    if (q.answerType === 'title') {
      return <h4 key={q.id} className="text-sm font-semibold" style={{ paddingTop: 4 }}>{q.text || 'Untitled title'}</h4>
    }
    const choiceIcon = q.answerType === 'multiple_choice' ? 'fa-square' : 'fa-circle'
    return (
      <div key={q.id} className="flex flex-col gap-2 rounded-md"
        style={{ padding: '8px 10px', outline: isSel ? '2px solid var(--ring)' : 'none', outlineOffset: 2 }}>
        <span className="text-sm font-medium">
          {num}. {q.text || <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>Untitled Question</span>}
        </span>
        {q.answerType === 'likert' && (
          <div className="flex flex-col gap-1" aria-hidden="true">
            <div className="flex items-center gap-1.5">
              {EVAL_DEFAULT_SCALE.labels.map((_, i) => (
                <div key={i} className="flex-1 h-8 rounded-md border border-border flex items-center justify-center text-sm tabular-nums"
                  style={{ background: 'var(--background)' }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{EVAL_DEFAULT_SCALE.labels[0]}</span>
              <span>{EVAL_DEFAULT_SCALE.labels[EVAL_DEFAULT_SCALE.labels.length - 1]}</span>
            </div>
          </div>
        )}
        {q.answerType === 'free_text' && (
          <div className="rounded-md border border-border text-sm"
            style={{ minHeight: 60, padding: '8px 10px', background: 'var(--background)', color: 'var(--muted-foreground)' }}>
            Type your answer…
          </div>
        )}
        {CHOICE_TYPES.has(q.answerType) && q.answerType !== 'select_dropdown' && (
          <div className="flex flex-col gap-1.5" aria-hidden="true">
            {(q.choices?.length ? q.choices : ['Option 1', 'Option 2']).map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <i className={`fa-light ${choiceIcon} text-xs text-muted-foreground`} aria-hidden="true" />{c}
              </div>
            ))}
          </div>
        )}
        {q.answerType === 'select_dropdown' && (
          <div className="flex items-center justify-between rounded-md border border-border text-sm"
            style={{ height: 34, padding: '0 10px', background: 'var(--background)', color: 'var(--muted-foreground)' }} aria-hidden="true">
            Select an option<i className="fa-light fa-caret-down" aria-hidden="true" />
          </div>
        )}
        {q.answerType === 'number' && (
          <div className="rounded-md border border-border text-sm flex items-center"
            style={{ height: 34, padding: '0 10px', maxWidth: 180, background: 'var(--background)', color: 'var(--muted-foreground)' }} aria-hidden="true">
            Enter a number
          </div>
        )}
        {q.answerType === 'date_picker' && (
          <div className="rounded-md border border-border text-sm flex items-center justify-between"
            style={{ height: 34, padding: '0 10px', maxWidth: 220, background: 'var(--background)', color: 'var(--muted-foreground)' }} aria-hidden="true">
            Select a date<i className="fa-light fa-calendar" aria-hidden="true" />
          </div>
        )}
      </div>
    )
  }

  function renderStudentPreview() {
    const aspectBlocks = subjectGroups
      .map(g => {
        const groupSections = g.key === 'faculty'
          ? facultyRoleSets.flatMap(set => sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id))
          : sections.filter(s => s.subjectKey === g.key)
        return { g, groupSections }
      })
      .filter(b => b.groupSections.length > 0 || aspectInstructions[b.g.key]?.title || aspectInstructions[b.g.key]?.text)
    return (
      <aside
        aria-label="Student preview"
        className="hidden lg:flex flex-col shrink-0 sticky self-start rounded-xl border border-border overflow-hidden"
        style={{ top: 56, width: '44%', maxWidth: 560, height: 'calc(100vh - 136px)', background: 'var(--muted)' }}
      >
        <div className="flex items-center justify-between shrink-0" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-medium text-muted-foreground">
            <i className="fa-light fa-eye me-1.5" aria-hidden="true" />Student preview
          </span>
          <span className="text-xs text-muted-foreground">Updates live as you build</span>
        </div>
        {/* Focusable scroll region — the preview content is decorative, so the
            region itself must take keyboard focus to stay scrollable (axe
            scrollable-region-focusable). */}
        <div
          className="flex-1 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ padding: 14 }}
          tabIndex={0}
          role="region"
          aria-label="Student preview content"
        >
          <div className="rounded-lg border border-border flex flex-col gap-6" style={{ background: 'var(--background)', padding: '22px 22px 30px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 400, lineHeight: 1.25 }}>
              {t.name || 'Untitled template'}
            </h3>
            {aspectBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add sections and questions on the left to see what students will see here.
              </p>
            ) : (
              aspectBlocks.map(({ g, groupSections }) => {
                let n = 0
                const instr = aspectInstructions[g.key]
                return (
                  <div key={g.key} className="flex flex-col gap-3">
                    {(instr?.title || instr?.text) && (
                      <div className="flex flex-col gap-0.5">
                        {instr?.title && <h4 className="text-sm font-semibold">{instr.title}</h4>}
                        {instr?.text && <p className="text-sm text-muted-foreground">{instr.text}</p>}
                      </div>
                    )}
                    {groupSections.map(sec => (
                      <div key={sec.id} className="flex flex-col gap-2">
                        <h4 className="text-sm font-semibold" style={{ paddingTop: 4 }}>{sec.title}</h4>
                        {sec.questions.map(q => {
                          if (q.answerType === 'title') return renderPreviewQuestion(q, 0)
                          n += 1
                          return renderPreviewQuestion(q, n)
                        })}
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </aside>
    )
  }

  // ── Canvas-style per-aspect builder body (document + preview variants) ──────
  // Copy of the rail variant's inline aspect content parameterized by aspect key
  // (kept verbatim apart from anchors so the two layouts compare honestly —
  // delete the losing variant's copy once a direction is picked).
  function renderAspectBody(key: string) {
    return (
      <>
        {renderAspectInstruction(key)}

        {key === 'faculty' ? (
          /* Role sets — roles declared OUTSIDE the section (Jul 1 constraint).
             Each set picks one/multiple roles then owns its own sections. */
          <>
            {facultyRoleSets.map(set => {
              const setSections = sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id)
              return (
                <div key={set.id} className="rounded-lg border border-border overflow-hidden"
                  style={{ background: 'var(--background)' }}>
                  {renderRoleSetHeader(set)}
                  {/* Sections owned by this set — upload is a quiet text action,
                      not a panel (Jul 21 crowding review) */}
                  <div className="flex flex-col gap-3" style={{ padding: '12px' }}>
                    {setSections.map(sec => renderSectionCard(sec))}
                    <div className="flex items-center justify-center gap-1" style={{ paddingTop: setSections.length ? 2 : 6 }}>
                      <Button variant="link" size="sm" onClick={() => handleAddSection('faculty', set.id)} className="font-semibold">
                        <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add section
                      </Button>
                      <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
                      <Button variant="ghost" size="sm" className="text-muted-foreground font-normal"
                        onClick={() => { uploadTargetRef.current = { subjectKey: 'faculty', roleSetId: set.id }; uploadInputRef.current?.click() }}>
                        <i className="fa-light fa-sparkles text-xs" aria-hidden="true" />
                        Generate from document
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
              <Button variant="outline" size="sm" onClick={handleAddRoleSet}>
                <i className="fa-light fa-user-group text-xs" aria-hidden="true" />Add role set
              </Button>
            </div>
          </>
        ) : (() => {
          const groupSections = sections.filter(s => s.subjectKey === key)
          const actionsRow = (
            <div className="flex items-center justify-center gap-1" style={{ paddingTop: 4 }}>
              <Button variant="link" size="sm" onClick={() => handleAddSection(key)} className="font-semibold">
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add section
              </Button>
              <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
              <Button variant="ghost" size="sm" className="text-muted-foreground font-normal"
                onClick={() => { uploadTargetRef.current = { subjectKey: key }; uploadInputRef.current?.click() }}>
                <i className="fa-light fa-sparkles text-xs" aria-hidden="true" />
                Generate from document
              </Button>
            </div>
          )
          if (groupSections.length === 0) {
            return (
              <div
                className="flex items-center justify-center rounded-lg border border-dashed"
                style={{ padding: '20px 16px', borderColor: 'var(--border)' }}
              >
                {actionsRow}
              </div>
            )
          }
          return (
            <>
              {groupSections.map(sec => renderSectionCard(sec))}
              {actionsRow}
            </>
          )
        })()}
      </>
    )
  }

  // Template settings — persistent right panel (Airtable/Typeform pattern), shown
  // when no question is selected. Discoverable, not hidden behind Publish.
  function renderTemplateSettings() {
    return (
      <div className="flex flex-col">
        <SettingsSection label="Template name & description"
          hint="How this template is identified in the templates list.">
          <Field orientation="vertical">
            <FieldLabel htmlFor="tmpl-name">Template name</FieldLabel>
            <Input id="tmpl-name" key={t.id} defaultValue={t.name}
              onBlur={e => {
                const v = e.currentTarget.value.trim()
                if (v && v !== t.name) updateTemplate(t.id, { name: v })
                else if (!v) e.currentTarget.value = t.name
              }}
              placeholder="Untitled template" className="h-9 text-sm" />
          </Field>
          <Field orientation="vertical">
            <FieldLabel htmlFor="tmpl-desc">Description</FieldLabel>
            <Textarea id="tmpl-desc" key={`${t.id}-desc`} defaultValue={t.description ?? ''}
              onBlur={e => {
                const v = e.currentTarget.value.trim()
                if (v !== (t.description ?? '')) updateTemplate(t.id, { description: v || undefined })
              }}
              placeholder="What is this template for?" rows={3} className="text-sm" style={{ resize: 'none' }} />
          </Field>
        </SettingsSection>

        {/* Course type — CE templates only (Monil 2026-07-10: restored; the
            wizard auto-assigns templates to matching courses). Legacy
            courseType mirrors the pick so bulk-assign matching keeps working. */}
        {!isProgrammatic && (
          <SettingsSection label="Course type"
            hint="Optional — matches this template to courses of the same type.">
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Course type (optional)">
              {(['classroom', 'practice', 'lab'] as DeliveryMode[]).map((m) => {
                const active = t.deliveryMode === m
                return (
                  <Button
                    key={m}
                    type="button"
                    variant="outline"
                    size="default"
                    aria-pressed={active}
                    className={active ? 'border-foreground bg-muted' : ''}
                    onClick={() => {
                      if (active) {
                        updateTemplate(t.id, { deliveryMode: undefined, courseType: undefined, isDefaultForType: false })
                      } else {
                        updateTemplate(t.id, {
                          deliveryMode: m,
                          courseType: m === 'practice' ? 'clinical' : 'didactic',
                        })
                      }
                    }}
                  >
                    {COURSE_TYPE_FULL_LABEL[m]}
                  </Button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t.deliveryMode
                ? `Applies to ${COURSE_TYPE_FULL_LABEL[t.deliveryMode].toLowerCase()} courses.`
                : 'No type selected — template will apply to all course types.'}
            </p>
            <div className="flex items-center gap-3">
              {/* DS ToggleSwitch has no disabled prop (checked/onChange/id only) —
                  disabled state expressed on a wrapper; the handler stays guarded. */}
              <span
                className={!t.deliveryMode ? 'opacity-50 pointer-events-none' : ''}
                aria-disabled={!t.deliveryMode || undefined}
              >
                <ToggleSwitch
                  id="tmpl-default-for-type"
                  checked={!!t.isDefaultForType}
                  onChange={(v) => {
                    if (t.deliveryMode) updateTemplate(t.id, { isDefaultForType: v })
                  }}
                />
              </span>
              <label
                htmlFor="tmpl-default-for-type"
                className={`text-sm cursor-pointer ${!t.deliveryMode ? 'text-muted-foreground' : ''}`}
              >
                Mark as default for this course type
              </label>
            </div>
          </SettingsSection>
        )}

        {isProgrammatic && (
        <SettingsSection label="Survey type"
          hint="What this survey is for — determines how it's used across the program.">
          <RadioGroup
            value={t.surveyPurpose ?? ''}
            onValueChange={v => updateTemplate(t.id, { surveyPurpose: v as SurveyPurpose })}
            className="grid grid-cols-2 gap-2"
            aria-label="Survey type"
          >
            {SURVEY_TYPE_OPTIONS.map(opt => {
              const active = t.surveyPurpose === opt.value
              return (
                <Label key={opt.value} htmlFor={`st-${opt.value}`}
                  className="flex items-start gap-2.5 rounded-lg border cursor-pointer transition-colors"
                  style={{ padding: '12px', borderColor: active ? 'var(--foreground)' : 'var(--border)', background: active ? 'var(--muted)' : 'transparent' }}>
                  <RadioGroupItem value={opt.value} id={`st-${opt.value}`} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </span>
                </Label>
              )
            })}
          </RadioGroup>
        </SettingsSection>
        )}

        {isProgrammatic && (
        <SettingsSection label="Access"
          hint="Who in your program can find and reuse this template.">
          <RadioGroup
            value={t.access ?? 'program'}
            onValueChange={v => updateTemplate(t.id, { access: v as 'program' | 'private' })}
            className="flex flex-col gap-2"
            aria-label="Access"
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem value="program" id="access-program" className="mt-0.5" />
              <div>
                <Label htmlFor="access-program" className="text-sm font-normal cursor-pointer">Allow access to program</Label>
                <p className="text-xs text-muted-foreground">Any admin or coordinator in the program can find and use this template.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="private" id="access-private" className="mt-0.5" />
              <div>
                <Label htmlFor="access-private" className="text-sm font-normal cursor-pointer">Private</Label>
                <p className="text-xs text-muted-foreground">Only you can see and use this template.</p>
              </div>
            </div>
          </RadioGroup>
        </SettingsSection>
        )}

        <SettingsSection label="Branding"
          hint="Optional images students see on the evaluation and in invitation emails.">
          <ImageUploadField label="Cover image" description="Wide banner shown at the top of the student evaluation."
            boxClassName="w-full max-w-md aspect-[4/1]" recommend="1600×400px"
            value={coverImage} onChange={setCoverImage} />
          <ImageUploadField label="University logo" description="Appears in the header and invitation emails."
            boxClassName="w-full max-w-md aspect-[4/1]" recommend="400×400px"
            value={universityLogo} onChange={setUniversityLogo} />
        </SettingsSection>
      </div>
    )
  }

  // ── Review step — read-only summary before publishing ──────────────────────
  function renderReview() {
    const surveyTypeLabel = SURVEY_TYPE_OPTIONS.find(o => o.value === t.surveyPurpose)?.label
    const ReviewRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div className="flex items-start gap-4 py-2.5 border-b border-border last:border-0">
        <span className="text-xs text-muted-foreground shrink-0" style={{ width: 130, paddingTop: 1 }}>{label}</span>
        <div className="flex-1 min-w-0 text-sm">{children}</div>
      </div>
    )
    const SummaryCard = ({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) => (
      <section className="rounded-lg border border-border overflow-hidden" style={{ background: 'var(--card)' }}>
        <div className="flex items-center gap-2" style={{ background: 'var(--muted)', padding: '9px 14px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold flex-1">{title}</h3>
          <Button variant="ghost" size="xs" onClick={onEdit}>
            <i className="fa-light fa-pen text-xs" aria-hidden="true" />Edit
          </Button>
        </div>
        <div style={{ padding: '4px 14px 8px' }}>{children}</div>
      </section>
    )

    return (
      <div style={{ maxWidth: 720 }} className="flex flex-col gap-5 mx-auto">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Review &amp; publish</h2>
          <p className="text-xs text-muted-foreground">Check the template is complete, then publish. You can go back to any step to make changes.</p>
        </div>

        {!canPublish && (
          <LocalBanner variant="warning">
            Add at least one section with a question before you can publish this template.
          </LocalBanner>
        )}

        {/* Details */}
        <SummaryCard title="Template settings" onEdit={() => goToStep('settings')}>
          <ReviewRow label="Name">{t.name || <span className="text-muted-foreground">Untitled template</span>}</ReviewRow>
          <ReviewRow label="Description">{t.description || <span className="text-muted-foreground">—</span>}</ReviewRow>
          {!isProgrammatic && (
            <ReviewRow label="Course type">
              {t.deliveryMode
                ? `${COURSE_TYPE_FULL_LABEL[t.deliveryMode]}${t.isDefaultForType ? ' · default for this type' : ''}`
                : <span className="text-muted-foreground">All course types</span>}
            </ReviewRow>
          )}
          {isProgrammatic && (
            <ReviewRow label="Survey type">{surveyTypeLabel ?? <span className="text-muted-foreground">Not set</span>}</ReviewRow>
          )}
          {isProgrammatic && (
            <ReviewRow label="Access">{(t.access ?? 'program') === 'private' ? 'Private — only you' : 'Program — shared with admins & coordinators'}</ReviewRow>
          )}
          <ReviewRow label="Cover image">{coverImage ? 'Added' : <span className="text-muted-foreground">Not added</span>}</ReviewRow>
          <ReviewRow label="University logo">{universityLogo ? 'Added' : <span className="text-muted-foreground">Not added</span>}</ReviewRow>
        </SummaryCard>

        {/* Structure */}
        <SummaryCard title={`Questions · ${totalQuestions} across ${sections.length} section${sections.length === 1 ? '' : 's'}`} onEdit={() => goToStep('builder')}>
          {subjectGroups.map(g => {
            if (g.key === 'faculty') {
              const setsForG = facultyRoleSets
              return (
                <ReviewRow key={g.key} label={g.label}>
                  {setsForG.length === 0 ? (
                    <span className="text-muted-foreground">No role sets</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {setsForG.map(set => {
                        const setSecs = sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id)
                        const qCount = setSecs.reduce((n, s) => n + s.questions.length, 0)
                        const roleText = set.roles.length ? set.roles.map(ROLE_LABEL).join(', ') : 'No roles selected'
                        return (
                          <div key={set.id} className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{roleText}</span>
                            <span className="text-xs text-muted-foreground">{setSecs.length} section{setSecs.length === 1 ? '' : 's'} · {qCount} question{qCount === 1 ? '' : 's'}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ReviewRow>
              )
            }
            const c = aspectCounts(g.key)
            return (
              <ReviewRow key={g.key} label={g.label}>
                {c.sections === 0
                  ? <span className="text-muted-foreground">No sections</span>
                  : <span className="text-xs text-muted-foreground">{c.sections} section{c.sections === 1 ? '' : 's'} · {c.questions} question{c.questions === 1 ? '' : 's'}</span>}
              </ReviewRow>
            )
          })}
        </SummaryCard>
      </div>
    )
  }

  return (
    /* Non-rail variants scroll at the window level (sticky rail/panel/footer) —
       an overflow-hidden ancestor would break position:sticky against the window. */
    <div className={`flex flex-col flex-1 ${variant === 'rail' || variant === 'guided' ? 'overflow-hidden' : ''}`}>
      {!embedded && (
        <SiteHeader
          breadcrumbs={[{ label: 'Templates', href: backHref }]}
          title={t.name}
        />
      )}

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
            ? <ListHubStatusBadge label="Approved" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
            : <ListHubStatusBadge label="Draft" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-pen-to-square" />
          }
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Published templates edit via Unpublish → edit → republish; offering
                "Save draft" beside an Approved badge tells two stories at once. */}
            {t.status !== 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
              >
                Save draft
              </Button>
            )}
            {/* Publish moved into the wizard's Review step; Unpublish stays here for live templates */}
            {t.status === 'active' && (
              <Button variant="outline" size="sm" onClick={() => updateTemplate(t.id, { status: 'draft' })}>
                Unpublish
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={wizardStep} className="flex flex-col flex-1 min-h-0">
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={maxStepReached}
          onStepClick={goToStepNum}
          ariaLabel="Template builder steps"
          steps={WIZARD_STEPS.map(s => ({ n: s.n, label: s.label }))}
        />
        <TabsContent value="builder" className="flex-1 min-h-0 flex flex-row m-0">
          {/* Left — section list. Non-rail variants scroll at the window level, so
              they must not sit under an overflow-hidden ancestor (breaks sticky). */}
          <div className={`flex flex-col flex-1 min-h-0 min-w-0 ${variant === 'rail' || variant === 'guided' ? 'overflow-hidden' : ''}`}>
          {importedBanner && (
            <div style={{ padding: '10px 40px 0' }}>
              <LocalBanner variant="success" dismissible onDismiss={() => setImportedBanner(null)}>
Generated {importedBanner.sections} section{importedBanner.sections !== 1 ? 's' : ''} · {importedBanner.questions} question{importedBanner.questions !== 1 ? 's' : ''} from {importedBanner.file}. Review and edit below.
              </LocalBanner>
            </div>
          )}
          {isProgrammatic ? (
            /* Programmatic surveys — flat section list */
            <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
              <div style={{ maxWidth: 720 }} className="flex flex-col gap-4">
                {uploadDocAffordance('course_content')}
                {sections.length === 0 ? (
                  <div className="flex items-center justify-center" style={{ minHeight: 140 }}>
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
          ) : variant === 'bands' ? (
            /* Bands variant — sticky aspect band headers carry identity + actions
               (Adaline / Workable pattern); upload demoted to a band-header
               "Generate from document" action. Section cards are the standard
               builder cards (collapse/expand + in-section Add question unchanged). */
            <div className="flex-1 min-w-0">
              <div className="mx-auto" style={{ maxWidth: 860, padding: '4px 32px 48px' }}>
                {subjectGroups.map(g => {
                  const c = aspectCounts(g.key)
                  const groupSections = sections.filter(s => s.subjectKey === g.key)
                  return (
                    <section key={g.key} aria-labelledby={`ws-aspect-${g.key}-h`} style={{ paddingBottom: 26 }}>
                      {/* Sticky band header — aspect identity + its actions in one line */}
                      <div
                        className="sticky flex items-center gap-3"
                        style={{ top: 48, zIndex: 10, background: 'var(--background)', padding: '10px 0 8px', borderBottom: '1px solid var(--border)' }}
                      >
                        <h2 id={`ws-aspect-${g.key}-h`} className="text-sm font-semibold shrink-0">{g.label}</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-xs" aria-label={`About ${g.label}`} className="text-muted-foreground">
                              <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{ASPECT_INFO[g.key]}</TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground tabular-nums ms-auto shrink-0">
                          {c.sections} section{c.sections !== 1 ? 's' : ''} · {c.questions} question{c.questions !== 1 ? 's' : ''}
                        </span>
                        {g.key !== 'faculty' && generateFromDocButton(g.key)}
                        {g.key === 'faculty' ? (
                          <Button variant="ghost" size="xs" className="shrink-0" onClick={handleAddRoleSet}>
                            <i className="fa-light fa-user-group text-xs" aria-hidden="true" />Add role set
                          </Button>
                        ) : (
                          <Button variant="ghost" size="xs" className="shrink-0" onClick={() => handleAddSection(g.key)}>
                            <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add section
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-3" style={{ paddingTop: 12 }}>
                        {renderAspectInstruction(g.key)}
                        {g.key === 'faculty' ? (
                          facultyRoleSets.length === 0 ? (
                            <p className="text-xs text-muted-foreground" style={{ padding: '10px 0' }}>
                              No role sets yet — add one to start building faculty questions.
                            </p>
                          ) : (
                            facultyRoleSets.map(set => {
                              const setSecs = sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id)
                              return (
                                <div key={set.id} className="flex flex-col gap-3" style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12, marginTop: 8 }}>
                                  {renderRoleSetHeader(set)}
                                  <div className="flex items-center">
                                    {generateFromDocButton('faculty', set.id)}
                                  </div>
                                  {setSecs.length === 0 ? (
                                    <p className="text-xs text-muted-foreground" style={{ padding: '8px 0' }}>No sections yet.</p>
                                  ) : (
                                    setSecs.map(sec => renderSectionCard(sec))
                                  )}
                                  <Button variant="ghost" size="xs" className="text-muted-foreground w-fit"
                                    onClick={() => handleAddSection('faculty', set.id)}>
                                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add section
                                  </Button>
                                </div>
                              )
                            })
                          )
                        ) : groupSections.length === 0 ? (
                          <p className="text-xs text-muted-foreground" style={{ padding: '10px 0' }}>
                            No sections yet — add one or generate from a document.
                          </p>
                        ) : (
                          groupSections.map(sec => renderSectionCard(sec))
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          ) : variant === 'document' ? (
            /* Document variant — the builder reads as the questionnaire itself:
               one centered column, sticky aspect chips for wayfinding (Etsy
               listing-editor / Workable interview-kit pattern), no side rail. */
            <div className="flex-1 min-w-0">
              {/* Sticky aspect chip bar */}
              <div
                className="sticky flex justify-center"
                style={{ top: 48, zIndex: 20, background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2 w-full" style={{ maxWidth: 760, padding: '10px 24px' }} role="group" aria-label="Jump to aspect">
                  {subjectGroups.map(g => {
                    const c = aspectCounts(g.key)
                    const active = docAspect === g.key
                    return (
                      <Button
                        key={g.key}
                        variant="outline"
                        size="sm"
                        aria-pressed={active}
                        className={`rounded-full ${active ? 'border-foreground bg-muted' : ''}`}
                        onClick={() => {
                          document.getElementById(`aspect-${g.key}`)?.scrollIntoView({ behavior: 'auto', block: 'start' })
                          setDocAspect(g.key)
                        }}
                      >
                        {g.label}
                        <span className="text-xs tabular-nums text-muted-foreground">{c.questions}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="mx-auto" style={{ maxWidth: 760, padding: '20px 24px 48px' }}>
                {subjectGroups.map((g, gi) => {
                  const c = aspectCounts(g.key)
                  return (
                    <section
                      key={g.key}
                      aria-labelledby={`doc-aspect-${g.key}-heading`}
                      style={{
                        borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
                        padding: gi > 0 ? '24px 0 32px' : '4px 0 32px',
                      }}
                    >
                      {/* Aspect header — document heading; anchor for the chip bar */}
                      <div id={`aspect-${g.key}`} className="flex items-end justify-between gap-3" style={{ scrollMarginTop: 108 }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h2
                            id={`doc-aspect-${g.key}-heading`}
                            style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400, lineHeight: 1.2 }}
                          >
                            {g.label}
                          </h2>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon-xs" aria-label={`About ${g.label}`} className="text-muted-foreground">
                                <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{ASPECT_INFO[g.key]}</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {c.sections} section{c.sections !== 1 ? 's' : ''} · {c.questions} question{c.questions !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-col gap-4" style={{ paddingTop: 16 }}>
                        {renderAspectBody(g.key)}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          ) : variant === 'preview' ? (
            /* Preview variant — build left, live student-facing preview right
               (Maze / Zoom Surveys pattern): the preview renders real scales,
               choices, and inputs and updates as the template is edited. */
            <div className="flex flex-row gap-6 flex-1 min-h-0" style={{ padding: '20px 32px 48px' }}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col" style={{ maxWidth: 620 }}>
                  {subjectGroups.map((g, gi) => {
                    const c = aspectCounts(g.key)
                    return (
                      <section
                        key={g.key}
                        aria-labelledby={`pv-aspect-${g.key}-h`}
                        style={{ borderTop: gi > 0 ? '1px solid var(--border)' : 'none', padding: gi > 0 ? '20px 0 24px' : '0 0 24px' }}
                      >
                        <div className="flex items-start justify-between gap-3" style={{ paddingBottom: 12 }}>
                          <div className="flex items-center gap-1 min-w-0">
                            <h2 id={`pv-aspect-${g.key}-h`} className="text-base font-semibold">{g.label}</h2>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon-xs" aria-label={`About ${g.label}`} className="text-muted-foreground">
                                  <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{ASPECT_INFO[g.key]}</TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0" style={{ paddingTop: 4 }}>
                            {c.sections} section{c.sections !== 1 ? 's' : ''} · {c.questions} question{c.questions !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-col gap-4">{renderAspectBody(g.key)}</div>
                      </section>
                    )
                  })}
                </div>
              </div>
              {renderStudentPreview()}
            </div>
          ) : variant === 'minimal' ? (
            /* Minimal variant — bare essentials (GitBook-calm): one narrow
               centered column, plain headings, text-only actions, no chips, no
               rails, no dashed upload panels. Standard section cards inside. */
            <div className="flex-1 min-w-0">
              <div className="mx-auto flex flex-col" style={{ maxWidth: 720, padding: '20px 24px 64px' }}>
                {subjectGroups.map((g, gi) => {
                  const c = aspectCounts(g.key)
                  const groupSections = sections.filter(s => s.subjectKey === g.key)
                  const instr = aspectInstructions[g.key]
                  // Instruction editor/summary shows below only when open or
                  // filled; otherwise its trigger sits in the header cluster so
                  // every option lives on ONE line (Jul 21 layout feedback).
                  const instrVisible = (openInstruction[g.key] ?? false) || !!(instr?.title || instr?.text)
                  return (
                    <section
                      key={g.key}
                      aria-labelledby={`mn-aspect-${g.key}-h`}
                      style={{
                        borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
                        padding: gi > 0 ? '24px 0 32px' : '0 0 32px',
                      }}
                    >
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-2" style={{ paddingBottom: 4 }}>
                        <h2
                          id={`mn-aspect-${g.key}-h`}
                          style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400, lineHeight: 1.2 }}
                        >
                          {g.label}
                        </h2>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {c.questions} question{c.questions !== 1 ? 's' : ''}
                        </span>
                        <span className="ms-auto flex items-center flex-wrap gap-1.5">
                          {!instrVisible && (
                            <Button variant="outline" size="xs"
                              onClick={() => setOpenInstruction(p => ({ ...p, [g.key]: true }))}>
                              <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                              Opening instruction
                            </Button>
                          )}
                          {g.key === 'faculty' ? (
                            <Button variant="outline" size="xs" onClick={handleAddRoleSet}>
                              <i className="fa-light fa-user-group text-xs" aria-hidden="true" />
                              Add role set
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" size="xs" onClick={() => handleAddSection(g.key)}>
                                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                                Add section
                              </Button>
                              {/* Secondary actions live behind the ellipsis to keep
                                  the header to one calm row */}
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${g.label}`}>
                                    <i className="fa-regular fa-ellipsis text-xs" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem
                                    onClick={() => { uploadTargetRef.current = { subjectKey: g.key }; uploadInputRef.current?.click() }}>
                                    <i className="fa-light fa-sparkles" aria-hidden="true" /> Generate from document
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </span>
                      </div>
                      {/* Aspect identity line — the three groups are visually identical
                          otherwise, so each must state who/what it evaluates. */}
                      <p className="text-xs text-muted-foreground mb-3">
                        Part {gi + 1} of {subjectGroups.length} · {ASPECT_INFO[g.key]}
                      </p>
                      <div className="flex flex-col gap-3">
                        {instrVisible && renderAspectInstruction(g.key)}
                        {g.key === 'faculty' ? (
                          facultyRoleSets.length === 0 ? (
                            <div className="flex items-center justify-center" style={{ minHeight: 72 }}>
                              <Button variant="link" size="sm" onClick={handleAddRoleSet} className="font-semibold">
                                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                                Add role set
                              </Button>
                            </div>
                          ) : (
                            facultyRoleSets.map(set => {
                              const setSecs = sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id)
                              return (
                                <div key={set.id} className="flex flex-col gap-3">
                                  {renderRoleSetHeader(set)}
                                  {setSecs.map(sec => renderSectionCard(sec))}
                                  {/* Trailing add keeps the set header to one row —
                                      Generate from document lives in the set's ⋯ menu */}
                                  <div className="flex items-center justify-center">
                                    <Button variant="link" size="sm" className="font-semibold"
                                      onClick={() => handleAddSection('faculty', set.id)}>
                                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                                      Add section
                                    </Button>
                                  </div>
                                </div>
                              )
                            })
                          )
                        ) : groupSections.length === 0 ? (
                          <div className="flex items-center justify-center" style={{ minHeight: 72 }}>
                            <Button variant="link" size="sm" onClick={() => handleAddSection(g.key)} className="font-semibold">
                              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                              Add section
                            </Button>
                          </div>
                        ) : (
                          groupSections.map(sec => renderSectionCard(sec))
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          ) : variant === 'columns' ? (
            /* Columns variant — all three aspects side by side as board lanes
               (Hootsuite / Todoist pattern): compare and balance the template
               across audiences at a glance. Standard section cards inside. */
            <div className="flex-1 min-w-0" style={{ padding: '16px 20px 48px' }}>
              <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {subjectGroups.map(g => {
                  const c = aspectCounts(g.key)
                  return (
                    <div key={g.key} className="flex flex-col gap-3 rounded-xl" style={{ background: 'var(--muted)', padding: 12 }}>
                      <div className="flex items-center gap-1" style={{ padding: '2px 2px 0' }}>
                        <h2 className="text-sm font-semibold min-w-0 truncate">{g.label}</h2>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-xs" aria-label={`About ${g.label}`} className="text-muted-foreground">
                              <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{ASPECT_INFO[g.key]}</TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0 ms-auto">
                          {c.sections} section{c.sections !== 1 ? 's' : ''} · {c.questions} question{c.questions !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {renderAspectBody(g.key)}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : variant === 'tabs' ? (
            /* Tabs variant — Monil Jul 21: horizontal aspect tabs, one aspect
               on stage at a time, worked left to right; a faculty role set is
               a first-class tab. Standard section cards inside. */
            <div className="flex-1 min-w-0">
              <div className="mx-auto flex flex-col" style={{ maxWidth: 760, padding: '16px 24px 64px' }}>
                <div className="flex items-end flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div
                    role="tablist"
                    aria-label="Template aspects"
                    className="flex items-end gap-1 flex-wrap"
                    onKeyDown={e => {
                      // APG tablist contract — arrows move between tabs, Tab exits
                      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                      e.preventDefault()
                      const delta = e.key === 'ArrowRight' ? 1 : -1
                      const nextIdx = (activeStopIdx + delta + builderStops.length) % builderStops.length
                      setActiveStop(builderStops[nextIdx].key)
                      const tabs = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')
                      tabs[nextIdx]?.focus()
                    }}
                  >
                    {builderStops.map(stop => {
                      const cur = stop.key === curStop.key
                      const done = stopQuestionCount(stop) > 0
                      return (
                        <Button
                          key={stop.key}
                          role="tab"
                          aria-selected={cur}
                          tabIndex={cur ? 0 : -1}
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveStop(stop.key)}
                          className={cur ? 'font-semibold' : ''}
                          style={cur ? { background: 'var(--muted)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' } : {}}
                        >
                          {done && !cur && (
                            <i className="fa-solid fa-check text-xs" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                          )}
                          {stop.label}
                          <span className="text-xs text-muted-foreground tabular-nums">{stopQuestionCount(stop)}</span>
                        </Button>
                      )
                    })}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleAddRoleStop} className="text-muted-foreground">
                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                    Add role
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground" style={{ margin: '12px 0' }}>
                  {ASPECT_INFO[curStop.subjectKey]}
                </p>
                <div role="tabpanel" aria-label={curStop.label} tabIndex={0}>
                  {renderStopStage(curStop)}
                </div>
                {renderStopNav()}
              </div>
            </div>
          ) : variant === 'guided' ? (
            /* Guided variant — the same sequential stops as 'tabs', carried in
               a left checklist rail (Mercury onboarding pattern) so no chrome
               sits above the content. Standard section cards inside. */
            <div className="flex flex-row flex-1 min-h-0">
              <nav
                aria-label="Template aspects"
                className="shrink-0 overflow-y-auto p-3 flex flex-col gap-1"
                style={{ width: 232, borderRight: '1px solid var(--border)' }}
              >
                {builderStops.map((stop, i) => {
                  const cur = stop.key === curStop.key
                  const done = stopQuestionCount(stop) > 0
                  return (
                    <Button
                      key={stop.key}
                      variant="ghost"
                      onClick={() => setActiveStop(stop.key)}
                      aria-current={cur ? 'step' : undefined}
                      className="h-auto w-full justify-start text-left rounded-lg px-3 py-2 hover:bg-transparent"
                      style={{ background: cur ? 'var(--muted)' : 'transparent' }}
                    >
                      <span className="flex items-start gap-2.5 w-full">
                        <span
                          className="shrink-0 flex items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            width: 18, height: 18, marginTop: 1,
                            background: cur ? 'var(--foreground)' : 'transparent',
                            border: cur || done ? 'none' : '1.5px solid var(--border)',
                            color: cur ? 'var(--background)' : done ? 'var(--brand-color)' : 'var(--muted-foreground)',
                          }}
                        >
                          {done && !cur ? <i className="fa-solid fa-check text-xs" aria-hidden="true" /> : i + 1}
                        </span>
                        <span className="flex flex-col items-start min-w-0">
                          <span className={`text-sm truncate ${cur ? 'font-semibold' : 'font-medium'}`}>{stop.label}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {done ? `${stopQuestionCount(stop)} question${stopQuestionCount(stop) !== 1 ? 's' : ''}` : 'not started'}
                          </span>
                        </span>
                      </span>
                    </Button>
                  )
                })}
                <Button variant="ghost" size="sm" onClick={handleAddRoleStop} className="justify-start text-muted-foreground">
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                  Add role
                </Button>
              </nav>
              <div className="flex-1 overflow-y-auto" style={{ padding: '24px 40px 48px' }}>
                <div style={{ maxWidth: 720 }} className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-2xl font-normal" style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                      {curStop.label}
                    </h2>
                    <p className="text-xs text-muted-foreground" style={{ marginTop: 4 }}>
                      {ASPECT_INFO[curStop.subjectKey]}
                    </p>
                  </div>
                  {renderStopStage(curStop)}
                  {renderStopNav()}
                </div>
              </div>
            </div>
          ) : (
            /* Course evaluation — vertical aspect rail with info + counts (Jun 30 meeting) */
            <div className="flex flex-row flex-1 min-h-0">
              {/* Aspect rail */}
              <nav
                aria-label="Template aspects"
                className="shrink-0 w-60 overflow-y-auto p-3 flex flex-col gap-1"
                style={{ borderRight: '1px solid var(--border)' }}
              >
                {subjectGroups.map(g => {
                  const active = activeGroup === g.key
                  const c = aspectCounts(g.key)
                  return (
                    <Button
                      key={g.key}
                      variant="ghost"
                      onClick={() => setActiveGroup(g.key)}
                      aria-current={active ? 'page' : undefined}
                      className="h-auto w-full justify-start text-left rounded-lg px-3 py-2.5 hover:bg-transparent"
                      // Only the active aspect is filled; inactive stays flat so
                      // one selection is unmistakable (inline beats the DS bg class).
                      style={{ background: active ? 'var(--muted)' : 'transparent' }}
                    >
                      <span className="flex flex-col items-start gap-1 w-full">
                        <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>{g.label}</span>
                        <span className="text-xs text-muted-foreground leading-snug whitespace-normal">{ASPECT_INFO[g.key]}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {c.sections} section{c.sections !== 1 ? 's' : ''} · {c.questions} question{c.questions !== 1 ? 's' : ''}
                        </span>
                      </span>
                    </Button>
                  )
                })}
              </nav>

              {/* Active aspect content */}
              <div className="flex-1 overflow-y-auto" style={{ padding: '28px 40px 48px' }}>
                <div style={{ maxWidth: 720 }} className="flex flex-col gap-4">

                  {/* Opening instruction for THIS aspect — collapsible accordion */}
                  <Collapsible
                    open={openInstruction[activeGroup] ?? false}
                    onOpenChange={o => setOpenInstruction(p => ({ ...p, [activeGroup]: o }))}
                    className="rounded-2 border border-dashed border-border"
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between h-auto px-3.5 py-2.5 hover:bg-transparent">
                        <span className="text-xs font-medium text-muted-foreground flex items-center">
                          <i className="fa-light fa-circle-info me-1.5" aria-hidden="true" />
                          Opening instruction · shown at the start of {subjectGroups.find(g => g.key === activeGroup)?.label}
                          {(aspectInstructions[activeGroup]?.title || aspectInstructions[activeGroup]?.text) && (
                            <span className="ms-2 inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-color)' }} aria-label="has content" />
                          )}
                        </span>
                        <i className={`fa-light fa-chevron-${(openInstruction[activeGroup] ?? false) ? 'up' : 'down'} text-xs text-muted-foreground`} aria-hidden="true" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3.5 pb-3 flex flex-col gap-2">
                      <Input
                        value={aspectInstructions[activeGroup]?.title ?? ''}
                        onChange={e => setAspectInstruction(activeGroup, { title: e.target.value })}
                        placeholder="Title (optional) — e.g. About this section"
                        className="h-8 text-sm"
                        aria-label={`Opening instruction title for ${activeGroup}`}
                      />
                      <Textarea
                        value={aspectInstructions[activeGroup]?.text ?? ''}
                        onChange={e => setAspectInstruction(activeGroup, { text: e.target.value })}
                        placeholder="Instruction shown to students before this section's questions…"
                        rows={2}
                        className="text-sm"
                        style={{ resize: 'none' }}
                        aria-label={`Opening instruction text for ${activeGroup}`}
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Upload document — template-level entry, above the sections */}
                  {activeGroup !== 'faculty' && uploadDocAffordance(activeGroup)}

                  {activeGroup === 'faculty' ? (
                    /* Role sets — roles declared OUTSIDE the section (Jul 1 constraint).
                       Each set picks one/multiple roles then owns its own sections. */
                    <>
                      <p className="text-xs text-muted-foreground">
                        <i className="fa-light fa-circle-info me-1.5" aria-hidden="true" />
                        Pick one or more roles per set, then build its sections — one role for role-specific
                        questions, multiple roles for shared questions.
                      </p>
                      {facultyRoleSets.map(set => {
                        const setSections = sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id)
                        return (
                          <div key={set.id} className="rounded-lg border border-border overflow-hidden"
                            style={{ background: 'var(--background)' }}>
                            {/* Set header — roles chosen here, never on the section */}
                            <div className="flex items-start gap-3" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                              <span className="text-xs font-medium shrink-0" style={{ paddingTop: 6 }}>Evaluating</span>
                              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                {set.roles.length === 0 ? (
                                  <span className="text-xs text-muted-foreground" style={{ paddingTop: 5 }}>Pick one or more roles</span>
                                ) : set.roles.map(roleKey => {
                                  const label = ROLE_LABEL(roleKey)
                                  return (
                                    <span key={roleKey} className="inline-flex items-center gap-1 text-xs font-medium rounded-full"
                                      style={{ background: 'var(--muted)', color: 'var(--foreground)', padding: '2px 4px 2px 10px' }}>
                                      {label}
                                      <Button variant="ghost" size="icon-xs" aria-label={`Remove ${label}`}
                                        className="opacity-50 hover:opacity-100" onClick={() => toggleRoleSetRole(set, roleKey)}>
                                        <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                                      </Button>
                                    </span>
                                  )
                                })}
                              </div>
                              <Popover open={rolePickerSetId === set.id}
                                onOpenChange={open => { setRolePickerSetId(open ? set.id : null); if (!open) setRoleSearch('') }}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="xs" className="shrink-0">
                                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add role
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-72" align="end" sideOffset={8} aria-label="Add role">
                                  {renderRolePickerContent(set)}
                                </PopoverContent>
                              </Popover>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" aria-label="Role set actions" className="shrink-0">
                                    <i className="fa-regular fa-ellipsis text-xs" aria-hidden="true" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem variant="destructive" onClick={() => removeFacultyRoleSet(t.id, set.id)}>
                                    <i className="fa-light fa-trash" aria-hidden="true" /> Remove role set
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {/* Sections owned by this set */}
                            <div className="flex flex-col gap-3" style={{ padding: '12px' }}>
                              {uploadDocAffordance('faculty', set.id)}
                              {setSections.length === 0 ? (
                                <div className="flex items-center justify-center rounded-lg border border-dashed"
                                  style={{ padding: '20px 16px', borderColor: 'var(--border)' }}>
                                  <Button variant="link" size="sm" onClick={() => handleAddSection('faculty', set.id)} className="font-semibold">
                                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add section
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  {setSections.map(sec => renderSectionCard(sec))}
                                  <div className="flex items-center justify-center" style={{ paddingTop: 2 }}>
                                    <Button variant="link" size="sm" onClick={() => handleAddSection('faculty', set.id)} className="font-semibold">
                                      <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add section
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
                        <Button variant="outline" size="sm" onClick={handleAddRoleSet}>
                          <i className="fa-light fa-plus text-xs" aria-hidden="true" />Add role set
                        </Button>
                      </div>
                    </>
                  ) : (() => {
                    const groupSections = sections.filter(s => s.subjectKey === activeGroup)
                    if (groupSections.length === 0) {
                      return (
                        <div
                          className="flex items-center justify-center rounded-lg border border-dashed"
                          style={{ padding: '28px 16px', borderColor: 'var(--border)' }}
                        >
                          <Button variant="link" size="sm" onClick={() => handleAddSection(activeGroup)} className="font-semibold">
                            <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                            Add section
                          </Button>
                        </div>
                      )
                    }
                    return (
                      <>
                        {groupSections.map(sec => renderSectionCard(sec))}
                        <div className="flex items-center justify-center" style={{ paddingTop: 4 }}>
                          <Button variant="link" size="sm" onClick={() => handleAddSection(activeGroup)} className="font-semibold">
                            <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                            Add section
                          </Button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Right panel — Question attributes when a question is selected */}
          {selectedQ && selectedQuestion && (
            <div
              className={`w-80 shrink-0 flex flex-col overflow-hidden ${variant !== 'rail' ? 'sticky self-start' : ''}`}
              style={{
                borderLeft: '1px solid var(--border)',
                ...(variant !== 'rail' ? { top: 56, height: 'calc(100vh - 64px)' } : {}),
              }}
            >
              <AttributesPanel
                key={selectedQuestion.questionId}
                question={selectedQ}
                meta={getQMeta(selectedQuestion.questionId)}
                onTextBlur={text =>
                  updateSectionQuestion(t.id, selectedQuestion.sectionId, selectedQuestion.questionId, { text })
                }
                onTypeChange={type => {
                  const patch: Partial<Pick<TemplateQuestion, 'answerType' | 'choices'>> = { answerType: type }
                  if (CHOICE_TYPES.has(type) && (selectedQ.choices?.length ?? 0) === 0) {
                    patch.choices = ['Option 1', 'Option 2']
                  }
                  updateSectionQuestion(t.id, selectedQuestion.sectionId, selectedQuestion.questionId, patch)
                }}
                onChoicesChange={choices =>
                  updateSectionQuestion(t.id, selectedQuestion.sectionId, selectedQuestion.questionId, { choices })
                }
                onMetaChange={patch => patchQMeta(selectedQuestion.questionId, patch)}
                onClose={() => setSelectedQuestion(null)}
              />
            </div>
          )}
        </TabsContent>

        {/* ── Step 1 · Template settings ── */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto m-0" style={{ padding: '28px 40px 48px' }}>
          <div style={{ maxWidth: 560 }}>
            {renderTemplateSettings()}
          </div>
        </TabsContent>

        {/* ── Step 3 · Review ── */}
        <TabsContent value="review" className="flex-1 overflow-y-auto m-0" style={{ padding: '28px 40px 48px' }}>
          {renderReview()}
        </TabsContent>

        {/* ── Wizard footer — Back / Next / Publish (sticky under window scroll in non-rail variants) ── */}
        <div
          className="shrink-0 flex items-center justify-between border-t border-border"
          style={{
            height: 60, padding: '0 40px', background: 'var(--background)',
            ...(variant !== 'rail' ? { position: 'sticky' as const, bottom: 0, zIndex: 10 } : {}),
          }}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentStepNum === 1}
            onClick={() => goToStepNum(currentStepNum - 1)}
          >
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />Back
          </Button>

          {wizardStep !== 'review' ? (
            <Button variant="default" size="sm" onClick={() => goToStepNum(currentStepNum + 1)}>
              Next<i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
            </Button>
          ) : t.status === 'active' ? (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
              Published — Unpublish from the header to make changes
            </span>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="default" size="sm" disabled={!canPublish}
                    onClick={() => { updateTemplate(t.id, { status: 'active' }); onPublished?.(t.id) }}>
                    Publish template
                  </Button>
                </span>
              </TooltipTrigger>
              {!canPublish && <TooltipContent>Add at least one section with a question to publish</TooltipContent>}
            </Tooltip>
          )}
        </div>
      </Tabs>

      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleUploadPicked}
        aria-label="Upload a document"
      />
      <TemplateImportDialog
        open={importCtx !== null}
        onOpenChange={(o) => { if (!o) { setImportCtx(null); setUploadedFileName(null) } }}
        tabLabel={importCtx?.label ?? ''}
        fileName={uploadedFileName}
        docs={importCtx ? (TEMPLATE_IMPORT_LIBRARY[importCtx.subjectKey] ?? []) : []}
        onImport={handleImportDocument}
      />

    </div>
  )
}
