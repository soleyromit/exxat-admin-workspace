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
  const [releaseSurvey_, setReleaseSurvey] = useState<PceSurvey | null>(null)
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

  if (pending.length === 0) {
    return (
      <>
        <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
          <SidebarTrigger className="-ms-1" />
          <Separator orientation="vertical" className="h-4" />
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Review & Moderation</h1>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
          <i
            className="fa-light fa-shield-check"
            aria-hidden="true"
            style={{ fontSize: 48, color: 'var(--brand-color)' }}
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 360 }}>
              No surveys are waiting for review. When a survey closes, it will appear here
              before faculty can see results.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Review & Moderation</h1>
        {selected.length > 0 && (
          <Button size="sm" onClick={() => setBulkOpen(true)}>
            Release {selected.length} selected
          </Button>
        )}
      </header>

      <div className="py-2 border-b border-border shrink-0" style={{ paddingInline: 28 }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {pending.length} {pending.length === 1 ? 'survey' : 'surveys'} pending review
        </p>
      </div>

      <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
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
                <TableHead>Closed</TableHead>
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
                  onReview={() => setReleaseSurvey(survey)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <ReleaseSheet
        open={!!releaseSurvey_}
        onOpenChange={v => { if (!v) setReleaseSurvey(null) }}
        survey={releaseSurvey_}
      />
      <ReleaseBulkDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        surveyIds={selected}
        onConfirm={handleBulkRelease}
      />
    </>
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
          <span style={{ fontSize: 13, fontWeight: 500 }}>{survey.courseCode}</span>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{survey.term}</span>
        </div>
      </TableCell>
      <TableCell style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted-foreground)' }}>
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
              <AvatarFallback style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 11 }}>{i.initials}</AvatarFallback>
            </Avatar>
          ))}
          {survey.instructors.length > 2 && (
            <span className="text-xs ml-1" style={{ color: 'var(--muted-foreground)' }}>
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
