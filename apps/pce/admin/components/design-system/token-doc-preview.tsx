"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsCountBadge, TabsList, TabsListScrollRegion, TabsTrigger } from "@/components/ui/tabs"
import { Tip } from "@/components/ui/tip"
import {
  categoryPreview,
  primaryValueText,
  useTokenClipboard,
  type TokenRecord,
} from "@/components/tokens-themes-section"
import {
  getTokenDocFilter,
  listDocTokens,
} from "@/lib/design-system/token-doc-registry"
import {
  groupDocTokens,
  l0TokenRole,
  prefixFilterForSlug,
  tokenDocDerivedLabel,
  tokenDocIntroForSlug,
  type TokenDocEntry,
  type TokenDocGroup,
} from "@/lib/design-system/token-doc-grouping"
import {
  DS_DOC_BODY,
  DS_DOC_CODE_LABEL,
  DS_DOC_TABLE_META,
} from "@/lib/design-system/doc-typography"
import { ScrollRegion } from "@/components/ui/scroll-region"
import { cn } from "@/lib/utils"

function TokenDocTile({
  name,
  record,
  onCopy,
  copiedNow,
  density = "wide",
}: {
  name: string
  record: TokenRecord
  onCopy: (text: string) => void
  copiedNow: boolean
  density?: "tight" | "wide"
}) {
  const cssRef = `var(${name})`
  const raw = primaryValueText(record)
  const derivedLabel = tokenDocDerivedLabel(record, name)
  const role = record.category === "alias" ? l0TokenRole(name) : null

  return (
    <div
      className={cn(
        "group flex items-stretch gap-3 rounded-md border border-border bg-card p-3 transition-colors",
        "hover:border-brand/40 hover:bg-interactive-hover-soft",
      )}
    >
      <div className={cn("shrink-0", density === "tight" ? "w-14" : "w-20")}>
        {categoryPreview(name, record)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <code className={cn("truncate tabular-nums", DS_DOC_CODE_LABEL)}>{name}</code>
          {record.deprecated ? (
            <Badge variant="destructive" className="h-5 shrink-0 px-1.5 text-xs">
              deprecated
            </Badge>
          ) : null}
          {derivedLabel ? (
            <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-xs">
              {derivedLabel}
            </Badge>
          ) : null}
        </div>
        <div className={cn("mt-0.5", DS_DOC_TABLE_META)}>
          {role ? (
            <span className="text-foreground">{role}</span>
          ) : (
            <span className="rounded-sm bg-muted/60 px-1.5 py-0.5">{record.namespace}</span>
          )}
        </div>
        <div className={cn("mt-1 truncate", DS_DOC_TABLE_META)} title={raw}>
          {raw || "—"}
        </div>
      </div>
      <Tip side="left" label={copiedNow ? `Copied ${cssRef}` : `Copy ${cssRef}`}>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 self-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => onCopy(cssRef)}
          aria-label={`Copy ${cssRef}`}
        >
          <i
            className={cn("text-sm", copiedNow ? "fa-light fa-check" : "fa-light fa-copy")}
            aria-hidden="true"
          />
        </Button>
      </Tip>
    </div>
  )
}

const L0_SLOT_ROWS: { slot: string; numberMeans: string; role: string; resolves: string }[] = [
  {
    slot: "surface-1",
    numberMeans: "Lowest elevation — full-page canvas",
    role: "App background",
    resolves: "--background",
  },
  {
    slot: "surface-2",
    numberMeans: "One step up — contained panel",
    role: "Card / raised block",
    resolves: "--card",
  },
  {
    slot: "surface-3",
    numberMeans: "Highest elevation — floating layer",
    role: "Popover / menu surface",
    resolves: "--popover",
  },
  {
    slot: "ink-1",
    numberMeans: "Strongest text step — default reading ink",
    role: "Primary body copy",
    resolves: "--foreground",
  },
  {
    slot: "ink-2",
    numberMeans: "Next step down — de-emphasized copy",
    role: "Meta, captions, placeholders",
    resolves: "--muted-foreground",
  },
  {
    slot: "ink-on-surface-2",
    numberMeans: "Ink matched to surface-2 fill",
    role: "Text on cards",
    resolves: "--card-foreground",
  },
  {
    slot: "brand-1 … brand-3",
    numberMeans: "Brand accent scale (solid → dark → light)",
    role: "Product accent fills",
    resolves: "--brand-color / -dark / -light",
  },
]

