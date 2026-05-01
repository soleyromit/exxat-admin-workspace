'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button, Badge, Separator, SidebarTrigger,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { TemplateSectionChips } from '@/components/pce/pce-badges'
import { CreateTemplateSheet } from '@/components/pce/pce-modals'
import { SECTION_LABELS } from '@/lib/pce-mock-data'
import type { TemplateSection } from '@/lib/pce-mock-data'
import Link from 'next/link'

const MOCK_QUESTIONS: Record<TemplateSection, string[]> = {
  course_content: [
    'The course objectives were clearly stated.',
    'Course materials supported my learning.',
    'The workload was appropriate for the credit hours.',
    'The course was well-organized and structured.',
    'Assessments were aligned with learning objectives.',
  ],
  faculty_performance: [
    'The instructor was well-prepared for each class.',
    'The instructor encouraged student participation.',
    'The instructor was available during office hours.',
    'The instructor communicated expectations clearly.',
    'The instructor provided helpful feedback.',
  ],
  course_director: [
    'The course director coordinated the course effectively.',
    'The course director was responsive to student concerns.',
    'The overall course direction met my educational needs.',
  ],
}

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { templates } = usePce()
  const [editOpen, setEditOpen] = useState(false)

  const template = templates.find(t => t.id === id)

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

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/templates" className="text-sm text-muted-foreground">
          Templates
        </Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">{template.name}</span>
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 12 }} />
          Edit
        </Button>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-2xl flex flex-col gap-6">

          {/* Meta */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>{template.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Created by {template.createdBy} · Last modified {template.lastModified}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="rounded shrink-0"
                style={{
                  backgroundColor: template.status === 'active' ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' : 'var(--pce-status-draft-bg)',
                  color: template.status === 'active' ? 'var(--brand-color-dark)' : 'var(--pce-status-draft-fg)',
                }}
              >
                {template.status === 'active' ? 'Active' : 'Draft'}
              </Badge>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Sections</span>
                <TemplateSectionChips sections={template.sections} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Questions</span>
                <span className="font-medium">{template.questionCount}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Used by surveys</span>
                <span className="font-medium">{template.usedBySurveyCount}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sections + Questions */}
          {template.sections.map(section => (
            <div key={section} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{SECTION_LABELS[section]}</h3>
                <span className="text-xs text-muted-foreground">
                  {MOCK_QUESTIONS[section].length} questions
                </span>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                {MOCK_QUESTIONS[section].map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 text-sm"
                    style={{
                      borderBottom: i < MOCK_QUESTIONS[section].length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span
                      className="tabular-nums mt-0.5 shrink-0 text-xs text-muted-foreground"
                      style={{ minWidth: 16 }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <CreateTemplateSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        template={template}
      />
    </>
  )
}
