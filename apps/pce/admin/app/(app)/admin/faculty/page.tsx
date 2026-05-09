'use client'

/**
 * Admin · Faculty (UC-19, workspace ADR-001 entity #5).
 *
 * Per Aarti 2026-05-08 16:09 D12: Faculty profile must be a SHARED component
 * between Exam Mgmt + CFE — single source of truth. This admin list view is
 * the platform-level inventory; the per-faculty drilldown will become a
 * shared React component in a later workstream.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, InputGroup, InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
  Avatar, AvatarFallback,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_FACULTY, MOCK_LMS_ENABLED, MOCK_COURSE_OFFERINGS,
  type PceInstructor,
} from '@/lib/pce-mock-data'

export default function FacultyPage() {
  const [rows, setRows] = useState<PceInstructor[]>(MOCK_FACULTY)
  const [search, setSearch] = useState('')

  // Derived: count of course offerings per faculty (active term)
  const offeringCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of MOCK_COURSE_OFFERINGS) {
      if (o.status === 'archived') continue
      m.set(o.primaryFacultyId, (m.get(o.primaryFacultyId) ?? 0) + 1)
    }
    return m
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => r.name.toLowerCase().includes(q))
  }, [rows, search])

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">Faculty</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Faculty profile is platform-level (workspace ADR-001) and shared between modules per Aarti D12. Admin manages the master list; modules consume filtered views.
          </p>

          <div className="flex items-center gap-2">
            <InputGroup className="flex-1 max-w-sm">
              <Input
                placeholder="Search by name…"
                aria-label="Search faculty"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add faculty
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add faculty
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Faculty add UI coming in next pass — use Import CSV for now</TooltipContent>
              </Tooltip>
            )}

            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Active offerings</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search ? `No faculty match "${search}"` : 'No faculty yet'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => {
                    const count = offeringCount.get(row.id) ?? 0
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 rounded-full shrink-0">
                              <AvatarFallback
                                className="rounded-full text-xs font-semibold"
                                style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                              >
                                {row.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{row.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="tabular-nums text-sm">
                            {count > 0 ? `${count} offering${count === 1 ? '' : 's'}` : <span className="text-muted-foreground">none</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
                                <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem disabled={MOCK_LMS_ENABLED}>
                                <i className="fa-light fa-pen" aria-hidden="true" />
                                Edit profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <i className="fa-light fa-rectangle-list" aria-hidden="true" />
                                View offerings
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <i className="fa-light fa-shield-check" aria-hidden="true" />
                                Manage roles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive">
                                <i className="fa-light fa-box-archive" aria-hidden="true" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Faculty profile editing UI is a Phase 2 follow-up — see workspace ADR-002.
            </p>
          )}

        </div>
      </main>
    </>
  )
}
