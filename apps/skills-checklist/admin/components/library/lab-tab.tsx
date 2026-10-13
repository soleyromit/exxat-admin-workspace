"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { EmptyState } from "@/components/skills"
import { labExtra as X, surface } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import {
  adoptNamedLabInstructor,
  createLabInstructor,
  labInstructorRows,
  mergeNamedLabInstructor,
  namedTimes,
  openRequestsFor,
  rosterEvaluationCount,
  setLabInstructorActive,
  similarRosterEntry,
  updateLabInstructor,
} from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { InstructorDialog, MergeDialog } from "./entity-dialogs"
import { LibraryCard } from "./library-card"
import { ActiveBadge, BannerStack, TableSkeleton, useBanners } from "./library-ui"
import { useMounted } from "./use-mounted"

type RosterRow = { id: string; name: string; email: string; evaluations: number; active: boolean }
type NamedRow = { id: string; name: string; email: string; times: number; suggestion: { id: string; name: string } | null }

/**
 * Lab Instructors tab (P-05). Not Prism users: a name and an email are stored, no account is created (SL-08, EV-01). A name a
 * student typed that is not on the roster is listed for adoption so one person never accumulates as several spellings (SL-09).
 * "Add to roster" opens the Edit dialog prefilled and Save moves them onto the roster, as in the prototype. Emails are PII and
 * appear on this administrator surface only.
 */
