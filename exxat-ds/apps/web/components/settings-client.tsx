"use client"

/**
 * SettingsClient — System banner + coach mark utilities.
 *
 * Provides:
 *   • System banner: edit copy, variant, action link, dismissibility; Apply / Discard / Reset
 *   • Coach marks: list flows, reset, preview on target page
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SystemBanner } from "@/components/ui/banner"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import { COACH_MARK_FLOWS, type CoachMarkFlowDef } from "@/lib/coach-mark-registry"
import {
  resetCoachMarkFlow,
  resetAllCoachMarks,
} from "@/hooks/use-coach-mark"
import {
  useSystemBanner,
  type SystemBannerConfig,
  type SystemBannerVariant,
} from "@/contexts/system-banner-context"
import { SettingsAppearanceCard } from "@/components/settings-appearance-card"
import { SettingsFormRow } from "@/components/settings-form-row"
import { FieldGroup } from "@/components/ui/field"

const SYSTEM_BANNER_VARIANTS: SystemBannerVariant[] = [
  "info",
  "warning",
  "error",
  "success",
  "promo",
]

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const STORAGE_PREFIX = "exxat-coach-mark:"

function isFlowDismissed(flowId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${flowId}`) === "dismissed"
  } catch {
    return false
  }
}

/* ── Flow card ──────────────────────────────────────────────────────────── */

function FlowCard({
  flow,
  dismissed,
  onReset,
  onPreview,
}: {
  flow: CoachMarkFlowDef
  dismissed: boolean
  onReset: () => void
  onPreview: () => void
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-interactive-hover-soft">
      {/* Icon */}
      <span
        className={cn(
          "shrink-0 flex h-10 w-10 items-center justify-center rounded-lg text-sm",
          dismissed
            ? "bg-muted text-muted-foreground"
            : "bg-brand/12 text-brand"
        )}
        aria-hidden="true"
      >
        <i className={cn("fa-light", dismissed ? "fa-circle-check" : "fa-route")} />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground">{flow.name}</h3>
          <Badge variant={dismissed ? "secondary" : "default"} className="text-xs h-5">
            {dismissed ? "Completed" : "Active"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          {flow.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <i className="fa-light fa-file text-xs" aria-hidden="true" />
            {flow.page}
          </span>
          <span className="flex items-center gap-1">
            <i className="fa-light fa-list-ol text-xs" aria-hidden="true" />
            {flow.stepCount} steps
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Tip side="bottom" label="Reset and replay this tour">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onReset}
            className="h-8 text-xs gap-1.5"
          >
            <i className="fa-light fa-rotate-left text-xs" aria-hidden="true" />
            Reset
          </Button>
        </Tip>
        <Tip side="bottom" label={`Go to ${flow.page} to preview`}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onPreview}
            className="h-8 text-xs gap-1.5"
          >
            <i className="fa-light fa-arrow-up-right text-xs" aria-hidden="true" />
            Preview
          </Button>
        </Tip>
      </div>
    </div>
  )
}

/* ── System banner editor ───────────────────────────────────────────────── */

