'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@exxatdesignux/ui'
import type { PceTemplate } from '@/lib/pce-mock-data'
import { SurveyPreviewDialog } from './survey-preview-dialog'

interface StepSurveyDesignGeneralProps {
  publishedTemplates: PceTemplate[]
  selectedTemplateId: string
  onTemplateChange: (id: string) => void
  onBack: () => void
  onNext: () => void
}

export function StepSurveyDesignGeneral({
  publishedTemplates,
  selectedTemplateId,
  onTemplateChange,
  onBack,
  onNext,
}: StepSurveyDesignGeneralProps) {
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 680 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Survey design</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Set a template for this survey.
        </p>
      </div>

      {publishedTemplates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-dashed border-border">
          <i className="fa-light fa-file-lines text-3xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <div>
            <p className="text-sm font-medium">No published templates</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Publish a template to continue.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/templates" target="_blank" rel="noreferrer" aria-label="Go to templates (opens in new tab)">
              Go to templates
              <i className="fa-light fa-arrow-up-right-from-square ml-1.5 text-xs" aria-hidden="true" />
            </a>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3" role="list" aria-label="Survey template">
            <Card role="listitem" className="flex flex-col overflow-hidden shadow-none">
              <CardContent className="flex items-center gap-3 py-0" style={{ padding: '10px 14px' }}>
                <span className="text-sm font-semibold flex-1 flex items-center gap-2">
                  General Survey
                  <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>
                    all recipients
                  </span>
                </span>

                <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
                  <SelectTrigger
                    className="w-48 shrink-0"
                    aria-label="Template for this survey"
                    style={{ height: 32, fontSize: 13 }}
                  >
                    <SelectValue placeholder="Choose template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishedTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplateId && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Preview selected template"
                    onClick={() => setPreviewTemplate(publishedTemplates.find(t => t.id === selectedTemplateId) ?? null)}
                  >
                    <i className="fa-light fa-eye text-xs" aria-hidden="true" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {selectedTemplateId ? '1 of 1 assigned' : '0 of 1 assigned'}
            </span>
            <a
              href="/templates"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline underline-offset-2"
              aria-label="Create a template (opens in new tab)"
            >
              Create a template
              <i className="fa-light fa-arrow-up-right-from-square ml-1 text-xs" aria-hidden="true" />
            </a>
          </div>
        </>
      )}

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={!selectedTemplateId || publishedTemplates.length === 0}
          onClick={onNext}
        >
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>

      <SurveyPreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={open => { if (!open) setPreviewTemplate(null) }}
      />
    </div>
  )
}
