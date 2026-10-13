"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { EmptyState } from "@/components/skills"
import { settingsExtra as X, surface } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { createClinicalSetting, renameClinicalSetting, setClinicalSettingActive, settingRows } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { ROUTES } from "@/lib/skills-routes"
import { SettingDialog } from "./entity-dialogs"
import { LibraryCard } from "./library-card"
import { ActiveBadge, BannerStack, TableSkeleton, useBanners } from "./library-ui"
import { useMounted } from "./use-mounted"

export { isReservedSettingName } from "./entity-dialogs"

type Row = { id: string; name: string; evidence: number; active: boolean; referencedBy: Array<{ id: string; name: string }> }

/**
 * Clinical Settings tab (P-05). Program-defined (SL-07), never pre-seeded (SL-01). The status is edited in the dialog, as in
 * the prototype. Deactivating a setting that a skill minimum still names is blocked with the skill names (proposed OD-26,
 * protects SC-18); everything else is allowed and keeps the evidence already recorded.
 */
export function SettingsTab() {
  const mounted = useMounted()
  const db = useDb()
  const banners = useBanners()
  const { run } = useActions()
  const [editor, setEditor] = React.useState<{ id: string | null } | null>(null)
  const returnFocus = React.useRef<string | null>(null)

  const rows: Row[] = settingRows(db)
    .map((r) => ({ id: r.item.id, name: r.item.name, evidence: r.evidenceCount, active: r.item.active, referencedBy: r.referencedBy }))

  const open = (id: string | null) => {
    returnFocus.current = id
    setEditor({ id })
  }
  const close = () => {
    const back = returnFocus.current
    setEditor(null)
    window.setTimeout(() => document.querySelector<HTMLElement>(back ? `[data-setting-edit="${CSS.escape(back)}"]` : `[data-setting-add]`)?.focus(), 0)
  }

  const columns = [
    {
      key: "name",
      label: r1.settingsCard.columns[0],
      width: 260,
      sortable: true,
      cell: (r: Row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{r.name}</span>
          {r.referencedBy.length > 0 ? (
            <Link href={`${ROUTES.skills}?setting=${r.id}`} onClick={(e) => e.stopPropagation()} className="w-fit text-xs underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {X.requiredBy(r.referencedBy.length)}
            </Link>
          ) : null}
        </div>
      ),
    },
    { key: "evidence", label: r1.settingsCard.columns[1], width: 160, sortable: true, cell: (r: Row) => <span className="text-sm">{r.evidence}</span> },
    { key: "active", label: r1.settingsCard.columns[2], width: 140, cell: (r: Row) => <ActiveBadge active={r.active} activeLabel={X.statusActive} inactiveLabel={X.statusInactive} /> },
    {
      key: "actions",
      label: "Actions",
      width: 110,
      resizable: false,
      defaultPin: "right" as const,
      cell: (r: Row) => (
        <Button type="button" variant="ghost" size="sm" data-setting-edit={r.id} aria-label={`${r.name}: ${r1.edit}`} onClick={(e) => { e.stopPropagation(); open(r.id) }}>
          <i className="fa-light fa-pencil" aria-hidden="true" />
          {r1.edit}
        </Button>
      ),
    },
  ]

  const noActive = db.clinicalSettings.every((s) => !s.active)
  const empty = (
    <EmptyState
      icon="fa-location-dot"
      title={surface.s06.empty}
      description={X.noStudents}
      footer={
        <Button type="button" variant="outline" size="sm" onClick={() => open(null)}>
          {r1.settingsCard.add}
        </Button>
      }
    />
  )
  const editing = editor?.id ? db.clinicalSettings.find((s) => s.id === editor.id) : null

  return (
    <>
      {/* Always visible: students must understand why lab evidence never satisfies a clinical minimum (SC-12). */}
      <LocalBanner variant="info">{r1.settingsIntro}</LocalBanner>
      <BannerStack items={banners.items} onDismiss={banners.dismiss} />

      <LibraryCard
        icon="fa-location-dot"
        title={r1.settingsCard.title}
        subtitle={r1.settingsCard.subtitle}
        headingId="settings-heading"
        action={
          <Button size="sm" type="button" variant="default" data-setting-add="" onClick={() => open(null)}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            {r1.settingsCard.add}
          </Button>
        }
      >
        {mounted && db.clinicalSettings.length > 0 && noActive ? (
          <div className="p-4">
            <LocalBanner variant="warning">{X.noStudents}</LocalBanner>
          </div>
        ) : null}
        {!mounted ? (
          <div className="p-4">
            <TableSkeleton rows={4} label={X.loading} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">{empty}</div>
        ) : (
          <DataTable<Row> data={rows} columns={columns} getRowId={(r) => r.id} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={empty} />
        )}
      </LibraryCard>

      {editor ? (
        <SettingDialog
          key={editor.id ?? "new"}
          existing={editing ? { id: editing.id, name: editing.name, active: editing.active } : null}
          names={db.clinicalSettings.filter((s) => s.id !== editor.id).map((s) => s.name)}
          onClose={close}
          onSave={({ name, active }) => {
            const r = run((d) => {
              const step = editing ? renameClinicalSetting(d, editing.id, name) : createClinicalSetting(d, { name })
              if (!step.ok) return step
              const id = editing ? editing.id : (step.value as { id: string }).id
              const wasActive = editing ? editing.active : true
              return active === wasActive ? step : setClinicalSettingActive(step.db, id, active)
            })
            if (r.ok) {
              banners.push({ variant: "success", text: editing ? X.renamed(name) : X.added(name) })
              return null
            }
            if (r.error.code === "settingReferenced") {
              const ids = (r.error.data?.skillIds as string[]) ?? []
              const names = (r.error.data?.skillNames as string[]) ?? []
              return { message: r.error.message, skills: ids.map((id, i) => ({ id, name: names[i] ?? id })) }
            }
            return { message: r.error.message }
          }}
        />
      ) : null}
    </>
  )
}
