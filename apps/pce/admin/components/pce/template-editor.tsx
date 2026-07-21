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
import { TemplateBuilderOutlineRail, type BuilderOutlineItem } from '@/components/pce/template-builder-outline-rail'

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

// Editor wizard steps — build, configure, then review before publishing.
type WizardStepKey = 'builder' | 'settings' | 'review'
const WIZARD_STEPS: { n: number; key: WizardStepKey; label: string }[] = [
  { n: 1, key: 'builder',  label: 'Builder' },
  { n: 2, key: 'settings', label: 'Template settings' },
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
  /** Builder-step layout — 'rail' switches between aspects; 'canvas' stacks all aspects on one scroll with an outline rail. */
  variant?: 'rail' | 'canvas'
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
  // Canvas variant — collapsed aspect groups (all expanded by default).
  const [collapsedAspects, setCollapsedAspects] = useState<Set<string>>(new Set())
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
  const [wizardStep, setWizardStep] = useState<WizardStepKey>('builder')
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
    course_content: 'About the course itself — shown once per course.',
    faculty:        'About teaching staff — group sections into role sets that evaluate one or more roles.',
    general:        'Program-wide questions — shown once per evaluation.',
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
  }

  function handleAddSection(subjectKey?: string, roleSetId?: string) {
    const key = subjectKey ?? (isProgrammatic ? 'course_content' : activeGroup)
    if (!key) return
    const newId = `sec-${Date.now()}`
    addTemplateSection(t.id, { subjectKey: key, title: 'Untitled Section', questions: [], roleSetId }, newId)
    setEditingSectionId(newId)
    setEditingSectionTitle('Untitled Section')
    setClosedSectionIds(prev => { const n = new Set(prev); n.delete(newId); return n })
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
                  className="group rounded-lg border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

            {/* Add question — dropdown to pick type */}
            <div className="flex justify-center pt-2">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="font-semibold">
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

  // ── Canvas variant — per-aspect builder body ────────────────────────────────
  // Copy of the rail variant's inline aspect content parameterized by aspect key
  // (kept verbatim apart from anchors so the two layouts compare honestly —
  // delete the losing variant's copy once a direction is picked).
  function renderAspectBody(key: string) {
    const aspectLabel = subjectGroups.find(g => g.key === key)?.label
    return (
      <>
        {/* Opening instruction for THIS aspect — collapsible accordion */}
        <Collapsible
          open={openInstruction[key] ?? false}
          onOpenChange={o => setOpenInstruction(p => ({ ...p, [key]: o }))}
          className="rounded-2 border border-dashed border-border"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto px-3.5 py-2.5 hover:bg-transparent">
              <span className="text-xs font-medium text-muted-foreground flex items-center">
                <i className="fa-light fa-circle-info me-1.5" aria-hidden="true" />
                Opening instruction · shown at the start of {aspectLabel}
                {(aspectInstructions[key]?.title || aspectInstructions[key]?.text) && (
                  <span className="ms-2 inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-color)' }} aria-label="has content" />
                )}
              </span>
              <i className={`fa-light fa-chevron-${(openInstruction[key] ?? false) ? 'up' : 'down'} text-xs text-muted-foreground`} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-3.5 pb-3 flex flex-col gap-2">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Upload document — template-level entry, above the sections */}
        {key !== 'faculty' && uploadDocAffordance(key)}

        {key === 'faculty' ? (
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
                  {/* Set header — roles chosen here, never on the section; anchor for the outline rail */}
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
          const groupSections = sections.filter(s => s.subjectKey === key)
          if (groupSections.length === 0) {
            return (
              <div
                className="flex items-center justify-center rounded-lg border border-dashed"
                style={{ padding: '28px 16px', borderColor: 'var(--border)' }}
              >
                <Button variant="link" size="sm" onClick={() => handleAddSection(key)} className="font-semibold">
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
                <Button variant="link" size="sm" onClick={() => handleAddSection(key)} className="font-semibold">
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                  Add section
                </Button>
              </div>
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
              <ToggleSwitch
                id="tmpl-default-for-type"
                checked={!!t.isDefaultForType}
                disabled={!t.deliveryMode}
                onChange={(v) => {
                  if (t.deliveryMode) updateTemplate(t.id, { isDefaultForType: v })
                }}
              />
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
    /* Canvas variant scrolls at the window level (sticky rail/panel/footer) —
       an overflow-hidden ancestor would break position:sticky against the window. */
    <div className={`flex flex-col flex-1 ${variant === 'canvas' ? '' : 'overflow-hidden'}`}>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
            >
              Save draft
            </Button>
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
          {/* Left — section list. Canvas scrolls at the window level, so it must
              not sit under an overflow-hidden ancestor (breaks sticky). */}
          <div className={`flex flex-col flex-1 min-h-0 min-w-0 ${variant === 'canvas' ? '' : 'overflow-hidden'}`}>
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
          ) : variant === 'canvas' ? (
            /* Canvas variant — every aspect stacked on one scroll; the rail's
               job changes from view-switcher to outline (DS OutlineTree,
               mirrors results/[id] "On this page"). */
            <div className="flex flex-row flex-1 min-h-0">
              <TemplateBuilderOutlineRail
                groups={subjectGroups.map(g => {
                  const c = aspectCounts(g.key)
                  const items: BuilderOutlineItem[] =
                    g.key === 'faculty'
                      ? facultyRoleSets.flatMap(set => {
                          const setSecs = sections.filter(s => s.subjectKey === 'faculty' && s.roleSetId === set.id)
                          return [
                            {
                              anchorId: `roleset-${set.id}`,
                              label: set.roles.length ? set.roles.map(ROLE_LABEL).join(', ') : 'No roles selected',
                            },
                            ...setSecs.map(s => ({
                              anchorId: `sec-${s.id}`, label: s.title, count: s.questions.length, nested: true,
                            })),
                          ]
                        })
                      : sections
                          .filter(s => s.subjectKey === g.key)
                          .map(s => ({ anchorId: `sec-${s.id}`, label: s.title, count: s.questions.length }))
                  return { anchorId: `aspect-${g.key}`, label: g.label, count: c.questions, items }
                })}
              />

              {/* One continuous canvas — Course → Faculty → General (window scroll) */}
              <div className="flex-1 min-w-0" style={{ padding: '28px 40px 48px' }}>
                <div style={{ maxWidth: 720 }} className="flex flex-col">
                  {subjectGroups.map((g, gi) => {
                    const c = aspectCounts(g.key)
                    const collapsed = collapsedAspects.has(g.key)
                    return (
                      <section
                        key={g.key}
                        aria-labelledby={`aspect-${g.key}-heading`}
                        style={{
                          borderTop: gi > 0 ? '1px solid var(--border)' : 'none',
                          padding: gi > 0 ? '20px 0 28px' : '0 0 28px',
                        }}
                      >
                        {/* Aspect header — anchor target for the outline rail */}
                        <div id={`aspect-${g.key}`} className="flex items-start gap-2" style={{ scrollMarginTop: 12 }}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={collapsed ? `Expand ${g.label}` : `Collapse ${g.label}`}
                            aria-expanded={!collapsed}
                            onClick={() => setCollapsedAspects(prev => {
                              const n = new Set(prev)
                              if (n.has(g.key)) n.delete(g.key); else n.add(g.key)
                              return n
                            })}
                            className="shrink-0 mt-0.5"
                          >
                            <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'down'} text-xs`} aria-hidden="true" />
                          </Button>
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <h2 id={`aspect-${g.key}-heading`} className="text-base font-semibold">{g.label}</h2>
                            <p className="text-xs text-muted-foreground">{ASPECT_INFO[g.key]}</p>
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums shrink-0" style={{ paddingTop: 6 }}>
                            {c.sections} section{c.sections !== 1 ? 's' : ''} · {c.questions} question{c.questions !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {!collapsed && (
                          <div className="flex flex-col gap-4" style={{ paddingTop: 14, paddingLeft: 36 }}>
                            {renderAspectBody(g.key)}
                          </div>
                        )}
                      </section>
                    )
                  })}
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
              className={`w-80 shrink-0 flex flex-col overflow-hidden ${variant === 'canvas' ? 'sticky self-start' : ''}`}
              style={{
                borderLeft: '1px solid var(--border)',
                ...(variant === 'canvas' ? { top: 56, height: 'calc(100vh - 64px)' } : {}),
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

        {/* ── Step 2 · Template settings ── */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto m-0" style={{ padding: '28px 40px 48px' }}>
          <div style={{ maxWidth: 560 }}>
            {renderTemplateSettings()}
          </div>
        </TabsContent>

        {/* ── Step 3 · Review ── */}
        <TabsContent value="review" className="flex-1 overflow-y-auto m-0" style={{ padding: '28px 40px 48px' }}>
          {renderReview()}
        </TabsContent>

        {/* ── Wizard footer — Back / Next / Publish (sticky under window scroll in canvas) ── */}
        <div
          className="shrink-0 flex items-center justify-between border-t border-border"
          style={{
            height: 60, padding: '0 40px', background: 'var(--background)',
            ...(variant === 'canvas' ? { position: 'sticky' as const, bottom: 0, zIndex: 10 } : {}),
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
