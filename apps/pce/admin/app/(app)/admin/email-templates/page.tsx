'use client'

import { useState } from 'react'
import {
  Button, Field, FieldLabel, FieldGroup, Input, Textarea,
  Badge, LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'

/* Two reusable templates — Initial (sent on term publish) and Reminder (one
   template covers all intervals; {{days_until_close}} resolves per send). */
interface EmailTemplate {
  id: 'initial' | 'reminder'
  label: string
  description: string
  icon: string
  defaultSubject: string
  defaultBody: string
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial',
    label: 'Initial Invitation',
    description: 'Sent when a term evaluation cycle is published.',
    icon: 'fa-envelope',
    defaultSubject: 'Please complete your course evaluation for {{course_name}}',
    defaultBody: `Hi {{student_first_name}},

Your course evaluation for {{course_name}} ({{term_name}}) is now open. Your responses are anonymous — your name will never be attached to your answers.

Please complete it by {{close_date}}.

Complete your evaluation:
{{survey_link}}

View all your pending evaluations:
{{activity_dashboard_url}}

Thank you for your feedback — it helps us improve the program for future students.

{{program_name}} Team`,
  },
  {
    id: 'reminder',
    label: 'Reminder',
    description: 'Sent on your reminder schedule (e.g. 7 days, 3 days, 1 day before close). One template covers all intervals.',
    icon: 'fa-bell',
    defaultSubject: 'Reminder: {{days_until_close}} day{{s}} left to complete your course evaluation',
    defaultBody: `Hi {{student_first_name}},

Just a reminder — your evaluation for {{course_name}} closes in {{days_until_close}} day{{s}} ({{close_date}}).

It takes about 5 minutes and your responses are completely anonymous.

Complete your evaluation:
{{survey_link}}

View all your pending evaluations:
{{activity_dashboard_url}}

Thank you,
{{program_name}} Team`,
  },
]

const VARIABLE_CHIPS = [
  '{{student_first_name}}',
  '{{course_name}}',
  '{{term_name}}',
  '{{close_date}}',
  '{{days_until_close}}',
  '{{survey_link}}',
  '{{activity_dashboard_url}}',
  '{{program_name}}',
]

function TemplateEditor({
  template,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onReset,
  dirty,
}: {
  template: EmailTemplate
  subject: string
  body: string
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
  onReset: () => void
  dirty: boolean
}) {
  function insertVar(v: string) {
    onBodyChange(body + v)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: 'var(--brand-tint)' }}
        >
          <i className={`fa-light ${template.icon} text-sm`} style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{template.label}</h2>
            {dirty && <Badge variant="outline" className="text-[10px] font-normal">Edited</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
        </div>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0 text-xs">
            Reset to default
          </Button>
        )}
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>Subject line</FieldLabel>
          <Input
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Subject…"
            className="text-sm"
          />
        </Field>

        <Field>
          <FieldLabel>Body</FieldLabel>
          <Textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={12}
            placeholder="Email body…"
            className="text-sm font-mono resize-none"
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">Insert variable</p>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLE_CHIPS.map(v => (
            <Button
              key={v}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertVar(v)}
              className="h-auto px-2 py-0.5 text-xs font-mono font-normal text-muted-foreground"
            >
              {v}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EmailTemplatesPage() {
  const { setupDefaults, saveSetupDefaults } = usePce()

  const [subjects, setSubjects] = useState<Record<string, string>>({
    initial: setupDefaults.initialEmailSubject,
    reminder: TEMPLATES.find(t => t.id === 'reminder')!.defaultSubject,
  })
  const [bodies, setBodies] = useState<Record<string, string>>({
    initial: setupDefaults.initialEmailBody,
    reminder: TEMPLATES.find(t => t.id === 'reminder')!.defaultBody,
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveSetupDefaults({
      ...setupDefaults,
      initialEmailSubject: subjects.initial,
      initialEmailBody: bodies.initial,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const anyDirty = TEMPLATES.some(
    t => subjects[t.id] !== t.defaultSubject || bodies[t.id] !== t.defaultBody,
  )

  return (
    <>
      <SiteHeader title="Email Templates" />

      <div className="flex-1 overflow-auto" style={{ padding: '28px' }}>
        <div className="max-w-2xl flex flex-col gap-8">

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>
                Email Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                These templates are used for every evaluation cycle. Changes take effect on the next term activation.
              </p>
            </div>
            <Button variant="default" size="sm" onClick={handleSave} disabled={!anyDirty}>
              Save changes
            </Button>
          </div>

          {saved && (
            <LocalBanner variant="success" title="Templates saved">
              These will be used for the next term activation.
            </LocalBanner>
          )}

          <div
            className="rounded-lg border border-border overflow-hidden divide-y divide-border"
          >
            {TEMPLATES.map((t, i) => (
              <div key={t.id} className="p-6" style={{ backgroundColor: i % 2 === 0 ? 'var(--card)' : 'var(--background)' }}>
                <TemplateEditor
                  template={t}
                  subject={subjects[t.id] ?? t.defaultSubject}
                  body={bodies[t.id] ?? t.defaultBody}
                  onSubjectChange={(v) => setSubjects(prev => ({ ...prev, [t.id]: v }))}
                  onBodyChange={(v) => setBodies(prev => ({ ...prev, [t.id]: v }))}
                  onReset={() => {
                    setSubjects(prev => ({ ...prev, [t.id]: t.defaultSubject }))
                    setBodies(prev => ({ ...prev, [t.id]: t.defaultBody }))
                  }}
                  dirty={subjects[t.id] !== t.defaultSubject || bodies[t.id] !== t.defaultBody}
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