/** Why L0 uses numbered slots (ink-1, surface-1) — shown before alias grids. */
export function L0SlotNamingExplainer() {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/30 p-4">
      <div className="flex flex-col gap-2">
        <p className={cn("font-medium text-foreground", DS_DOC_BODY)}>What the number means</p>
        <p className={DS_DOC_BODY}>
          The suffix is an <strong className="font-medium text-foreground">ordered step</strong> on a
          ladder — not a random ID and not a hex shade.{" "}
          <code className="font-mono text-sm">1</code> is always the default or strongest position in
          that family; each higher number is the next rung (de-emphasized text, higher surface
          elevation, or the next brand stop).
        </p>
        <ul className={cn("list-disc space-y-1 pl-5", DS_DOC_BODY)}>
          <li>
            <strong className="font-medium text-foreground">surface-N</strong> — paint ladder.{" "}
            <code className="font-mono text-sm">1</code> = page canvas,{" "}
            <code className="font-mono text-sm">2</code> = card,{" "}
            <code className="font-mono text-sm">3</code> = floating popover.
          </li>
          <li>
            <strong className="font-medium text-foreground">ink-N</strong> — text emphasis ladder.{" "}
            <code className="font-mono text-sm">1</code> = primary body,{" "}
            <code className="font-mono text-sm">2</code> = muted meta. (Only two ink steps today —
            there is no <code className="font-mono text-sm">ink-3</code> until a third emphasis tier
            is defined.)
          </li>
          <li>
            <strong className="font-medium text-foreground">ink-on-surface-N</strong> — text ink
            chosen for a specific surface step (e.g. copy on a card uses the same{" "}
            <code className="font-mono text-sm">N</code> as <code className="font-mono text-sm">surface-N</code>
            ).
          </li>
          <li>
            <strong className="font-medium text-foreground">brand-N</strong> — accent scale steps,
            not elevation.
          </li>
        </ul>
        <p className={DS_DOC_BODY}>
          L0 names describe <em>role + step</em> (
          <code className="font-mono text-sm">--exxat-color-ink-1</code>). L1 names below keep the
          legacy semantic labels (
          <code className="font-mono text-sm">--foreground</code>) that hold the actual OKLCH values.
          Full map: <code className="font-mono text-sm">token-taxonomy.md</code> §2.0.
        </p>
      </div>
      <ScrollRegion label="Token reference table" className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={cn("py-2 pr-3 font-medium", DS_DOC_TABLE_META)}>L0 slot</th>
              <th className={cn("py-2 pr-3 font-medium", DS_DOC_TABLE_META)}>What N means</th>
              <th className={cn("py-2 pr-3 font-medium", DS_DOC_TABLE_META)}>Use for</th>
              <th className={cn("py-2 font-medium", DS_DOC_TABLE_META)}>Resolves to (L1)</th>
            </tr>
          </thead>
          <tbody>
            {L0_SLOT_ROWS.map((row) => (
              <tr key={row.slot} className="border-b border-border/60 last:border-0">
                <td className="py-2 pr-3 font-mono text-xs">{row.slot}</td>
                <td className={cn("py-2 pr-3", DS_DOC_BODY)}>{row.numberMeans}</td>
                <td className={cn("py-2 pr-3", DS_DOC_BODY)}>{row.role}</td>
                <td className={cn("py-2 font-mono text-xs", DS_DOC_TABLE_META)}>{row.resolves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  )
}

function TokenDocGrid({
  entries,
  dense,
  copied,
  onCopy,
}: {
  entries: TokenDocEntry[]
  dense: boolean
  copied: string | null
  onCopy: (text: string) => void
}) {
  const gridClass = dense
    ? "grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"
    : "grid grid-cols-1 gap-2 md:grid-cols-2"

  return (
    <div className={gridClass}>
      {entries.map(({ name, record }) => (
        <TokenDocTile
          key={name}
          name={name}
          record={record}
          onCopy={onCopy}
          copiedNow={copied === `var(${name})`}
          density={dense ? "tight" : "wide"}
        />
      ))}
    </div>
  )
}

function TokenCategoryTabs({
  groups,
  dense,
  copied,
  onCopy,
}: {
  groups: TokenDocGroup[]
  dense: boolean
  copied: string | null
  onCopy: (text: string) => void
}) {
  const [active, setActive] = React.useState(groups[0]?.id ?? "all")

  React.useEffect(() => {
    if (!groups.some((g) => g.id === active)) {
      setActive(groups[0]?.id ?? "all")
    }
  }, [groups, active])

  return (
    <Tabs value={active} onValueChange={setActive} className="flex flex-col gap-6">
      <TabsListScrollRegion ariaLabel="Token groups">
        <TabsList className="w-fit">
          {groups.map((group) => (
            <TabsTrigger key={group.id} value={group.id}>
              {group.label}
              <TabsCountBadge count={group.tokens.length} />
            </TabsTrigger>
          ))}
        </TabsList>
      </TabsListScrollRegion>
      {groups.map((group) => (
        <TabsContent key={group.id} value={group.id} className="mt-0">
          <TokenDocGrid
            entries={group.tokens}
            dense={dense}
            copied={copied}
            onCopy={onCopy}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

/**
 * Token category doc body — one scroll owner, namespace tabs on large lists.
 */
export function DesignSystemTokenCategoryPreview({
  slug,
  showL0Naming = false,
  showIntro = true,
}: {
  slug: string
  /** When true, show the L0 slot ladder explainer above the grid (alias pages). */
  showL0Naming?: boolean
  showIntro?: boolean
}) {
  const filter = getTokenDocFilter(slug)
  const { copied, copy } = useTokenClipboard()
  const tokens = React.useMemo(
    () => (filter ? listDocTokens(filter) : []),
    [filter],
  )

  const { groups, useCategoryTabs } = React.useMemo(
    () => groupDocTokens(tokens, { slug, prefixFilter: prefixFilterForSlug(slug) }),
    [tokens, slug],
  )

  const isTypography = filter?.kind === "category" && filter.categoryId === "typography"
  const intro = tokenDocIntroForSlug(slug)
  const dense = filter?.kind === "category" && filter.categoryId === "color"

  if (!filter) {
    return <p className={DS_DOC_BODY}>No token filter registered for this doc page.</p>
  }

  if (tokens.length === 0) {
    return <p className={DS_DOC_BODY}>No tokens match this category in the design token index.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {showIntro && intro ? <p className={DS_DOC_BODY}>{intro}</p> : null}

      {showL0Naming ? <L0SlotNamingExplainer /> : null}

      {isTypography ? (
        <p className={DS_DOC_BODY}>
          Ten indexed tokens — two font families (<code className="font-mono text-sm">--font-*</code>)
          and four named sizes with line heights (<code className="font-mono text-sm">--text-*</code>).
          Product UI also uses Tailwind utilities <code className="font-mono text-sm">text-sm</code>{" "}
          (14px), <code className="font-mono text-sm">text-base</code> (16px),{" "}
          <code className="font-mono text-sm">text-lg</code>, and weight utilities — those follow the
          default rem scale and are not separate CSS variables in{" "}
          <code className="font-mono text-sm">hooks-index.json</code>.
        </p>
      ) : null}

      <p className={DS_DOC_BODY}>
        {tokens.length.toLocaleString()} token{tokens.length === 1 ? "" : "s"} in index
        {useCategoryTabs ? " · grouped by taxonomy family" : ""}
        {" · "}
        Click copy on a row for <code className="font-mono text-sm">var(--token)</code>
        {" · "}
        Use Preview modes in the breadcrumb bar for light / dark / HC.
      </p>

      {useCategoryTabs ? (
        <TokenCategoryTabs groups={groups} dense={dense} copied={copied} onCopy={copy} />
      ) : (
        <TokenDocGrid entries={groups[0]?.tokens ?? tokens} dense={dense} copied={copied} onCopy={copy} />
      )}
    </div>
  )
}
