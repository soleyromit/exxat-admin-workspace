"use client"

/**
 * Live previews for LeoAssistBar — catalog detail + Design OS docs.
 *
 * The fake Leo does deterministic string work so the previews are honest about
 * what undo restores, without needing a model behind them.
 */

import * as React from "react"
import { createPortal } from "react-dom"

import { AskLeoButton } from "@/components/ask-leo-button"
import { LeoAssistField } from "@/components/leo-assist-field"
import {
  LeoAssistBar,
  type LeoAssistAction,
  type LeoAssistRequest,
  type LeoAssistSelection,
} from "@/components/leo-assist-bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tip } from "@/components/ui/tip"
import { getTextareaSelectionRect } from "@/lib/textarea-selection-rect"
import { cn } from "@/lib/utils"

const SEED_TEXT =
  "Students on this rotation will be supervised by a licensed physical therapist and are expected to complete a weekly reflection, attend the Monday huddle, and log all patient encounters in the system before the end of each shift."

/**
 * All entries live in the overflow More menu.
 *
 * One glyph per action, and none of them repeated across the two lists. In an
 * overflow menu the icon is read before the label, so two actions wearing the
 * same wand are two actions the user has to read twice to tell apart.
 */
const REWRITE_ACTIONS: readonly LeoAssistAction[] = [
  { id: "polish", label: "Polish", icon: "fa-wand-magic-sparkles" },
  { id: "shorten", label: "Shorten", icon: "fa-scissors" },
  { id: "expand", label: "Add detail", icon: "fa-paragraph" },
  { id: "formal", label: "More formal", icon: "fa-user-tie" },
  { id: "bullets", label: "Make a list", icon: "fa-list" },
]

const GENERATE_ACTIONS: readonly LeoAssistAction[] = [
  {
    id: "draft",
    label: "Draft",
    icon: "fa-file-pen",
    instruction: "Draft a site description for a physical therapy rotation",
  },
  {
    id: "from-template",
    label: "Start from the standard description",
    icon: "fa-clipboard-list",
  },
]

const REWRITE_EXAMPLES = [
  "Write it for a first year",
  "Cut it to two sentences",
  "Lead with attendance",
] as const

const GENERATE_EXAMPLES = [
  "An outpatient PT rotation",
  "A twelve week placement",
] as const

function polish(text: string, instruction: string): string {
  switch (instruction) {
    case "Polish":
      return "Students on this rotation are supervised by a licensed physical therapist. Each week they submit a reflection, attend the Monday huddle, and log every patient encounter before the shift ends."
    case "Shorten":
      return "Students are supervised by a licensed physical therapist. Submit a weekly reflection, attend the Monday huddle, and log encounters before each shift ends."
    case "Add detail":
      return `${text} Reflections are reviewed by the clinical coordinator within two business days.`
    case "More formal":
      return "Students assigned to this rotation shall be supervised by a licensed physical therapist. Each student is required to submit a weekly reflection, attend the Monday huddle, and record all patient encounters prior to the conclusion of every shift."
    case "Make a list":
      return "Supervised by a licensed physical therapist.\nSubmit a weekly reflection.\nAttend the Monday huddle.\nLog all patient encounters before each shift ends."
    default:
      return `${text.replace(/\s+$/, "")} (${instruction})`
  }
}

/**
 * A scoped rewrite gets mechanical transforms rather than the canned paragraphs
 * above: the point of the preview is to show that only the selected span moves,
 * which is only believable if the replacement is visibly derived from it.
 */
function rewriteSpan(span: string, instruction: string): string {
  const trimmed = span.trim()
  switch (instruction) {
    case "Polish":
      return trimmed.replace(/\s+/g, " ").replace(/\s*,\s*and\b/g, " and")
    case "Shorten":
      return trimmed.split(/,\s*/)[0]
    case "Add detail":
      return `${trimmed}, documented the same day`
    case "More formal":
      return trimmed
        .replace(/\bare expected to\b/g, "shall")
        .replace(/\bwill be\b/g, "are")
        .replace(/\ball\b/g, "every")
    case "Make a list":
      return trimmed.split(/,\s*/).join("\n")
    default:
      return `${trimmed} (${instruction})`
  }
}

