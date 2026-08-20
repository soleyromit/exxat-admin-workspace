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
} from '@exxatdesignux/ui'
import type { PceTemplate } from '@/lib/pce-mock-data'

interface SurveyPreviewDialogProps {
  template: PceTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SurveyPreviewDialog({ template, open, onOpenChange }: SurveyPreviewDialogProps) {
  if (!template) return null

  const sections = template.templateSections ?? []
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>

        <p className="text-xs -mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {totalQuestions} question{totalQuestions !== 1 ? 's' : ''} · {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>

        <ScrollArea className="max-h-[400px]" aria-label="Survey questions preview">
          <div className="flex flex-col gap-5 pr-3">
            {sections.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No sections in this template.
              </p>
            ) : (
              sections.map((section, si) => {
                const startNum = sections.slice(0, si).reduce((n, s) => n + s.questions.length, 0)
                return (
                  <div key={section.id} className="flex flex-col gap-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      {section.title}
                    </p>
                    {section.questions.map((q, qi) => (
                      <div key={q.id} className="flex items-start gap-3">
                        <span
                          className="text-xs font-medium shrink-0"
                          style={{ color: 'var(--muted-foreground)', width: 18, paddingTop: 2 }}
                        >
                          {startNum + qi + 1}
                        </span>
                        <div className="flex flex-col gap-1.5 flex-1">
                          <p className="text-sm">{q.text}</p>
                          {q.answerType === 'likert' ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: template.likertPointer }, (_, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-medium rounded"
                                  style={{
                                    padding: '1px 7px',
                                    background: 'var(--muted)',
                                    color: 'var(--muted-foreground)',
                                  }}
                                >
                                  {i + 1}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div
                              className="rounded-md border border-dashed border-border h-8 flex items-center px-3"
                            >
                              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                Written response
                              </span>
                            </div>
                          )}
                        </div>
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
