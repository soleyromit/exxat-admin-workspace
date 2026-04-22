'use client'

import { useState } from 'react'
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tooltip, TooltipTrigger, TooltipContent, SidebarTrigger, Separator, Avatar, AvatarFallback,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { CreateSurveySheet, CloseSurveyDialog } from '@/components/pce/pce-modals'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import Link from 'next/link'

export default function SurveysPage() {
  const { surveys } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)
  const [termFilter, setTermFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = surveys.filter(s => {
    if (termFilter !== 'all' && s.term !== termFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search && !`${s.courseCode} ${s.courseName}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-semibold flex-1">Surveys</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
      </header>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0 flex-wrap">
        <div className="relative">
          <i
            className="fa-light fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
            style={{ fontSize: 12, color: 'var(--muted-foreground)' }}
          />
          <input
            className="h-8 rounded-md border border-border bg-background pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            style={{ width: 220 }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="collecting">Collecting</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <main className="flex-1 overflow-auto p-4">
        {filtered.length === 0 ? (
          <EmptySurveys onCreate={() => setCreateOpen(true)} hasFilters={termFilter !== 'all' || statusFilter !== 'all' || search.length > 0} />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor(s)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response rate</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <SurveyRow key={s.id} survey={s} onClose={() => setCloseSurvey(s)} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <CreateSurveySheet open={createOpen} onOpenChange={setCreateOpen} />
      <CloseSurveyDialog open={!!closeSurvey} onOpenChange={v => { if (!v) setCloseSurvey(null) }} survey={closeSurvey} />
    </>
  )
}

function SurveyRow({ survey, onClose }: { survey: PceSurvey; onClose: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  const primary = survey.instructors.find(i => i.role === 'primary')
  const extraCount = survey.instructors.length - 1

  return (
    <TableRow
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <TableCell>
        <Link href={`/surveys/${survey.id}`} className="flex flex-col gap-0.5 hover:underline">
          <span className="font-medium text-sm">{survey.courseCode}</span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{survey.term}</span>
        </Link>
      </TableCell>
      <TableCell>
        {primary && (
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{primary.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate max-w-32">{primary.name}</span>
                  {extraCount > 0 && (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      +{extraCount}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {extraCount > 0 && (
                <TooltipContent>
                  <div className="flex flex-col gap-0.5">
                    {survey.instructors.map(i => (
                      <span key={i.id} className="text-xs">{i.name} ({i.role})</span>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </TableCell>
      <TableCell><SurveyStatusBadge status={survey.status} /></TableCell>
      <TableCell>
        <ResponseGauge
          rate={survey.responseRate}
          responseCount={survey.responseCount}
          enrollmentCount={survey.enrollmentCount}
          showBar={survey.responseRate > 0}
        />
      </TableCell>
      <TableCell className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {survey.deadline}
      </TableCell>
      <TableCell>
        <div style={{ opacity: hovered || menuOpen ? 1 : 0, transition: 'opacity 100ms' }}>
          <DropdownMenu onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Survey actions">
                <i className="fa-regular fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/surveys/${survey.id}`}>
                  <i className="fa-light fa-eye" aria-hidden="true" />
                  View
                </Link>
              </DropdownMenuItem>
              {(survey.status === 'collecting' || survey.status === 'active') && (
                <DropdownMenuItem>
                  <i className="fa-light fa-bell" aria-hidden="true" />
                  Send Reminder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(survey.status === 'collecting' || survey.status === 'active') && (
                <DropdownMenuItem variant="destructive" onClick={onClose}>
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                  Close Survey
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function EmptySurveys({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 40, color: 'var(--muted-foreground)' }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{hasFilters ? 'No surveys match these filters' : 'No surveys yet'}</p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
          {hasFilters ? 'Try adjusting your filters.' : 'Create a survey from a template to start collecting responses.'}
        </p>
      </div>
      {!hasFilters && (
        <Button size="sm" onClick={onCreate}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
      )}
    </div>
  )
}
