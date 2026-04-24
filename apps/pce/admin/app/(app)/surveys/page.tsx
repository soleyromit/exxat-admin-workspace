'use client'

import { useState } from 'react'
import {
  Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tooltip, TooltipTrigger, TooltipContent,
  SidebarTrigger, Separator, Avatar, AvatarFallback, Badge,
  Input, InputGroup, InputGroupAddon,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import { CreateSurveySheet, CloseSurveyDialog } from '@/components/pce/pce-modals'
import { MOCK_TERMS } from '@/lib/pce-mock-data'
import type { PceSurvey, SurveyStatus } from '@/lib/pce-mock-data'
import Link from 'next/link'

type GroupConfig = { status: SurveyStatus; label: string; defaultOpen: boolean }

const GROUP_CONFIG: GroupConfig[] = [
  { status: 'pending_review', label: 'Needs Action',        defaultOpen: true  },
  { status: 'collecting',     label: 'Collecting',          defaultOpen: true  },
  { status: 'draft',          label: 'Draft',               defaultOpen: true  },
  { status: 'released',       label: 'Shared with Faculty', defaultOpen: false },
  { status: 'closed',         label: 'Closed',              defaultOpen: false },
]

export default function SurveysPage() {
  const { surveys } = usePce()
  const [createOpen, setCreateOpen] = useState(false)
  const [closeSurvey, setCloseSurvey] = useState<PceSurvey | null>(null)
  const [termFilter, setTermFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(GROUP_CONFIG.map(g => [g.status, g.defaultOpen]))
  )

  const filtered = surveys.filter(s => {
    if (termFilter !== 'all' && s.term !== termFilter) return false
    if (search && !`${s.courseCode} ${s.courseName}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const hasResults = filtered.length > 0

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="flex-1" style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 400 }}>Surveys</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
      </header>

      <div className="flex items-center gap-2 py-2 border-b border-border shrink-0 flex-wrap" style={{ paddingInline: 28 }}>
        <InputGroup className="w-56">
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
          </InputGroupAddon>
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </InputGroup>

        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <main className="flex-1 overflow-auto" style={{ padding: '0 28px 28px' }}>
        {!hasResults ? (
          <EmptySurveys
            onCreate={() => setCreateOpen(true)}
            hasFilters={termFilter !== 'all' || search.length > 0}
          />
        ) : (
          <div className="flex flex-col">
            {GROUP_CONFIG.map(group => {
              const groupSurveys = filtered.filter(s => s.status === group.status)
              if (groupSurveys.length === 0) return null
              const isOpen = openGroups[group.status]

              return (
                <Collapsible
                  key={group.status}
                  open={isOpen}
                  onOpenChange={v => setOpenGroups(prev => ({ ...prev, [group.status]: v }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 py-2.5 px-1 w-full h-auto justify-start rounded-none"
                      style={{ borderTop: '1px solid var(--border)' }}
                      aria-label={isOpen ? `Collapse ${group.label}` : `Expand ${group.label}`}
                    >
                      <span
                        className="text-xs font-semibold uppercase tracking-wide flex-1 text-left"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {group.label}
                      </span>
                      <Badge variant="secondary">{groupSurveys.length}</Badge>
                      <i
                        className="fa-light fa-chevron-down"
                        aria-hidden="true"
                        style={{ fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
                      />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border border-border rounded-lg overflow-hidden mb-4">
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
                          {groupSurveys.map(s => (
                            <SurveyRow key={s.id} survey={s} onClose={() => setCloseSurvey(s)} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </main>

      <CreateSurveySheet open={createOpen} onOpenChange={setCreateOpen} />
      <CloseSurveyDialog
        open={!!closeSurvey}
        onOpenChange={v => { if (!v) setCloseSurvey(null) }}
        survey={closeSurvey}
      />
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
          <span style={{ fontSize: 13, fontWeight: 600 }}>{survey.courseCode}</span>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{survey.courseName}</span>
        </Link>
      </TableCell>
      <TableCell>
        {primary && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 w-fit">
                <Avatar className="h-6 w-6">
                  <AvatarFallback
                    className="text-xs"
                    style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                  >
                    {primary.initials}
                  </AvatarFallback>
                </Avatar>
                <span style={{ fontSize: 13 }} className="truncate max-w-32">{primary.name}</span>
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
      <TableCell style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
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
              {survey.status === 'collecting' && (
                <DropdownMenuItem>
                  <i className="fa-light fa-bell" aria-hidden="true" />
                  Send Reminder
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {survey.status === 'collecting' && (
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
        <p className="text-sm font-medium">
          {hasFilters ? 'No surveys match these filters' : 'No surveys yet'}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)', maxWidth: 320 }}>
          {hasFilters
            ? 'Try adjusting your filters.'
            : 'Create a survey from a template to start collecting responses.'}
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
