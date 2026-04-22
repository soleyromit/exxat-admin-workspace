"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { FieldGroup } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectionTileGrid, type SelectionTileOption } from "@/components/ui/selection-tile-grid"
import { useAppTheme, type Brand, type TextSizePreference } from "@/hooks/use-app-theme"
import { useDashboardView, type DashboardView } from "@/contexts/dashboard-view-context"
import { useChartVariant, type ChartVariant } from "@/contexts/chart-variant-context"
import { SettingsFormRow } from "@/components/settings-form-row"
import { cn } from "@/lib/utils"

function RadioRow({
  value,
  id,
  label,
  iconClass,
}: {
  value: string
  id: string
  label: string
  iconClass?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <RadioGroupItem value={value} id={id} className="shrink-0" />
      <Label htmlFor={id} className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal">
        {iconClass ? (
          <i className={cn("fa-light w-4 shrink-0 text-center text-muted-foreground", iconClass)} aria-hidden="true" />
        ) : null}
        {label}
      </Label>
    </div>
  )
}

/** Illustrative split sidebars when “system” shows light+dark (tokens follow active brand hue). */
const SPLIT_SIDEBAR: Record<Brand, { light: string; dark: string }> = {
  one: { light: "oklch(0.935 0.024 286.1)", dark: "oklch(0.38 0.09 286.1)" },
  prism: { light: "oklch(0.96 0.04 342)", dark: "oklch(0.4 0.14 342)" },
}

const THEME_SVG_CLASS = "h-12 w-auto max-w-[9rem] shrink-0"

/** Fixed palettes per labeled mode — do not use `var(--background)` etc. (those follow the *current* theme). */
const CHROME_LIGHT = {
  shell: "oklch(1 0 0)",
  shellStroke: "oklch(0.90 0.003 270)",
  headerBar: "oklch(0.93 0.004 270)",
  content: "oklch(0.96 0.004 270)",
} as const

const CHROME_DARK = {
  shell: "oklch(0.12 0.01 270)",
  shellStroke: "oklch(0.38 0.02 270)",
  headerBar: "oklch(0.22 0.02 270)",
  content: "oklch(0.17 0.015 270)",
} as const

/** Mini browser chrome: illustrative light / dark / split (brand sidebars from SPLIT_SIDEBAR). */
function ThemeModeSvg({ mode, brand }: { mode: "system" | "light" | "dark"; brand: Brand }) {
  const split = SPLIT_SIDEBAR[brand]
  if (mode === "light") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.light} />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill={CHROME_LIGHT.headerBar} />
        <rect x="19" y="14" width="34" height="14" rx="2" fill={CHROME_LIGHT.content} />
      </svg>
    )
  }
  if (mode === "dark") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_DARK.shell} stroke={CHROME_DARK.shellStroke} />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.dark} />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill={CHROME_DARK.headerBar} />
        <rect x="19" y="14" width="34" height="14" rx="2" fill={CHROME_DARK.content} />
      </svg>
    )
  }
  return (
    <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="26" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
      <rect x="3" y="3" width="10" height="26" rx="1.5" fill={split.light} />
      <rect x="15" y="6" width="10" height="4" rx="0.75" fill={CHROME_LIGHT.headerBar} />
      <rect x="15" y="13" width="10" height="14" rx="1.5" fill={CHROME_LIGHT.content} />
      <rect x="28.5" y="0.5" width="27" height="31" rx="4" fill={CHROME_DARK.shell} stroke={CHROME_DARK.shellStroke} />
      <rect x="31" y="3" width="10" height="26" rx="1.5" fill={split.dark} />
      <rect x="43" y="6" width="10" height="4" rx="0.75" fill={CHROME_DARK.headerBar} />
      <rect x="43" y="13" width="10" height="14" rx="1.5" fill={CHROME_DARK.content} />
    </svg>
  )
}

const HC_STROKE = "oklch(0.22 0.02 270)"