export function LabTab() {
  const mounted = useMounted()
  const db = useDb()
  const banners = useBanners()
  const { run } = useActions()
  const [editor, setEditor] = React.useState<{ id: string | null } | null>(null)
  const [adopt, setAdopt] = React.useState<NamedRow | null>(null)
  const [merge, setMerge] = React.useState<NamedRow | null>(null)
  const returnFocus = React.useRef<string>("add")

  const { roster, named } = labInstructorRows(db)
  const rosterRows: RosterRow[] = roster.map((r) => ({ id: r.item.id, name: r.item.name, email: r.item.email, evaluations: rosterEvaluationCount(db, r.item.id), active: r.item.active }))
  const namedRows: NamedRow[] = named.map((n) => ({ id: n.item.id, name: n.item.name, email: n.item.email, times: namedTimes(db, n.item.id), suggestion: similarRosterEntry(db, n.item.name) }))

  const focusBack = () => window.setTimeout(() => document.querySelector<HTMLElement>(`[data-lab-focus="${CSS.escape(returnFocus.current)}"]`)?.focus(), 0)

  const columns = [
    { key: "name", label: r1.labCard.columns[0], width: 200, sortable: true, cell: (r: RosterRow) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "email", label: r1.labCard.columns[1], width: 260, sortable: true, cell: (r: RosterRow) => <span className="text-sm">{r.email}</span> },
    { key: "evaluations", label: r1.labCard.columns[2], width: 130, sortable: true, cell: (r: RosterRow) => <span className="text-sm">{r.evaluations}</span> },
    { key: "active", label: r1.labCard.columns[3], width: 130, cell: (r: RosterRow) => <ActiveBadge active={r.active} activeLabel={X.statusActive} inactiveLabel={X.statusInactive} /> },
    {
      key: "actions",
      label: "Actions",
      width: 110,
      resizable: false,
      defaultPin: "right" as const,
      cell: (r: RosterRow) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-lab-focus={r.id}
          aria-label={`${r.name}: ${r1.edit}`}
          onClick={(e) => {
            e.stopPropagation()
            returnFocus.current = r.id
            setEditor({ id: r.id })
          }}
        >
          <i className="fa-light fa-pencil" aria-hidden="true" />
          {r1.edit}
        </Button>
      ),
    },
  ]

  const empty = (
    <EmptyState
      icon="fa-user-group"
      title={surface.s07.empty}
      description={X.noAccount}
      footer={
        <Button type="button" variant="outline" size="sm" onClick={() => setEditor({ id: null })}>
          {r1.labCard.add}
        </Button>
      }
    />
  )
  const editing = editor?.id ? db.labInstructors.find((l) => l.id === editor.id) : null

  return (
    <>
      <LocalBanner variant="info">{r1.labIntro}</LocalBanner>
      <BannerStack items={banners.items} onDismiss={banners.dismiss} />

      <LibraryCard
        icon="fa-user-group"
        title={r1.labCard.title}
        subtitle={r1.labCard.subtitle}
        headingId="lab-roster-heading"
        action={
          <Button
            size="sm"
            type="button"
            variant="default"
            data-lab-focus="add"
            onClick={() => {
              returnFocus.current = "add"
              setEditor({ id: null })
            }}
          >
            <i className="fa-light fa-plus" aria-hidden="true" />
            {r1.labCard.add}
          </Button>
        }
      >
        {!mounted ? (
          <div className="p-4">
            <TableSkeleton rows={3} label={X.loading} />
          </div>
        ) : rosterRows.length === 0 ? (
          <div className="p-4">{empty}</div>
        ) : (
          <DataTable<RosterRow> data={rosterRows} columns={columns} getRowId={(r) => r.id} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={empty} />
        )}
      </LibraryCard>

      {mounted && namedRows.length > 0 ? (
        <LibraryCard icon="fa-triangle-exclamation" title={r1.named.title} subtitle={r1.named.subtitle} headingId="lab-named-heading">
          <ul aria-label={X.namedLabel}>
            {namedRows.map((r, i) => (
              <li key={r.id} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm text-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {X.namedTimes(r.times)}
                    {r.suggestion ? `. ${X.looksLike(r.suggestion.name)}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Outline, so the page keeps its one filled primary (Add instructor). */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-named-focus={r.id}
                    aria-label={`${r1.named.add}: ${r.name}`}
                    onClick={() => {
                      returnFocus.current = "add"
                      setAdopt(r)
                    }}
                  >
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    {r1.named.add}
                  </Button>
                  {r.suggestion ? (
                    <Button type="button" variant="outline" size="sm" aria-label={`${X.mergeInto} ${r.name}`} disabled={rosterRows.length === 0} onClick={() => setMerge(r)}>
                      {X.mergeInto}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </LibraryCard>
      ) : null}

      {editor ? (
        <InstructorDialog
          key={editor.id ?? "new"}
          existing={editing ? { id: editing.id, name: editing.name, email: editing.email, active: editing.active } : null}
          others={db.labInstructors.filter((l) => l.id !== editor.id).map((l) => ({ id: l.id, name: l.name, email: l.email }))}
          onClose={() => {
            setEditor(null)
            focusBack()
          }}
          onOpenExisting={(id) => setEditor({ id })}
          onSave={({ name, email, active }) => {
            const r = run((d) => {
              const step = editing ? updateLabInstructor(d, editing.id, { name, email }) : createLabInstructor(d, { name, email })
              if (!step.ok) return step
              const id = editing ? editing.id : (step.value as { id: string }).id
              const wasActive = editing ? editing.active : true
              return active === wasActive ? step : setLabInstructorActive(step.db, id, active)
            })
            if (r.ok) banners.push({ variant: "success", text: editing ? X.updated(name) : X.added(name) })
            return r.ok ? null : { message: r.error.message }
          }}
        />
      ) : null}

      {adopt ? (
        <InstructorDialog
          key={`adopt-${adopt.id}`}
          existing={null}
          prefill={{ name: adopt.name, email: adopt.email }}
          others={[]}
          onClose={() => {
            setAdopt(null)
            window.setTimeout(() => document.querySelector<HTMLElement>(`[data-named-focus="${CSS.escape(adopt.id)}"]`)?.focus() ?? focusBack(), 0)
          }}
          onOpenExisting={() => setAdopt(null)}
          onSave={({ name, email, active }) => {
            // SL-09: adopt the student-named entry (no duplicate spelling), then apply what the administrator edited.
            const r = run((d) => {
              const step = adoptNamedLabInstructor(d, adopt.id)
              if (!step.ok) return step
              const id = (step.value as { labInstructorId: string }).labInstructorId
              const edited = updateLabInstructor(step.db, id, { name, email })
              if (!edited.ok) return edited
              return active ? edited : setLabInstructorActive(edited.db, id, false)
            })
            if (r.ok) banners.push({ variant: "success", text: surface.s07.adoptSuccess(name) })
            return r.ok ? null : { message: r.error.message }
          }}
        />
      ) : null}

      {merge ? (
        <MergeDialog
          named={merge}
          roster={db.labInstructors.filter((l) => l.active).map((l) => ({ id: l.id, name: l.name, email: l.email }))}
          impact={(targetName) => X.mergeImpact(openRequestsFor(db, merge.id), targetName)}
          onClose={() => setMerge(null)}
          onConfirm={(targetId) => {
            const r = run((d) => mergeNamedLabInstructor(d, merge.id, targetId))
            if (r.ok) banners.push({ variant: "success", text: X.merged(r.value.requests, db.labInstructors.find((l) => l.id === targetId)?.name ?? "") })
            else banners.push({ variant: "error", text: `${X.failed} ${r.error.message}` })
            setMerge(null)
          }}
        />
      ) : null}
    </>
  )
}
