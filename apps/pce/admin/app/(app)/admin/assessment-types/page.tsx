'use client'

/**
 * Admin · Assessment Types (UC-19, workspace ADR-001 entity #11).
 *
 * Per Aarti 2026-05-06 audit T6 (BLOCKER): "Five assessment types — get
 * product/PM alignment on definitions and per-type parameters before more
 * assessment screens." This list view is the canonical inventory; the
 * per-type parameter spec is a separate doc workstream.
 *
 * Phase rollout per Aarti 2026-05-08 16:09 D13:
 *   P1: pop quiz / timed / take-home / open-book / standard proctored
 *   P2: lockdown browser
 *   P3: remote-monitored proctored
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, InputGroup, InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { MOCK_ASSESSMENT_TYPES } from '@/lib/pce-mock-data'

export default function AssessmentTypesPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MOCK_ASSESSMENT_TYPES
    return MOCK_ASSESSMENT_TYPES.filter(t =>
      t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">Assessment Types</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Five Phase 1 types ship at launch. Lockdown + remote-monitored proctoring follow in P2/P3 (per Aarti audit D13). Per-type parameter spec is a separate workstream — this list is the canonical inventory.
          </p>

          <div className="flex items-center gap-2">
            <InputGroup className="flex-1 max-w-sm">
              <Input
                placeholder="Search by name or description…"
                aria-label="Search assessment types"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell><span className="text-sm font-medium">{t.name}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{t.description}</span></TableCell>
                    <TableCell><span className="text-xs tabular-nums">P{t.phase}</span></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
            Assessment types are platform-defined and not customer-editable. New types require an ADR + workspace governance review.
          </p>

        </div>
      </main>
    </>
  )
}
