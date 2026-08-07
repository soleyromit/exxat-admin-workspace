"use client"

/**
 * Form previews for Design System docs — shadcn Field + RadioGroup patterns.
 * @see https://ui.shadcn.com/docs/components/radio-group
 */

import * as React from "react"
import { useForm } from "react-hook-form"

import { SettingsFormRow } from "@/components/settings-form-row"
import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxLabel } from "@/components/ui/checkbox"
import { DatePickerField } from "@/components/ui/date-picker-field"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { ViewSegmentedControl } from "@/components/ui/view-segmented-control"
import { cn } from "@/lib/utils"

const PLAN_OPTIONS = [
  { value: "monthly", label: "Monthly ($9.99/month)", id: "plan-monthly" },
  { value: "yearly", label: "Yearly ($99.99/year)", id: "plan-yearly" },
  { value: "lifetime", label: "Lifetime ($299.99)", id: "plan-lifetime" },
] as const

const SPACING_OPTIONS = [
  {
    value: "default",
    label: "Default",
    description: "Standard spacing for most use cases.",
    id: "spacing-default",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "More space between elements.",
    id: "spacing-comfortable",
  },
  {
    value: "compact",
    label: "Compact",
    description: "Minimal spacing for dense layouts.",
    id: "spacing-compact",
  },
] as const

const CHOICE_OPTIONS = [
  { value: "plus", title: "Plus", description: "For individuals and small teams.", id: "plus-plan" },
  { value: "pro", title: "Pro", description: "For growing businesses.", id: "pro-plan" },
  {
    value: "enterprise",
    title: "Enterprise",
    description: "For large teams and enterprises.",
    id: "enterprise-plan",
  },
] as const

/** shadcn default — RadioGroup + Field horizontal rows. */
export function RadioGroupDefaultPreview() {
  return (
    <RadioGroup defaultValue="comfortable" className="w-full max-w-sm">
      {SPACING_OPTIONS.map((opt) => (
        <Field key={opt.value} orientation="horizontal">
          <RadioGroupItem value={opt.value} id={`rg-default-${opt.id}`} />
          <FieldLabel htmlFor={`rg-default-${opt.id}`} className="font-normal">
            {opt.label}
          </FieldLabel>
        </Field>
      ))}
    </RadioGroup>
  )
}