/** Illustrative light chrome; stroke weight shows contrast (not tied to active color theme). */
function ContrastPrefSvg({ pref, brand }: { pref: "system" | "normal" | "high"; brand: Brand }) {
  const split = SPLIT_SIDEBAR[brand]
  if (pref === "normal") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect
          x="0.5"
          y="0.5"
          width="55"
          height="31"
          rx="4"
          fill={CHROME_LIGHT.shell}
          stroke={CHROME_LIGHT.shellStroke}
          strokeWidth="1"
        />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.light} />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill={CHROME_LIGHT.headerBar} />
        <rect x="19" y="14" width="34" height="14" rx="2" fill={CHROME_LIGHT.content} />
      </svg>
    )
  }
  if (pref === "high") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect
          x="0.5"
          y="0.5"
          width="55"
          height="31"
          rx="4"
          fill={CHROME_LIGHT.shell}
          stroke={HC_STROKE}
          strokeWidth="2"
        />
        <rect
          x="3"
          y="3"
          width="13"
          height="26"
          rx="2"
          fill={split.light}
          stroke={HC_STROKE}
          strokeWidth="1.5"
        />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill="oklch(0.35 0.02 270)" opacity="0.35" />
        <rect x="19" y="14" width="34" height="14" rx="2" fill="oklch(0.35 0.02 270)" opacity="0.22" />
      </svg>
    )
  }
  return (
    <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="26" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} strokeWidth="1" />
      <rect x="3" y="3" width="10" height="26" rx="1.5" fill={split.light} />
      <rect x="15" y="6" width="10" height="4" rx="0.75" fill={CHROME_LIGHT.headerBar} />
      <rect x="15" y="13" width="10" height="14" rx="1.5" fill={CHROME_LIGHT.content} />
      <rect x="28.5" y="0.5" width="27" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={HC_STROKE} strokeWidth="2" />
      <rect x="31" y="3" width="10" height="26" rx="1.5" fill={split.light} stroke={HC_STROKE} strokeWidth="1.5" />
      <rect x="43" y="6" width="10" height="4" rx="0.75" fill="oklch(0.35 0.02 270)" opacity="0.35" />
      <rect x="43" y="13" width="10" height="14" rx="1.5" fill="oklch(0.35 0.02 270)" opacity="0.22" />
    </svg>
  )
}

const CHART_LABELS: Record<ChartVariant, string> = {
  normal: "Normal",
  tabs: "With tabs",
  selector: "With filters",
  "metrics-tabs": "Tabs + metrics",
  "kpi-chart": "KPI + chart",
}

const VIEW_LABELS: Record<DashboardView, string> = {
  report: "Report",
  simple: "Simple",
  mix: "Mix",
}

const VIEW_STROKE = "oklch(0.78 0.01 270)"
const VIEW_FILL_STRONG = "oklch(0.82 0.02 270)"
const VIEW_FILL_SOFT = "oklch(0.90 0.008 270)"

/** Illustrative dashboard layout previews — same chrome, different content grid. */
function DashboardViewSvg({ view }: { view: DashboardView }) {
  if (view === "report") {
    // Chart card + two-column data rows below.
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
        <rect x="3" y="3" width="50" height="12" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
        {/* bars inside chart */}
        <rect x="6" y="9" width="2" height="5" fill={VIEW_FILL_STRONG} />
        <rect x="10" y="7" width="2" height="7" fill={VIEW_FILL_STRONG} />
        <rect x="14" y="10" width="2" height="4" fill={VIEW_FILL_STRONG} />
        <rect x="18" y="6" width="2" height="8" fill={VIEW_FILL_STRONG} />
        <rect x="22" y="8" width="2" height="6" fill={VIEW_FILL_STRONG} />
        <rect x="26" y="5" width="2" height="9" fill={VIEW_FILL_STRONG} />
        <rect x="30" y="9" width="2" height="5" fill={VIEW_FILL_STRONG} />
        {/* rows */}
        <rect x="3" y="18" width="24" height="4" rx="1" fill={VIEW_FILL_SOFT} />
        <rect x="29" y="18" width="24" height="4" rx="1" fill={VIEW_FILL_SOFT} />
        <rect x="3" y="24" width="24" height="4" rx="1" fill={VIEW_FILL_SOFT} />
        <rect x="29" y="24" width="24" height="4" rx="1" fill={VIEW_FILL_SOFT} />
      </svg>
    )
  }
  if (view === "simple") {
    // 2×3 KPI grid — clean tiles.
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
        {[0, 1, 2].map((col) => (
          <React.Fragment key={col}>
            <rect x={3 + col * 17} y="3" width="16" height="12" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
            <rect x={3 + col * 17} y="17" width="16" height="12" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
          </React.Fragment>
        ))}
      </svg>
    )
  }
  // mix — one big chart + 3 KPI tiles
  return (
    <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
      <rect x="3" y="3" width="32" height="26" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
      {/* sparkline */}
      <path d="M5 22 L10 16 L15 19 L20 12 L25 15 L30 9 L33 13" stroke={VIEW_FILL_STRONG} strokeWidth="1" fill="none" />
      {/* side KPIs */}
      <rect x="37" y="3" width="16" height="8" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
      <rect x="37" y="12" width="16" height="8" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
      <rect x="37" y="21" width="16" height="8" rx="1.5" fill={VIEW_FILL_SOFT} stroke={VIEW_STROKE} strokeWidth="0.5" />
    </svg>
  )
}