function SystemBannerSettingsCard() {
  const { config, applyConfig, reset } = useSystemBanner()
  const [draft, setDraft] = React.useState<SystemBannerConfig>(() => ({ ...config }))
  const dirty = React.useMemo(() => JSON.stringify(draft) !== JSON.stringify(config), [draft, config])

  React.useEffect(() => {
    setDraft({ ...config })
  }, [config])

  return (
    <section id="banner" className="scroll-mt-20">
      <header className="mb-8 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">System banner &amp; alerts</h2>
        <p className="text-sm text-muted-foreground">
          Top-of-app strip for maintenance, promos, and notices. Stored locally as{" "}
          <span className="font-mono text-xs">exxat:system-banner-config</span>.
        </p>
      </header>
      <div className="flex flex-col gap-8">
        <FieldGroup className="gap-8">
          <SettingsFormRow
            label="Show banner"
            description="When off, the strip stays hidden until you turn it back on."
            htmlFor="banner-enabled"
          >
            <ToggleSwitch
              id="banner-enabled"
              checked={draft.enabled}
              onChange={(enabled) => setDraft((d) => ({ ...d, enabled }))}
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Variant"
            description="Info, warning, error, success, or promo styling for the strip."
            htmlFor="banner-variant"
          >
            <Select
              value={draft.variant}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, variant: v as SystemBannerVariant }))
              }
            >
              <SelectTrigger id="banner-variant" className="w-full">
                <SelectValue placeholder="Variant" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_BANNER_VARIANTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsFormRow>

          <SettingsFormRow label="Title" description="Short headline shown in the strip." htmlFor="banner-title">
            <Input
              id="banner-title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Short headline"
              autoComplete="off"
              className="w-full"
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Message"
            description="Supporting line under the title (optional if you only want a title)."
            htmlFor="banner-message"
          >
            <Textarea
              id="banner-message"
              value={draft.message}
              onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
              placeholder="Supporting line shown under the title"
              rows={3}
              className="min-h-[4.5rem] w-full resize-y"
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Action label"
            description="Optional button text, e.g. Learn more."
            htmlFor="banner-action-label"
          >
            <Input
              id="banner-action-label"
              value={draft.actionLabel ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  actionLabel: e.target.value.trim() ? e.target.value : undefined,
                }))
              }
              placeholder="Learn more"
              autoComplete="off"
              className="w-full"
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Action URL"
            description="Where the action button navigates (https link or #)."
            htmlFor="banner-action-href"
          >
            <Input
              id="banner-action-href"
              value={draft.actionHref ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  actionHref: e.target.value.trim() ? e.target.value : undefined,
                }))
              }
              placeholder="https://… or #"
              autoComplete="off"
              className="w-full"
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Allow dismiss"
            description="Shows a close control; dismissing turns the banner off."
            htmlFor="banner-dismissible"
          >
            <ToggleSwitch
              id="banner-dismissible"
              checked={draft.dismissible}
              onChange={(dismissible) => setDraft((d) => ({ ...d, dismissible }))}
            />
          </SettingsFormRow>

          <SettingsFormRow label="Preview" description="Approximates the live strip above your sidebar.">
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 w-full">
              {draft.enabled ? (
                <SystemBanner
                  variant={draft.variant}
                  title={draft.title || undefined}
                  dismissible={false}
                  action={
                    draft.actionLabel
                      ? { label: draft.actionLabel, href: draft.actionHref || "#" }
                      : undefined
                  }
                >
                  {draft.message || (draft.title ? "" : "…")}
                </SystemBanner>
              ) : (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  Banner hidden — turn on “Show banner” to preview.
                </p>
              )}
            </div>
          </SettingsFormRow>
        </FieldGroup>

        <div className="flex flex-wrap items-center gap-2 pt-8">
          <Button
            type="button"
            size="sm"
            disabled={!dirty}
            onClick={() => applyConfig({ ...draft })}
          >
            Apply to system banner
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dirty}
            onClick={() => setDraft({ ...config })}
          >
            Discard changes
          </Button>
          <Tip side="top" label="Restore the default copy and turn the banner on">
            <Button type="button" size="sm" variant="ghost" onClick={() => reset()}>
              Reset to defaults
            </Button>
          </Tip>
        </div>
      </div>
    </section>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */

function buildFlowStatuses() {
  return COACH_MARK_FLOWS.map((f) => ({
    flow: f,
    dismissed: isFlowDismissed(f.id),
  }))
}

export function SettingsClient() {
  const router = useRouter()

  /** SSR + first client paint: all undismissed so markup matches; sync from storage after mount. */
  const [flowStatuses, setFlowStatuses] = React.useState(() =>
    COACH_MARK_FLOWS.map((f) => ({ flow: f, dismissed: false })),
  )

  React.useEffect(() => {
    setFlowStatuses(buildFlowStatuses())
  }, [])

  const completedCount = flowStatuses.filter((f) => f.dismissed).length
  const totalCount = flowStatuses.length

  function refreshFlowStatuses() {
    setFlowStatuses(buildFlowStatuses())
  }

  function handleResetFlow(flowId: string) {
    resetCoachMarkFlow(flowId)
    refreshFlowStatuses()
  }

  function handleResetAll() {
    resetAllCoachMarks()
    refreshFlowStatuses()
  }

  function handlePreview(pageUrl: string, flowId: string) {
    resetCoachMarkFlow(flowId)
    refreshFlowStatuses()
    router.push(pageUrl)
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight leading-tight text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Preferences and tools for this workspace. Display options apply on this device and are stored in your browser.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-20">
        <section id="account" className="scroll-mt-20">
          <header className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Account</h2>
            <p className="text-sm text-muted-foreground">
              Profile, billing, and notification shortcuts still live in the sidebar avatar menu.
            </p>
          </header>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Use <span className="font-medium text-foreground">your avatar</span> at the bottom of the left sidebar for
            account details, billing, and alerts. This page focuses on app-wide display and onboarding preferences.
          </p>
        </section>

        <SettingsAppearanceCard />

        <SystemBannerSettingsCard />

        <section id="tours" className="scroll-mt-20">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Guided tours</h2>
              <p className="text-sm text-muted-foreground">
                Tours start when you first open a page, highlight one control at a time, and stop after you finish or
                skip. They won’t repeat until you reset them here.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-xs text-muted-foreground">
                {completedCount}/{totalCount} completed
              </span>
              <Tip side="bottom" label="Reset all tours so they replay on next visit">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResetAll}
                  className="h-8 gap-1.5 text-xs"
                >
                  <i className="fa-light fa-rotate-left text-xs" aria-hidden="true" />
                  Reset all
                </Button>
              </Tip>
            </div>
          </header>

          <div className="flex flex-col gap-3">
            {flowStatuses.map(({ flow, dismissed }) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                dismissed={dismissed}
                onReset={() => handleResetFlow(flow.id)}
                onPreview={() => handlePreview(flow.pageUrl, flow.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