/** shadcn fieldset — FieldSet + FieldLegend + RadioGroup + Field per option. */
export function RadioGroupFieldsetPreview() {
  const [value, setValue] = React.useState("monthly")

  return (
    <FieldSet className="w-full max-w-sm">
      <FieldLegend variant="label">Subscription plan</FieldLegend>
      <FieldDescription>Yearly and lifetime plans offer significant savings.</FieldDescription>
      <RadioGroup
        value={value}
        onValueChange={setValue}
        itemVariant="outline"
        itemMotion="glow"
        className="gap-1"
      >
        {PLAN_OPTIONS.map((opt) => (
          <Field key={opt.value} orientation="horizontal">
            <RadioGroupItem value={opt.value} id={`rg-fieldset-${opt.id}`} />
            <FieldLabel htmlFor={`rg-fieldset-${opt.id}`} className="font-normal">
              {opt.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

/** shadcn description — FieldContent with label + description per option. */
export function RadioGroupDescriptionPreview() {
  return (
    <RadioGroup defaultValue="comfortable" className="w-full max-w-md">
      {SPACING_OPTIONS.map((opt) => (
        <Field key={opt.value} orientation="horizontal">
          <RadioGroupItem value={opt.value} id={`rg-desc-${opt.id}`} />
          <FieldContent>
            <FieldLabel htmlFor={`rg-desc-${opt.id}`}>{opt.label}</FieldLabel>
            <FieldDescription>{opt.description}</FieldDescription>
          </FieldContent>
        </Field>
      ))}
    </RadioGroup>
  )
}

/** shadcn choice card — FieldLabel wraps the whole Field row. */
export function RadioGroupChoiceCardPreview() {
  return (
    <RadioGroup defaultValue="plus" className="w-full max-w-sm gap-2">
      {CHOICE_OPTIONS.map((opt) => (
        <FieldLabel key={opt.value} htmlFor={`rg-card-${opt.id}`}>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{opt.title}</FieldTitle>
              <FieldDescription>{opt.description}</FieldDescription>
            </FieldContent>
            <RadioGroupItem value={opt.value} id={`rg-card-${opt.id}`} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}

/** shadcn invalid — aria-invalid on items + data-invalid on Field. */
export function RadioGroupInvalidPreview() {
  return (
    <FieldSet className="w-full max-w-sm">
      <FieldLegend variant="label">Notification preferences</FieldLegend>
      <FieldDescription>Choose how you want to receive notifications.</FieldDescription>
      <RadioGroup defaultValue="email" className="gap-1">
        {(
          [
            { value: "email", label: "Email only", id: "invalid-email" },
            { value: "sms", label: "SMS only", id: "invalid-sms" },
            { value: "both", label: "Both email & SMS", id: "invalid-both" },
          ] as const
        ).map((opt) => (
          <Field key={opt.value} orientation="horizontal" data-invalid>
            <RadioGroupItem value={opt.value} id={`rg-invalid-${opt.id}`} aria-invalid />
            <FieldLabel htmlFor={`rg-invalid-${opt.id}`} className="font-normal">
              {opt.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

type FieldLayout = "top" | "left"

const LAYOUT_OPTIONS = [
  { value: "top", label: "Top label", icon: "fa-light fa-arrow-down" },
  { value: "left", label: "Left label", icon: "fa-light fa-arrow-right" },
] as const

export function FieldLayoutsPreview({ className }: { className?: string }) {
  const [layout, setLayout] = React.useState<FieldLayout>("top")
  const [questionType, setQuestionType] = React.useState("monthly")
  const [notifications, setNotifications] = React.useState(true)
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ViewSegmentedControl
        value={layout}
        onValueChange={(v) => setLayout(v as FieldLayout)}
        aria-label="Field label layout"
        options={[...LAYOUT_OPTIONS]}
      />
      {layout === "top" ? (
        <FieldGroup>
          <Field orientation="vertical">
            <FieldLabel htmlFor="ds-top-stem">Question stem</FieldLabel>
            <Textarea id="ds-top-stem" rows={2} defaultValue="Which nerve innervates the diaphragm?" />
            <FieldDescription>Shown to learners during delivery.</FieldDescription>
          </Field>

          <FieldSet>
            <FieldLegend variant="label">Question type</FieldLegend>
            <FieldDescription>One format per stem.</FieldDescription>
            <RadioGroup
              value={questionType}
              onValueChange={setQuestionType}
              itemVariant="outline"
              className="gap-1"
            >
              {PLAN_OPTIONS.map((opt) => (
                <Field key={opt.value} orientation="horizontal">
                  <RadioGroupItem value={opt.value} id={`ds-top-${opt.id}`} />
                  <FieldLabel htmlFor={`ds-top-${opt.id}`} className="font-normal">
                    {opt.label}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>

          <Field orientation="vertical">
            <FieldLabel htmlFor="ds-top-program">Program</FieldLabel>
            <Select defaultValue="pt">
              <SelectTrigger id="ds-top-program" className="w-full" aria-label="Program">
                <SelectValue placeholder="Choose program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Physical therapy</SelectItem>
                <SelectItem value="nursing">Nursing</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="horizontal">
            <Checkbox
              id="ds-top-notify"
              checked={notifications}
              onCheckedChange={(v) => setNotifications(v === true)}
            />
            <FieldLabel htmlFor="ds-top-notify" className="font-normal">
              Email coordinators when published
            </FieldLabel>
          </Field>

          <Field orientation="vertical">
            <FieldLabel htmlFor="ds-top-due">Review by</FieldLabel>
            <DatePickerField id="ds-top-due" value={date} onChange={setDate} />
          </Field>
        </FieldGroup>
      ) : (
        <div className="flex flex-col gap-6">
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="ds-left-stem" className="sm:min-w-[7.5rem]">
                Question stem
              </FieldLabel>
              <FieldContent>
                <Textarea id="ds-left-stem" rows={2} defaultValue="Which nerve innervates the diaphragm?" />
                <FieldDescription>Label left, control right.</FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal" className="items-start">
              <FieldLabel className="sm:min-w-[7.5rem] pt-2">Question type</FieldLabel>
              <FieldContent>
                <RadioGroup
                  value={questionType}
                  onValueChange={setQuestionType}
                  itemVariant="outline"
                  className="gap-1"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <Field key={opt.value} orientation="horizontal">
                      <RadioGroupItem value={opt.value} id={`ds-left-${opt.id}`} />
                      <FieldLabel htmlFor={`ds-left-${opt.id}`} className="font-normal">
                        {opt.label}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="ds-left-notify" className="sm:min-w-[7.5rem]">
                Notifications
              </FieldLabel>
              <FieldContent className="flex min-w-0 flex-1 flex-col items-end gap-1">
                <ToggleSwitch id="ds-left-notify" checked={notifications} onChange={setNotifications} />
                <FieldDescription className="text-right">Email when published</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <SettingsFormRow label="Program" htmlFor="ds-settings-program">
            <Select defaultValue="nursing">
              <SelectTrigger id="ds-settings-program" className="w-full max-w-sm" aria-label="Program">
                <SelectValue placeholder="Choose program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nursing">Nursing</SelectItem>
                <SelectItem value="pt">Physical therapy</SelectItem>
              </SelectContent>
            </Select>
          </SettingsFormRow>
        </div>
      )}
    </div>
  )
}

export function FormRhfPreview({ className }: { className?: string }) {
  const form = useForm<{ email: string; notes: string }>({
    defaultValues: { email: "", notes: "" },
  })

  return (
    <Form {...form}>
      <form
        className={cn("flex max-w-md flex-col gap-4", className)}
        onSubmit={form.handleSubmit(() => {})}
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: { value: /\S+@\S+/, message: "Enter a valid email" },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coordinator email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="coordinator@school.edu" autoComplete="email" {...field} />
              </FormControl>
              <FormDescription>FormField + FormMessage on blur.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal notes</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" className="w-fit">
          Validate form
        </Button>
      </form>
    </Form>
  )
}

const EXPORT_CHECKBOX_OPTIONS = [
  { id: "archived", label: "Include archived questions" },
  { id: "metadata", label: "Include question metadata" },
  { id: "rubrics", label: "Include rubric attachments" },
] as const

export function CheckboxFieldPreview() {
  const [values, setValues] = React.useState({
    archived: true,
    metadata: false,
    rubrics: false,
  })

  return (
    <FieldSet className="max-w-sm">
      <FieldLegend variant="label">Export options</FieldLegend>
      <FieldDescription>Choose what to include in the CSV download.</FieldDescription>
      <div data-slot="checkbox-group" className="flex flex-col gap-1">
        {EXPORT_CHECKBOX_OPTIONS.map((opt) => (
          <Field key={opt.id} orientation="horizontal">
            <Checkbox
              id={`ds-checkbox-group-${opt.id}`}
              checked={values[opt.id]}
              onCheckedChange={(v) => setValues((prev) => ({ ...prev, [opt.id]: v === true }))}
            />
            <FieldLabel htmlFor={`ds-checkbox-group-${opt.id}`} className="font-normal">
              {opt.label}
            </FieldLabel>
          </Field>
        ))}
      </div>
    </FieldSet>
  )
}

const CHECKBOX_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "success",
  "destructive",
  "warning",
  "muted",
] as const

const CHECKBOX_SIZES = ["sm", "default", "lg"] as const

const CHECKBOX_MOTIONS = ["none", "pop", "glow", "pop-glow"] as const

function PreviewCaption({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium capitalize text-muted-foreground">{children}</p>
}

function CheckboxPreviewCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <PreviewCaption>{label}</PreviewCaption>
      <div className="flex h-6 items-center">{children}</div>
    </div>
  )
}

export function CheckboxVariantsPreview() {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-6">
      {CHECKBOX_VARIANTS.map((variant) => (
        <CheckboxPreviewCell key={variant} label={variant}>
          <Checkbox variant={variant} checked aria-label={variant} />
        </CheckboxPreviewCell>
      ))}
    </div>
  )
}

export function CheckboxSizesPreview() {
  return (
    <div className="flex flex-wrap items-end gap-8">
      {CHECKBOX_SIZES.map((size) => (
        <CheckboxPreviewCell key={size} label={size}>
          <Checkbox size={size} checked aria-label={size} />
        </CheckboxPreviewCell>
      ))}
    </div>
  )
}

export function CheckboxMotionPreview() {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-6">
      {CHECKBOX_MOTIONS.map((motion) => (
        <CheckboxPreviewCell key={motion} label={motion}>
          <Checkbox motion={motion} checked aria-label={motion} />
        </CheckboxPreviewCell>
      ))}
    </div>
  )
}

export function CheckboxStatesPreview() {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-6">
      <CheckboxPreviewCell label="Unchecked">
        <Checkbox checked={false} aria-label="Unchecked" />
      </CheckboxPreviewCell>
      <CheckboxPreviewCell label="Checked">
        <Checkbox checked aria-label="Checked" />
      </CheckboxPreviewCell>
      <CheckboxPreviewCell label="Indeterminate">
        <Checkbox checked="indeterminate" aria-label="Indeterminate" />
      </CheckboxPreviewCell>
      <CheckboxPreviewCell label="Disabled">
        <Checkbox checked disabled aria-label="Disabled" />
      </CheckboxPreviewCell>
    </div>
  )
}

export function CheckboxLabelPreview() {
  const [newsletter, setNewsletter] = React.useState(false)

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="ds-checkbox-label"
          checked={newsletter}
          onCheckedChange={(v) => setNewsletter(v === true)}
        />
        <CheckboxLabel htmlFor="ds-checkbox-label">Email weekly placement digest</CheckboxLabel>
      </div>
    </div>
  )
}

export function CheckboxWithDescriptionPreview() {
  const [values, setValues] = React.useState({
    default: true,
    comfortable: false,
    compact: false,
  })

  return (
    <div data-slot="checkbox-group" className="flex w-full max-w-md flex-col gap-1">
      {SPACING_OPTIONS.map((opt) => (
        <Field key={opt.value} orientation="horizontal">
          <Checkbox
            id={`ds-checkbox-desc-${opt.id}`}
            checked={values[opt.value]}
            onCheckedChange={(v) =>
              setValues((prev) => ({ ...prev, [opt.value]: v === true }))
            }
          />
          <FieldContent>
            <FieldLabel htmlFor={`ds-checkbox-desc-${opt.id}`}>{opt.label}</FieldLabel>
            <FieldDescription>{opt.description}</FieldDescription>
          </FieldContent>
        </Field>
      ))}
    </div>
  )
}

export function CheckboxChoiceCardPreview() {
  const [values, setValues] = React.useState({
    plus: true,
    pro: false,
    enterprise: false,
  })

  return (
    <div data-slot="checkbox-group" className="flex w-full max-w-sm flex-col gap-2">
      {CHOICE_OPTIONS.map((opt) => (
        <FieldLabel key={opt.value} htmlFor={`ds-checkbox-card-${opt.id}`}>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{opt.title}</FieldTitle>
              <FieldDescription>{opt.description}</FieldDescription>
            </FieldContent>
            <Checkbox
              id={`ds-checkbox-card-${opt.id}`}
              checked={values[opt.value]}
              onCheckedChange={(v) =>
                setValues((prev) => ({ ...prev, [opt.value]: v === true }))
              }
            />
          </Field>
        </FieldLabel>
      ))}
    </div>
  )
}

const CHECKBOX_TABLE_BULK_ROW_IDS = ["q_101", "q_102", "q_103"] as const

const CHECKBOX_TABLE_BULK_ROW_LABELS: Record<(typeof CHECKBOX_TABLE_BULK_ROW_IDS)[number], string> = {
  q_101: "Diaphragm innervation",
  q_102: "Brachial plexus roots",
  q_103: "Cranial nerve functions",
}

export function CheckboxTableBulkPreview() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(["q_101"]))
  const allSelected = selected.size === CHECKBOX_TABLE_BULK_ROW_IDS.length
  const someSelected = selected.size > 0 && !allSelected

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(CHECKBOX_TABLE_BULK_ROW_IDS))
  }

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-dt-header-bg px-3 py-2">
        <Checkbox
          size="sm"
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={toggleAll}
          aria-label="Select all rows"
        />
        <span className="text-xs font-medium tracking-wide text-muted-foreground">Question</span>
      </div>
      <ul className="divide-y divide-border">
        {CHECKBOX_TABLE_BULK_ROW_IDS.map((id) => (
          <li key={id} className="flex items-center gap-2 px-3 py-2">
            <Checkbox
              size="sm"
              checked={selected.has(id)}
              onCheckedChange={() => toggleRow(id)}
              aria-label={CHECKBOX_TABLE_BULK_ROW_LABELS[id]}
            />
            <span className="text-sm text-foreground">{CHECKBOX_TABLE_BULK_ROW_LABELS[id]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CheckboxInvalidPreview() {
  return (
    <FieldSet className="max-w-sm">
      <FieldLegend variant="label">Acknowledgements</FieldLegend>
      <Field orientation="horizontal" data-invalid>
        <Checkbox id="ds-checkbox-invalid" aria-invalid aria-label="Required acknowledgement" />
        <FieldLabel htmlFor="ds-checkbox-invalid" className="font-normal">
          I confirm this export excludes student identifiers
        </FieldLabel>
      </Field>
    </FieldSet>
  )
}