const BRAND_TILES: readonly SelectionTileOption<"one" | "prism">[] = [
  {
    value: "one",
    label: "One",
    leading: (
      <span
        className="size-10 shrink-0 rounded-full bg-[var(--brand-preview-one)] ring-1 ring-inset ring-border/60"
        aria-hidden="true"
      />
    ),
  },
  {
    value: "prism",
    label: "Prism",
    leading: (
      <span
        className="size-10 shrink-0 rounded-full bg-[var(--brand-preview-prism)] ring-1 ring-inset ring-border/60"
        aria-hidden="true"
      />
    ),
  },
]

const THEME_CHOICE_LABEL: Record<"system" | "light" | "dark", string> = {
  system: "System default",
  light: "Light",
  dark: "Dark",
}

const TEXT_SIZE_LABEL: Record<TextSizePreference, string> = {
  compact: "Tiny",
  default: "Default",
  large: "Large",
}

export function SettingsAppearanceCard() {
  const { theme, setTheme } = useTheme()
  const { brand, setBrand, contrastPref, setContrast, textSizePref, setTextSize, mounted } = useAppTheme()
  const { activeView, setActiveView } = useDashboardView()
  const { chartVariant, setChartVariant } = useChartVariant()

  const safeTheme = mounted ? ((theme ?? "system") as "system" | "light" | "dark") : "system"
  const safeBrand = mounted ? brand : "one"
  const safeContrast = mounted ? contrastPref : "system"
  const safeTextSize = mounted ? textSizePref : "default"

  const themeTiles = React.useMemo(
    () =>
      (["system", "light", "dark"] as const).map((m) => ({
        value: m,
        label: THEME_CHOICE_LABEL[m],
        leading: <ThemeModeSvg mode={m} brand={safeBrand} />,
      })),
    [safeBrand],
  )

  const contrastTiles = React.useMemo(
    () =>
      (["system", "normal", "high"] as const).map((p) => ({
        value: p,
        label: p === "system" ? "System" : p === "normal" ? "Normal" : "High",
        leading: <ContrastPrefSvg pref={p} brand={safeBrand} />,
      })),
    [safeBrand],
  )

  const textSizeTiles = React.useMemo(
    () =>
      (["compact", "default", "large"] as const).map((v) => ({
        value: v,
        label: TEXT_SIZE_LABEL[v],
        leading: (
          <span
            className={cn(
              "font-semibold leading-none text-foreground",
              v === "compact" && "text-xs",
              v === "default" && "text-sm",
              v === "large" && "text-base",
            )}
            aria-hidden
          >
            Aa
          </span>
        ),
      })),
    [],
  )

  return (
    <section id="appearance" className="scroll-mt-20">
      <header className="mb-8 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Appearance &amp; display</h2>
        <p className="text-sm text-muted-foreground">Saved in this browser.</p>
      </header>
      <div>
        {!mounted ? (
          <p className="text-sm text-muted-foreground">Loading theme…</p>
        ) : (
          <FieldGroup className="gap-8">
            <SettingsFormRow label="Theme" description="Light, dark, or match your OS.">
              <SelectionTileGrid<"system" | "light" | "dark">
                className="w-full"
                options={themeTiles}
                columns={3}
                value={safeTheme}
                onValueChange={(v) => setTheme(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow label="Contrast">
              <SelectionTileGrid<"system" | "normal" | "high">
                className="w-full"
                options={contrastTiles}
                columns={3}
                value={safeContrast}
                onValueChange={(v) => setContrast(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Text size"
              description="Scales UI text from the root (like iOS/Android accessibility size). Tiny still enforces an 11px floor for labels."
            >
              <SelectionTileGrid<TextSizePreference>
                className="w-full"
                options={textSizeTiles}
                columns={3}
                value={safeTextSize}
                onValueChange={(v) => setTextSize(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow label="Product brand">
              <SelectionTileGrid<"one" | "prism">
                className="w-full"
                options={BRAND_TILES}
                columns={2}
                value={safeBrand}
                onValueChange={(v) => setBrand(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow label="Dashboard layout" description="Default dashboard tab.">
              <RadioGroup
                value={activeView}
                onValueChange={(v) => setActiveView(v as DashboardView)}
                className="flex flex-col gap-3"
                aria-label="Dashboard view"
              >
                <RadioRow value="report" id="dash-report" label={VIEW_LABELS.report} iconClass="fa-chart-mixed" />
                <RadioRow value="simple" id="dash-simple" label={VIEW_LABELS.simple} iconClass="fa-grid-2" />
                <RadioRow value="mix" id="dash-mix" label={VIEW_LABELS.mix} iconClass="fa-layer-group" />
              </RadioGroup>
            </SettingsFormRow>

            <SettingsFormRow label="Chart style" htmlFor="settings-chart-style">
              <Select
                value={chartVariant}
                onValueChange={(v) => setChartVariant(v as ChartVariant)}
              >
                <SelectTrigger id="settings-chart-style" className="w-full">
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHART_LABELS) as ChartVariant[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CHART_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingsFormRow>
          </FieldGroup>
        )}
      </div>
    </section>
  )
}
