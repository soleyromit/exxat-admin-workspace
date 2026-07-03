'use client'

import { useEffect, useState } from 'react'
import {
  Button, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { TemplateImportDoc } from '@/lib/pce-mock-data'

interface TemplateImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tab the extracted content will land in, e.g. "Course" / "Faculty". */
  tabLabel: string
  docs: TemplateImportDoc[]
  onImport: (doc: TemplateImportDoc) => void
}

export function TemplateImportDialog({ open, onOpenChange, tabLabel, docs, onImport }: TemplateImportDialogProps) {
  const [selId, setSelId] = useState<string>('')
  useEffect(() => { if (open) setSelId('') }, [open])

  const doc = docs.find(d => d.id === selId) ?? null
  const sectionCount = doc?.sections.length ?? 0
  const questionCount = doc?.sections.reduce((n, s) => n + s.questions.length, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Import document into {tabLabel}</DialogTitle>
          <DialogDescription>
            Choose a document to extract sections and questions into the {tabLabel} tab. You can edit, reorder, or delete everything after importing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4" style={{ paddingTop: 2, paddingBottom: 2 }}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="import-doc" className="text-sm">Choose a file</Label>
            <Select value={selId} onValueChange={setSelId}>
              <SelectTrigger id="import-doc" aria-label="Choose a document to import" style={{ height: 38, fontSize: 14 }}>
                <SelectValue placeholder="Select a document…" />
              </SelectTrigger>
              <SelectContent>
                {docs.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-light fa-file-lines text-xs" aria-hidden="true" />
                      {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {doc && (
            <div className="rounded-md border border-border overflow-hidden">
              <div style={{ padding: '8px 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <p className="text-xs font-medium">
                  We found {sectionCount} section{sectionCount !== 1 ? 's' : ''} · {questionCount} question{questionCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col" style={{ padding: '4px 12px 8px', maxHeight: 240, overflowY: 'auto' }}>
                {doc.sections.map((s, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-sm min-w-0 truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {s.questions.length} question{s.questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={!doc} onClick={() => doc && onImport(doc)}>
            {doc ? `Import ${sectionCount} section${sectionCount !== 1 ? 's' : ''} · ${questionCount} question${questionCount !== 1 ? 's' : ''}` : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
