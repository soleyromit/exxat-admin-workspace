'use client'

import { useState } from 'react'
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Checkbox, Avatar, AvatarFallback, SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { ReleaseSheet, ReleaseBulkDialog } from '@/components/pce/pce-modals'
import type { PceSurvey } from '@/lib/pce-mock-data'

export default function ModerationPage() {
  const { surveys, releaseSurvey } = usePce()
  const [selected, setSelected] = useState<string[]>([])
  const [surveyToRelease, setSurveyToRelease] = useState<PceSurvey | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const pending = surveys.filter(s => s.status === 'pending_review')

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelected(prev => prev.length === pending.length ? [] : pending.map(s => s.id))
  }

  const handleBulkRelease = () => {
    selected.forEach(id => releaseSurvey(id))
    setSelected([])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Single shared header */}
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Review & Moderation</h1>
        {selected.length > 0 && (
          <Button variant="default" size="sm" onClick={() => setBulkOpen(true)}>
            Release {selected.length} selected
          </Button>
        )}
      </header>

      {/* Toolbar — only show when surveys exist */}
      {pending.length > 0 && (
        <div className="py-2 border-b border-border shrink-0" style={{ paddingInline: 28 }}>
          <p className="text-sm text-muted-foreground">
            {pending.length} {pending.length === 1 ? 'survey' : 'surveys'} pending review
          </p>
        </div>
      )}

      {/* Main — show empty state or table */}
      <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
            <i
              className="fa-light fa-shield-check"
              aria-hidden="true"
              style={{ fontSize: 48, color: 'var(--brand-color)' }}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">All caught up</p>
              <p className="text-sm text-muted-foreground" style={{ maxWidth: 360 }}>
                No surveys are waiting for review. When a survey closes, it will appear here
                before faculty can see results.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.length === pending.length && pending.length > 0 ? true : selected.length > 0 ? 'indeterminate' : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Instructors</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(survey => (
                  <ModerationRow
                    key={survey.id}
                    survey={survey}
                    isSelected={selected.includes(survey.id)}
                    onToggle={() => toggleSelect(survey.id)}
                    onReview={() => setSurveyToRelease(survey)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <ReleaseSheet
        open={!!surveyToRelease}
        onOpenChange={v => { if (!v) setSurveyToRelease(null) }}
        survey={surveyToRelease}
      />
      <ReleaseBulkDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        surveyIds={selected}
        onConfirm={handleBulkRelease}
      />
    </div>
  )
}

function ModerationRow({
  survey,
  isSelected,
  onToggle,
  onReview,
}: {
  survey: PceSurvey
  isSelected: boolean
  onToggle: () => void
  onReview: () => void
}) {
  return (
    <TableRow
      style={{ backgroundColor: isSelected ? 'var(--dt-row-selected)' : undefined }}
    >
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onToggle} aria-label={`Select ${survey.courseCode}`} />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{survey.courseCode}</span>
          <span className="text-xs text-muted-foreground">{survey.term}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm font-medium text-muted-foreground">
        {survey.deadline}
      </TableCell>
      <TableCell>
        <ResponseGauge
          rate={survey.responseRate}
          responseCount={survey.responseCount}
          enrollmentCount={survey.enrollmentCount}
          showBar={false}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {survey.instructors.slice(0, 2).map(i => (
            <Avatar key={i.id} className="h-6 w-6">
              <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{i.initials}</AvatarFallback>
            </Avatar>
          ))}
          {survey.instructors.length > 2 && (
            <span className="text-xs ml-1 text-muted-foreground">
              +{survey.instructors.length - 2}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Button size="sm" variant="outline" onClick={onReview}>
          Review & Release
        </Button>
      </TableCell>
    </TableRow>
  )
}
