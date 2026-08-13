'use client'

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Textarea,
} from '@exxatdesignux/ui'
import type { PceTemplate } from '@/lib/pce-mock-data'

interface SurveyPreviewDialogProps {
  template: PceTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Same wording students actually see on the survey-taking page
// (apps/pce/student/app/surveys/[id]/page.tsx RATING_LABELS) — only valid
// for the 5-point scale, the one every current template fixture uses.
// Reviewer's 2026-08-12 call: "preview should actually open fast... I'll
// not be confident... at least in the first two, three [pushes]" — bare
// numbered squares didn't answer that; the real rating control (labeled
// pills) and a real textarea do, without needing to design a whole
// separate screen.
const RATING_LABELS = ['', 'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']

export function SurveyPreviewDialog({ template, open, onOpenChange }: SurveyPreviewDialogProps) {
  if (!template) return null

  const sections = template.templateSections ?? []
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>

        <p className="text-xs -mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · {sections.length} section{sections.length !== 1 ? 's' : ''}
          {' '}· read-only preview, exactly as a student will see each question
        </p>

        <ScrollArea className="max-h-[520px]" aria-label="Survey questions preview">
          <div className="flex flex-col gap-6 pr-3">
            {sections.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No sections in this template.
              </p>
            ) : (
              sections.map((section, si) => {
                const startNum = sections.slice(0, si).reduce((n, s) => n + s.questions.length, 0)
                return (
                  <div key={section.id} className="flex flex-col gap-4">
                    <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      {section.title}
                    </p>
                    {section.questions.map((q, qi) => (
                      <div key={q.id} className="flex flex-col gap-2.5">
                        <div className="flex items-start gap-3">
                          <span
                            className="text-xs font-medium shrink-0"
                            style={{ color: 'var(--muted-foreground)', width: 18, paddingTop: 2 }}
                          >
                            {startNum + qi + 1}
                          </span>
                          <p className="text-sm flex-1">{q.text}</p>
                        </div>
                        {q.answerType === 'likert' ? (
                          <RatingPreview count={template.likertPointer} />
                        ) : (
                          <div className="ms-8">
                            <Textarea
                              className="resize-none"
                              style={{ minHeight: 64 }}
                              placeholder="Share your thoughts… (optional)"
                              disabled
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Same pill shape as the real survey-taking RatingInput (student app) —
 *  numbered circle + endpoint labels below. Inert (no onChange): this is a
 *  read-only preview of the question, not a fill-out form. Labels only
 *  render for the 5-point scale (the only one any current template uses,
 *  and the only one RATING_LABELS covers) — a mislabeled 3/7/10-point scale
 *  would be worse than none. */
function RatingPreview({ count }: { count: number }) {
  const withLabels = count === 5
  return (
    <div className="ms-8 flex flex-col gap-2">
      <div className="flex gap-2">
        {Array.from({ length: count }, (_, i) => i + 1).map(n => (
          <Button
            key={n}
            variant="outline"
            disabled
            className="flex flex-1 flex-col items-center rounded-xl h-auto py-3 disabled:opacity-100"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {n}
            </span>
          </Button>
        ))}
      </div>
      {withLabels && (
        <div className="flex">
          {Array.from({ length: count }, (_, i) => i + 1).map(n => (
            <span key={n} className="flex-1 text-center text-xs text-muted-foreground leading-tight px-0.5">
              {RATING_LABELS[n]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
