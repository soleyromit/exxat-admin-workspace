"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { EmptyState } from "@/components/skills"
import { surface, taxonExtra as X } from "@/lib/copy"
import { r1 } from "@/lib/copy/r1-library"
import { categoryRows, createTaxon, setTaxonActive, tagRows, updateTaxon, type TaxonKind } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { ROUTES } from "@/lib/skills-routes"
import { TaxonDialog } from "./entity-dialogs"
import { LibraryCard } from "./library-card"
import { ActiveBadge, BannerStack, TableSkeleton, useBanners } from "./library-ui"
import { useMounted } from "./use-mounted"

type Row = { id: string; name: string; description: string; skillCount: number; active: boolean }

/**
 * Categories and Tags tabs (P-05). Program-defined, never pre-supplied (SL-01). The status is edited in the dialog, as in the
 * prototype: deactivating never removes the category or tag from skills that carry it; they show it flagged inactive (SL-06).
 */
export function TaxonTab({ kind }: { kind: TaxonKind }) {
  const mounted = useMounted()
  const db = useDb()
  const banners = useBanners()
  const { run } = useActions()
  const card = kind === "category" ? r1.categoriesCard : r1.tagsCard
  const plural = kind === "category" ? "categories" : "tags"
  const [editor, setEditor] = React.useState<{ id: string | null } | null>(null)
  const returnFocus = React.useRef<string | null>(null)

  const data = kind === "category" ? categoryRows(db) : tagRows(db)
  const rows: Row[] = data.map((r) => ({ id: r.item.id, name: r.item.name, description: r.item.description, skillCount: r.skillCount, active: r.item.active }))
  const items = kind === "category" ? db.categories : db.tags

  const open = (id: string | null) => {
    returnFocus.current = id
    setEditor({ id })
  }
  const close = () => {
    const back = returnFocus.current
    setEditor(null)
    window.setTimeout(() => document.querySelector<HTMLElement>(back ? `[data-taxon-edit="${CSS.escape(back)}"]` : `[data-taxon-add="${kind}"]`)?.focus(), 0)
  }

  const columns = [
    {
      key: "name",
      label: card.columns[0],
      width: 220,
      sortable: true,
      cell: (r: Row) => (kind === "tag" ? <Badge variant="secondary">{r.name}</Badge> : <span className="font-medium text-foreground">{r.name}</span>),
    },
    { key: "description", label: card.columns[1], width: 320, cell: (r: Row) => <span className="text-sm text-foreground">{r.description || ""}</span> },
    {
      key: "skillCount",
      label: card.columns[2],
      width: 110,
      sortable: true,
      cell: (r: Row) =>
        r.skillCount > 0 ? (
          <Link className="text-sm text-interactive-hover-foreground underline underline-offset-2" href={`${ROUTES.skills}?${kind === "category" ? "category" : "tag"}=${r.id}`} aria-label={X.skillsLinkLabel(kind, r.name, r.skillCount)}>
            {r.skillCount}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        ),
    },
    {
      key: "active",
      label: card.columns[3],
      width: 230,
      cell: (r: Row) => (
        <div className="flex flex-col gap-1">
          <ActiveBadge active={r.active} activeLabel={X.statusActive} inactiveLabel={X.statusInactive} />
          {!r.active && r.skillCount > 0 ? <span className="text-xs text-muted-foreground">{X.inactiveCarried(r.skillCount)}</span> : null}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 110,
      resizable: false,
      defaultPin: "right" as const,
      cell: (r: Row) => (
        <Button type="button" variant="ghost" size="sm" data-taxon-edit={r.id} aria-label={`${r.name}: ${r1.edit}`} onClick={(e) => { e.stopPropagation(); open(r.id) }}>
          <i className="fa-light fa-pencil" aria-hidden="true" />
          {r1.edit}
        </Button>
      ),
    },
  ]

  const empty = (
    <EmptyState
      icon={kind === "category" ? "fa-layer-group" : "fa-tag"}
      title={kind === "category" ? surface.s05.emptyCategories : surface.s05.emptyTags}
      description={kind === "category" ? `${X.emptyHint} ${X.importHint}` : X.emptyHint}
      footer={
        <Button type="button" variant="outline" size="sm" onClick={() => open(null)}>
          {card.add}
        </Button>
      }
    />
  )
  const editing = editor?.id ? items.find((x) => x.id === editor.id) : null

  return (
    <>
      <LocalBanner variant="info">{kind === "category" ? r1.categoriesIntro : r1.tagsIntro}</LocalBanner>
      <BannerStack items={banners.items} onDismiss={banners.dismiss} />

      <LibraryCard
        icon={kind === "category" ? "fa-layer-group" : "fa-tag"}
        title={card.title}
        subtitle={card.subtitle}
        headingId={`taxon-${kind}-heading`}
        action={
          /* The one filled primary on this tab. */
          <Button size="sm" type="button" variant="default" data-taxon-add={kind} onClick={() => open(null)}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            {card.add}
          </Button>
        }
      >
        {!mounted ? (
          <div className="p-4">
            <TableSkeleton rows={4} label={X.loading(plural)} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">{empty}</div>
        ) : (
          <DataTable<Row> data={rows} columns={columns} getRowId={(r) => r.id} selectable={false} searchable={false} showQueryControls={false} edgeInset={false} emptyState={empty} />
        )}
      </LibraryCard>

      {kind === "tag" && mounted ? <TagReach /> : null}

      {editor ? (
        <TaxonDialog
          key={editor.id ?? "new"}
          kind={kind}
          existing={editing ? { id: editing.id, name: editing.name, description: editing.description, active: editing.active } : null}
          names={items.filter((x) => x.id !== editor.id).map((x) => x.name)}
          onClose={close}
          onSave={({ name, description, active }) => {
            const r = run((d) => {
              const step = editing ? updateTaxon(d, kind, editing.id, { name, description }) : createTaxon(d, kind, { name, description })
              if (!step.ok) return step
              const id = editing ? editing.id : (step.value as { id: string }).id
              const wasActive = editing ? editing.active : true
              return active === wasActive ? step : setTaxonActive(step.db, kind, id, active)
            })
            if (r.ok) banners.push({ variant: "success", text: editing ? X.updated(name) : X.added(name) })
            return r.ok ? null : { message: r.error.message }
          }}
        />
      ) : null}
    </>
  )
}

/** Tags tab: where each tag reaches. A tag that spans categories does a job a category cannot (RP-04 supports it). */
function TagReach() {
  const db = useDb()
  const rows = tagRows(db).filter((r) => r.skillCount > 0)
  if (rows.length === 0) return null
  return (
    <LibraryCard icon="fa-tag" title={r1.reach.title} subtitle={r1.reach.subtitle} headingId="tag-reach-heading">
      <ul>
        {rows.map((r, i) => (
          <li key={r.item.id} className={`flex flex-col gap-2 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{r.item.active ? r.item.name : `${r.item.name} (inactive)`}</Badge>
              <span className="text-xs text-muted-foreground">
                {r1.reach.summary(r.skillCount, r.categoriesSpanned)}
                {r.skills.some((s) => !s.active) ? ` ${X.reachIncludesInactive}` : ""}
              </span>
            </div>
            <ul className="flex flex-wrap gap-1.5" aria-label={`Skills with tag ${r.item.name}`}>
              {r.skills.map((s) => (
                <li key={s.id}>
                  <Badge variant="outline">{s.name}</Badge>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </LibraryCard>
  )
}