function fakeLeo(request: LeoAssistRequest): string {
  if (request.selection) {
    return request.mode === "generate"
      ? "a short passage written by Leo"
      : rewriteSpan(request.text, request.instruction)
  }
  if (request.mode === "generate") {
    if (request.instruction === "Start from the standard description") {
      return SEED_TEXT
    }
    return "Students on this rotation work alongside a licensed physical therapist in an outpatient clinic. They carry a partial caseload by week four and document every encounter the same day."
  }
  return polish(request.text, request.instruction)
}

function delay<T>(value: T, ms: number) {
  return new Promise<T>(resolve => {
    window.setTimeout(() => resolve(value), ms)
  })
}

/** Locks every control inside while Leo is in flight. */
function FormLock({
  busy,
  children,
  className,
}: {
  busy: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <fieldset
      disabled={busy}
      aria-busy={busy}
      className={cn("m-0 min-w-0 border-0 p-0", className)}
    >
      {children}
    </fieldset>
  )
}

function LeoAssistBarDemo({
  seeded = true,
  delayMs = 1400,
}: {
  seeded?: boolean
  delayMs?: number
}) {
  const fieldId = React.useId()
  const [text, setText] = React.useState(seeded ? SEED_TEXT : "")
  const [busy, setBusy] = React.useState(false)

  const run = React.useCallback(
    (request: LeoAssistRequest) => delay(fakeLeo(request), delayMs),
    [delayMs],
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 py-2">
      <FormLock busy={busy}>
        <Field orientation="vertical">
          <FieldLabel htmlFor={fieldId}>Site description</FieldLabel>
          <Textarea
            id={fieldId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            placeholder="Nothing written yet"
            className="leading-relaxed"
          />
        </Field>
      </FormLock>
      <LeoAssistBar
        text={text}
        onTextChange={setText}
        onRun={run}
        onRunningChange={setBusy}
        actions={REWRITE_ACTIONS}
        emptyActions={GENERATE_ACTIONS}
        examples={REWRITE_EXAMPLES}
        emptyExamples={GENERATE_EXAMPLES}
        fieldLabel="Site description"
      />
    </div>
  )
}

export function LeoAssistBarPreview() {
  return <LeoAssistBarDemo />
}

export function LeoAssistBarEmptyPreview() {
  return <LeoAssistBarDemo seeded={false} />
}

/**
 * The working state on demand: send an instruction, or pick an action, and the
 * wash, the working star, the Stop button, and the locked form all run for the
 * length of the request and then hand the field back.
 *
 * Deliberately not looped. A permanent thinking animation stops reading as a
 * state and starts reading as chrome, which is the opposite of what this state
 * is for. The run is stretched to a few seconds so it can be watched start to
 * finish rather than caught.
 */
export function LeoAssistBarThinkingPreview() {
  const fieldId = React.useId()
  const [text, setText] = React.useState(SEED_TEXT)
  const [busy, setBusy] = React.useState(false)

  const run = React.useCallback(
    (request: LeoAssistRequest) => delay(fakeLeo(request), 3200),
    [],
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 py-2">
      <FormLock busy={busy}>
        <Field orientation="vertical">
          <FieldLabel htmlFor={fieldId}>Site description</FieldLabel>
          <Textarea
            id={fieldId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            className="leading-relaxed"
          />
        </Field>
      </FormLock>
      <LeoAssistBar
        text={text}
        onTextChange={setText}
        onRun={run}
        onRunningChange={setBusy}
        actions={REWRITE_ACTIONS}
        examples={REWRITE_EXAMPLES}
        fieldLabel="Site description"
      />
    </div>
  )
}

/**
 * Field level — one bar owned by one field, inside a form that has other
 * fields. The whole form locks while Leo works.
 */
export function LeoAssistBarFieldInFormPreview() {
  const nameId = React.useId()
  const contactId = React.useId()
  const descriptionId = React.useId()
  const [name, setName] = React.useState("Riverside Outpatient Clinic")
  const [contact, setContact] = React.useState("Dana Whitfield")
  const [description, setDescription] = React.useState(SEED_TEXT)
  const [busy, setBusy] = React.useState(false)

  const run = React.useCallback(
    (request: LeoAssistRequest) => delay(fakeLeo(request), 1600),
    [],
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 py-2">
      <FormLock busy={busy}>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field orientation="vertical">
              <FieldLabel htmlFor={nameId}>Site name</FieldLabel>
              <Input
                id={nameId}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor={contactId}>Primary contact</FieldLabel>
              <Input
                id={contactId}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
              />
            </Field>
          </div>
          <Field orientation="vertical">
            <FieldLabel htmlFor={descriptionId}>Site description</FieldLabel>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Nothing written yet"
              className="leading-relaxed"
            />
          </Field>
        </FieldGroup>
      </FormLock>
      <LeoAssistBar
        text={description}
        onTextChange={setDescription}
        onRun={run}
        onRunningChange={setBusy}
        actions={REWRITE_ACTIONS}
        emptyActions={GENERATE_ACTIONS}
        examples={REWRITE_EXAMPLES}
        emptyExamples={GENERATE_EXAMPLES}
        fieldLabel="Site description"
      />
    </div>
  )
}

/**
 * Group level — one bar over several fields.
 *
 * The bar still owns a single string, so the host serialises the group into it
 * and parses on the way back. That keeps undo whole: one undo restores every
 * field the run touched, not just the last one written.
 */
type Audience = "students" | "faculty" | "sites"

interface Expectations {
  supervision: string
  documentation: string
  /** Select. Leo sets it alongside the prose. */
  supervisionLevel: string
  /** Radio. */
  audience: Audience
  /** Checkboxes. */
  requirements: string[]
}

const SUPERVISION_LEVELS = [
  "Direct, on site at all times",
  "Indirect, available on call",
  "Mixed by week",
] as const

const AUDIENCES: readonly { value: Audience; label: string }[] = [
  { value: "students", label: "Students" },
  { value: "faculty", label: "Faculty" },
  { value: "sites", label: "Site staff" },
]

const REQUIREMENTS = [
  "Weekly reflection",
  "Monday huddle",
  "Same day documentation",
] as const

const GROUP_SEED: Expectations = {
  supervision:
    "A licensed physical therapist supervises every student on site at all times.",
  documentation:
    "Log all patient encounters in the system before the end of each shift.",
  supervisionLevel: SUPERVISION_LEVELS[0],
  audience: "students",
  requirements: ["Weekly reflection", "Monday huddle"],
}

/**
 * The bar owns one string, so the whole group is serialised into it. Structured
 * fields ride along with the prose, which is what lets one run change a select
 * and a paragraph together and one undo put both back.
 */
function encodeGroup(group: Expectations) {
  return JSON.stringify(group)
}

function decodeGroup(text: string): Expectations {
  try {
    return JSON.parse(text) as Expectations
  } catch {
    return GROUP_SEED
  }
}

/** Rewrites the prose and re-points the structured fields to match it. */
function rewriteGroup(): Expectations {
  return {
    supervision:
      "A licensed PT is with you on site whenever you see patients, for the whole placement.",
    documentation:
      "Write up every patient you see before you leave for the day. No overnight backlog.",
    supervisionLevel: SUPERVISION_LEVELS[0],
    audience: "students",
    requirements: [...REQUIREMENTS],
  }
}

export function LeoAssistBarGroupPreview() {
  const supervisionId = React.useId()
  const documentationId = React.useId()
  const levelId = React.useId()
  const [group, setGroup] = React.useState<Expectations>(GROUP_SEED)
  const [busy, setBusy] = React.useState(false)

  const run = React.useCallback(
    () => delay(encodeGroup(rewriteGroup()), 1600),
    [],
  )

  function toggleRequirement(value: string, on: boolean) {
    setGroup((prev) => ({
      ...prev,
      requirements: on
        ? [...prev.requirements, value]
        : prev.requirements.filter((r) => r !== value),
    }))
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 py-2">
      <FormLock busy={busy}>
        <FieldGroup className="gap-3 rounded-xl border border-border/80 bg-card/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Student expectations
          </p>

          <Field orientation="vertical">
            <FieldLabel htmlFor={supervisionId}>Supervision</FieldLabel>
            <Textarea
              id={supervisionId}
              value={group.supervision}
              onChange={(event) =>
                setGroup((prev) => ({ ...prev, supervision: event.target.value }))
              }
              rows={2}
              className="leading-relaxed"
            />
          </Field>

          <Field orientation="vertical">
            <FieldLabel htmlFor={documentationId}>Documentation</FieldLabel>
            <Textarea
              id={documentationId}
              value={group.documentation}
              onChange={(event) =>
                setGroup((prev) => ({
                  ...prev,
                  documentation: event.target.value,
                }))
              }
              rows={2}
              className="leading-relaxed"
            />
          </Field>

          <Field orientation="vertical">
            <FieldLabel htmlFor={levelId}>Supervision level</FieldLabel>
            <Select
              value={group.supervisionLevel}
              onValueChange={(next) =>
                setGroup((prev) => ({ ...prev, supervisionLevel: next }))
              }
            >
              <SelectTrigger id={levelId} className="w-full" aria-label="Supervision level">
                <SelectValue placeholder="Choose level" />
              </SelectTrigger>
              <SelectContent>
                {SUPERVISION_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <FieldSet>
            <FieldLegend variant="label">Written for</FieldLegend>
            <RadioGroup
              value={group.audience}
              onValueChange={(next) =>
                setGroup((prev) => ({ ...prev, audience: next as Audience }))
              }
              className="flex flex-wrap gap-x-4 gap-y-1.5"
            >
              {AUDIENCES.map((option) => (
                <Field key={option.value} orientation="horizontal" className="w-auto">
                  <RadioGroupItem
                    value={option.value}
                    id={`leo-group-audience-${option.value}`}
                  />
                  <FieldLabel
                    htmlFor={`leo-group-audience-${option.value}`}
                    className="font-normal"
                  >
                    {option.label}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">Required of every student</FieldLegend>
            <div className="flex flex-col gap-1.5">
              {REQUIREMENTS.map((requirement) => {
                const id = `leo-group-req-${requirement.replace(/\s+/g, "-").toLowerCase()}`
                return (
                  <Field key={requirement} orientation="horizontal">
                    <Checkbox
                      id={id}
                      checked={group.requirements.includes(requirement)}
                      onCheckedChange={(checked) =>
                        toggleRequirement(requirement, checked === true)
                      }
                    />
                    <FieldLabel htmlFor={id} className="font-normal">
                      {requirement}
                    </FieldLabel>
                  </Field>
                )
              })}
            </div>
          </FieldSet>
        </FieldGroup>
      </FormLock>

      {/* No quick actions here. There is no single likely edit across a mixed
          group, so naming one would be a guess; the instruction carries it. */}
      <LeoAssistBar
        text={encodeGroup(group)}
        onTextChange={next => setGroup(decodeGroup(next))}
        onRun={run}
        onRunningChange={setBusy}
        examples={[
          "Rewrite this for students",
          "Make every requirement mandatory",
        ]}
        fieldLabel="Student expectations"
      />
    </div>
  )
}

/**
 * Collapsed — a form with several fields, and one Leo button per field rather
 * than one bar per field. Opening it takes the caret; Escape or Close gives it
 * back.
 */
export function LeoAssistBarCollapsedPreview() {
  const objectivesId = React.useId()
  const evaluationId = React.useId()
  const [objectives, setObjectives] = React.useState(
    "Students will demonstrate safe patient handling and clear documentation by the end of week four.",
  )
  const [evaluation, setEvaluation] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const run = React.useCallback(
    (request: LeoAssistRequest) => delay(fakeLeo(request), 1600),
    [],
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 py-2">
      <FormLock busy={busy} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Field orientation="vertical">
            <FieldLabel htmlFor={objectivesId}>Learning objectives</FieldLabel>
            <Textarea
              id={objectivesId}
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
              rows={3}
              className="leading-relaxed"
            />
          </Field>
          <LeoAssistBar
            text={objectives}
            onTextChange={setObjectives}
            onRun={run}
            onRunningChange={setBusy}
            actions={REWRITE_ACTIONS}
            examples={REWRITE_EXAMPLES}
            fieldLabel="Learning objectives"
            collapsible
          />
        </div>

        <div className="flex flex-col gap-2">
          <Field orientation="vertical">
            <FieldLabel htmlFor={evaluationId}>Evaluation notes</FieldLabel>
            <Textarea
              id={evaluationId}
              value={evaluation}
              onChange={(event) => setEvaluation(event.target.value)}
              rows={3}
              placeholder="Nothing written yet"
              className="leading-relaxed"
            />
          </Field>
          <LeoAssistBar
            text={evaluation}
            onTextChange={setEvaluation}
            onRun={run}
            onRunningChange={setBusy}
            actions={REWRITE_ACTIONS}
            emptyActions={GENERATE_ACTIONS}
            examples={REWRITE_EXAMPLES}
            emptyExamples={GENERATE_EXAMPLES}
            fieldLabel="Evaluation notes"
            collapsible
            collapsedLabel="Write with Leo"
          />
        </div>
      </FormLock>
    </div>
  )
}

/**
 * Selection scope — select a phrase and a Leo chip appears beside it. The bar
 * opens scoped to that span, names how much text is in play, and puts the
 * result back in place, leaving the rest of the paragraph untouched.
 */
export function LeoAssistFieldSelectionPreview() {
  const [value, setValue] = React.useState(SEED_TEXT)

  const run = React.useCallback(
    (request: LeoAssistRequest) => delay(fakeLeo(request), 1400),
    [],
  )

  return (
    <div className="w-full min-w-0 py-2">
      <LeoAssistField
        label="Site description"
        value={value}
        onValueChange={setValue}
        onRun={run}
        actions={REWRITE_ACTIONS}
        emptyActions={GENERATE_ACTIONS}
        examples={REWRITE_EXAMPLES}
        emptyExamples={GENERATE_EXAMPLES}
        placeholder="Nothing written yet"
        minRows={5}
        maxRows={12}
      />
    </div>
  )
}

type SelectionToolbarState = {
  top: number
  left: number
  selection: LeoAssistSelection
}

/**
 * Floating format toolbar on text selection. Ask Leo opens LeoAssistBar scoped
 * to that span (same job as the selection chip, richer chrome).
 */
export function LeoAssistSelectionToolbarPreview() {
  const fieldId = React.useId()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = React.useState(SEED_TEXT)
  const [toolbar, setToolbar] = React.useState<SelectionToolbarState | null>(null)
  const [formats, setFormats] = React.useState<string[]>([])
  const [status, setStatus] = React.useState(
    "Select a phrase, then open Ask Leo from the toolbar.",
  )
  const [barOpen, setBarOpen] = React.useState(false)
  const [selection, setSelection] = React.useState<LeoAssistSelection | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const run = React.useCallback(
    (request: LeoAssistRequest) => delay(fakeLeo(request), 1400),
    [],
  )

  const readSelection = React.useCallback((): LeoAssistSelection | null => {
    const el = textareaRef.current
    if (!el) return null
    const { selectionStart: start, selectionEnd: end } = el
    if (start === end) return null
    return { start, end, text: el.value.slice(start, end) }
  }, [])

  const syncToolbar = React.useEffectEvent(() => {
    if (barOpen || busy) {
      setToolbar(null)
      return
    }
    const el = textareaRef.current
    const next = readSelection()
    if (!el || !next) {
      setToolbar(null)
      return
    }
    const rect = getTextareaSelectionRect(el, next.start, next.end)
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setToolbar(null)
      return
    }
    setToolbar({
      top: Math.max(8, rect.top - 44),
      left: rect.left + rect.width / 2,
      selection: next,
    })
  })

  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    let timer = 0
    const settle = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => syncToolbar(), 160)
    }
    el.addEventListener("select", settle)
    el.addEventListener("mouseup", settle)
    el.addEventListener("keyup", settle)
    const hide = () => setToolbar(null)
    window.addEventListener("scroll", hide, true)
    window.addEventListener("resize", hide)
    return () => {
      window.clearTimeout(timer)
      el.removeEventListener("select", settle)
      el.removeEventListener("mouseup", settle)
      el.removeEventListener("keyup", settle)
      window.removeEventListener("scroll", hide, true)
      window.removeEventListener("resize", hide)
    }
  }, [])

  const openAssistBar = (next: LeoAssistSelection) => {
    setSelection(next)
    setToolbar(null)
    setBarOpen(true)
    setStatus(`Leo Assist Bar scoped to "${next.text}"`)
  }

  const toggleFormat = (key: string) => {
    const selected = toolbar?.selection.text ?? "selection"
    const turningOn = !formats.includes(key)
    setFormats((prev) =>
      turningOn ? [...prev, key] : prev.filter((item) => item !== key),
    )
    setStatus(`${key} ${turningOn ? "on" : "off"} for "${selected}"`)
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 py-2">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
      <FormLock busy={busy}>
        <Field orientation="vertical">
          <FieldLabel htmlFor={fieldId}>Site description</FieldLabel>
          <Textarea
            id={fieldId}
            ref={textareaRef}
            value={value}
            onChange={(event) => {
              setToolbar(null)
              setSelection(null)
              setValue(event.target.value)
            }}
            rows={5}
            className="leading-relaxed"
          />
        </Field>
      </FormLock>

      <LeoAssistBar
        text={value}
        onTextChange={setValue}
        onRun={run}
        selection={selection}
        actions={REWRITE_ACTIONS}
        emptyActions={GENERATE_ACTIONS}
        examples={REWRITE_EXAMPLES}
        emptyExamples={GENERATE_EXAMPLES}
        fieldLabel="Site description"
        collapsible
        open={barOpen}
        onOpenChange={(next) => {
          setBarOpen(next)
          if (!next) setSelection(null)
        }}
        onRunningChange={setBusy}
      />

      {mounted && toolbar
        ? createPortal(
            <div
              role="toolbar"
              aria-label="Selection actions"
              className="fixed z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
              style={{ top: toolbar.top, left: toolbar.left }}
              onMouseDown={(event) => {
                event.preventDefault()
              }}
            >
              <Tip label="Bold" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant={formats.includes("Bold") ? "secondary" : "ghost"}
                  aria-label="Bold"
                  aria-pressed={formats.includes("Bold")}
                  onClick={() => toggleFormat("Bold")}
                >
                  <i className="fa-light fa-bold" aria-hidden="true" />
                </Button>
              </Tip>
              <Tip label="Italic" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant={formats.includes("Italic") ? "secondary" : "ghost"}
                  aria-label="Italic"
                  aria-pressed={formats.includes("Italic")}
                  onClick={() => toggleFormat("Italic")}
                >
                  <i className="fa-light fa-italic" aria-hidden="true" />
                </Button>
              </Tip>
              <Tip label="Underline" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant={formats.includes("Underline") ? "secondary" : "ghost"}
                  aria-label="Underline"
                  aria-pressed={formats.includes("Underline")}
                  onClick={() => toggleFormat("Underline")}
                >
                  <i className="fa-light fa-underline" aria-hidden="true" />
                </Button>
              </Tip>
              <Separator orientation="vertical" className="mx-0.5 h-6" />
              <Tip label="Copy" side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Copy selection"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(toolbar.selection.text)
                      .then(() => setStatus(`Copied "${toolbar.selection.text}"`))
                      .catch(() =>
                        setStatus("Could not copy. Use your browser copy shortcut."),
                      )
                  }}
                >
                  <i className="fa-light fa-copy" aria-hidden="true" />
                </Button>
              </Tip>
              <AskLeoButton
                size="sm"
                iconOnly
                animatedStar
                showShortcut={false}
                ariaLabel="Ask Leo about selection"
                tooltipLabel="Ask Leo"
                onClick={() => openAssistBar(toolbar.selection)}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
