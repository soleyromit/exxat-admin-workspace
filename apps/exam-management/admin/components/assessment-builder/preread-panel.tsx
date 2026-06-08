'use client'

import { Button, Textarea } from '@exxatdesignux/ui'
import type { AssessmentDraft } from '@/lib/qb-types'

interface Props {
  asmt: AssessmentDraft
  onUpdate: (patch: Partial<AssessmentDraft>) => void
}

/**
 * Pre-Read & Materials tab — pre-read instructions + supplementary materials,
 * mirroring the Claude Design assessment-builder.html preread panel.
 */
export function PreReadPanel({ asmt, onUpdate }: Props) {
  const setInstructions = (v: string) =>
    onUpdate({ settings: { ...asmt.settings, instructionsText: v } })

  // Materials are derived from section pre-read attachments where present; the
  // backend file store lands in Phase 1, so uploads show an empty affordance.
  const sectionMaterials = asmt.sections.filter(s => s.prereadText?.trim())

  return (
    <div className="flex-1 overflow-auto px-6 py-5">
      <div className="mx-auto max-w-3xl flex flex-col gap-5">

        {/* Assessment Pre-Read */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <i className="fa-light fa-book-open text-sm text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">Assessment Pre-Read</h3>
          </div>
          <label htmlFor="preread-instructions" className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Pre-read instructions <span className="font-normal">— shown to students before they start</span>
          </label>
          <Textarea
            id="preread-instructions"
            value={asmt.settings.instructionsText ?? ''}
            onChange={e => setInstructions(e.target.value)}
            placeholder="e.g. This is a closed-book examination. You have 90 minutes to complete all sections. A drug reference chart is provided as supplementary material…"
            className="text-sm min-h-[96px] resize-y"
          />
        </section>

        {/* Supplementary Materials */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="fa-light fa-paperclip text-sm text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-foreground">Supplementary Materials</h3>
            </div>
            <Button variant="default" size="sm" className="gap-1.5">
              <i className="fa-light fa-arrow-up-from-bracket text-xs" aria-hidden="true" />
              Upload
            </Button>
          </div>

          {sectionMaterials.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No materials attached. Upload PDFs, lab-value tables, or reference docs at assessment or section level.
            </p>
          ) : (
            <div className="flex flex-col">
              {sectionMaterials.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 py-2.5 ${i < sectionMaterials.length - 1 ? 'border-b border-border' : ''}`}>
                  <i className="fa-light fa-file-lines text-sm text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-sm text-foreground truncate flex-1">{s.title} — pre-read note</span>
                  <span className="text-xs text-[var(--chart-2)] shrink-0">{s.title}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
