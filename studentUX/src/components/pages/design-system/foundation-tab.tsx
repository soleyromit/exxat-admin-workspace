import * as React from "react";
import { Separator } from "../../ui/separator";

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="px-2 py-1 text-xs rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Section header ────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {label}
    </h3>
  );
}

// ─── Color tokens ─────────────────────────────────────────────────────────

const semanticColors = [
  { name: "background", tw: "bg-background border border-border", label: "Background" },
  { name: "foreground", tw: "bg-foreground", label: "Foreground" },
  { name: "primary", tw: "bg-primary", label: "Primary" },
  { name: "primary-foreground", tw: "bg-primary-foreground border border-border", label: "Primary Fg" },
  { name: "secondary", tw: "bg-secondary", label: "Secondary" },
  { name: "muted", tw: "bg-muted", label: "Muted" },
  { name: "accent", tw: "bg-accent", label: "Accent" },
  { name: "destructive", tw: "bg-destructive", label: "Destructive" },
  { name: "border", tw: "bg-border", label: "Border" },
  { name: "card", tw: "bg-card border border-border", label: "Card" },
];

const chartColors = [
  { name: "chart-1", tw: "bg-chart-1", label: "Chart 1" },
  { name: "chart-2", tw: "bg-chart-2", label: "Chart 2" },
  { name: "chart-3", tw: "bg-chart-3", label: "Chart 3" },
  { name: "chart-4", tw: "bg-chart-4", label: "Chart 4" },
  { name: "chart-5", tw: "bg-chart-5", label: "Chart 5" },
];

const sidebarColors = [
  { name: "sidebar", tw: "bg-sidebar border border-border", label: "Sidebar" },
  { name: "sidebar-accent", tw: "bg-sidebar-accent", label: "Sidebar Accent" },
  { name: "sidebar-primary", tw: "bg-sidebar-primary", label: "Sidebar Primary" },
  { name: "sidebar-border", tw: "bg-sidebar-border", label: "Sidebar Border" },
];

function ColorSwatch({ name, tw, label }: { name: string; tw: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-12 w-full rounded-lg ${tw}`} />
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{name}</p>
      </div>
    </div>
  );
}

// ─── Typography scale ──────────────────────────────────────────────────────

const typographyScale = [
  { name: "text-xs", px: "12px", cls: "text-xs", sample: "Extra small — table metadata, timestamps" },
  { name: "text-sm", px: "14px (base)", cls: "text-sm", sample: "Small — body text, form labels, descriptions" },
  { name: "text-base", px: "16px", cls: "text-base", sample: "Base — primary content and headings" },
  { name: "text-lg", px: "18px", cls: "text-lg", sample: "Large — section titles" },
  { name: "text-xl", px: "20px", cls: "text-xl", sample: "XL — page subheadings" },
  { name: "text-2xl", px: "24px", cls: "text-2xl", sample: "2XL — metric values" },
  { name: "text-3xl", px: "30px", cls: "text-3xl", sample: "3XL — page headings" },
];

const fontWeights = [
  { name: "font-normal", value: "400", cls: "font-normal" },
  { name: "font-medium", value: "500", cls: "font-medium" },
  { name: "font-semibold", value: "600", cls: "font-semibold" },
  { name: "font-bold", value: "700", cls: "font-bold" },
];

// ─── Spacing scale ─────────────────────────────────────────────────────────

const spacingScale = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24];

// ─── Border radius ─────────────────────────────────────────────────────────

const radiusScale = [
  { name: "rounded-xs", cls: "rounded-xs", label: "xs — 2px" },
  { name: "rounded-sm", cls: "rounded-sm", label: "sm — 4px" },
  { name: "rounded-md", cls: "rounded-md", label: "md — 6px" },
  { name: "rounded-lg", cls: "rounded-lg", label: "lg — 8px" },
  { name: "rounded-xl", cls: "rounded-xl", label: "xl — 12px" },
  { name: "rounded-2xl", cls: "rounded-2xl", label: "2xl — 16px" },
  { name: "rounded-full", cls: "rounded-full", label: "full — 9999px" },
];

// ─── Shadows ───────────────────────────────────────────────────────────────

const shadows = [
  { name: "shadow-sm", cls: "shadow-sm", label: "sm — cards, subtle lift" },
  { name: "shadow", cls: "shadow", label: "default — dropdowns" },
  { name: "shadow-md", cls: "shadow-md", label: "md — popovers" },
  { name: "shadow-lg", cls: "shadow-lg", label: "lg — modals, panels" },
  { name: "shadow-xl", cls: "shadow-xl", label: "xl — high elevation" },
];

// ─── Main component ────────────────────────────────────────────────────────

export function FoundationTab() {
  return (
    <div className="flex flex-col gap-12 px-4 lg:px-6 py-8 max-w-7xl mx-auto w-full">

      {/* ── Colors ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Colors</h2>
        <p className="text-sm text-muted-foreground mb-6">
          All colors are defined as CSS custom properties and mapped to Tailwind utilities.
          Never hardcode hex values — always use <code className="text-xs bg-muted px-1 py-0.5 rounded">text-primary</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">bg-muted</code>, etc.
        </p>

        <SectionLabel label="Semantic Colors" />
        <div className="grid grid-cols-5 gap-4 mb-8">
          {semanticColors.map((c) => <ColorSwatch key={c.name} {...c} />)}
        </div>

        <SectionLabel label="Chart / Data Visualization" />
        <div className="grid grid-cols-5 gap-4 mb-8">
          {chartColors.map((c) => <ColorSwatch key={c.name} {...c} />)}
        </div>

        <SectionLabel label="Sidebar" />
        <div className="grid grid-cols-4 gap-4" />
        <div className="grid grid-cols-4 gap-4">
          {sidebarColors.map((c) => <ColorSwatch key={c.name} {...c} />)}
        </div>
      </section>

      <Separator />

      {/* ── Typography ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Typography</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Font family: <strong>Inter</strong> (sans). Base size: 14px. All sizes use Tailwind scale.
        </p>

        <SectionLabel label="Size Scale" />
        <div className="flex flex-col gap-3 mb-8 rounded-xl border bg-card p-4">
          {typographyScale.map(({ name, px, cls, sample }) => (
            <div key={name} className="flex items-baseline gap-4">
              <span className="w-24 text-xs text-muted-foreground font-mono flex-shrink-0">{name}</span>
              <span className="w-24 text-xs text-muted-foreground flex-shrink-0">{px}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>

        <SectionLabel label="Font Weights" />
        <div className="flex flex-wrap gap-8 rounded-xl border bg-card p-4">
          {fontWeights.map(({ name, value, cls }) => (
            <div key={name} className="flex flex-col gap-1">
              <span className={`text-xl ${cls}`}>Exxat One</span>
              <span className="text-xs text-muted-foreground font-mono">{name} ({value})</span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Spacing ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Spacing</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Base unit: 4px (0.25rem). Page padding: <code className="text-xs bg-muted px-1 py-0.5 rounded">px-4 lg:px-6</code>. Section gaps: <code className="text-xs bg-muted px-1 py-0.5 rounded">gap-12</code>. Card padding: <code className="text-xs bg-muted px-1 py-0.5 rounded">px-6 pt-6 pb-6</code>.
        </p>
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          {spacingScale.map((n) => (
            <div key={n} className="flex items-center gap-4">
              <span className="w-16 text-xs text-muted-foreground font-mono flex-shrink-0">gap-{n} / p-{n}</span>
              <div className="flex items-center gap-2">
                <div className="h-4 bg-primary/20 rounded" style={{ width: `${n * 4}px` }} />
                <span className="text-xs text-muted-foreground">{n * 4}px</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Border Radius ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Border Radius</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Cards use <code className="text-xs bg-muted px-1 py-0.5 rounded">rounded-xl</code>. Buttons/inputs use <code className="text-xs bg-muted px-1 py-0.5 rounded">rounded-md</code>. Badges use <code className="text-xs bg-muted px-1 py-0.5 rounded">rounded-full</code>.
        </p>
        <div className="flex flex-wrap gap-6">
          {radiusScale.map(({ name, cls, label }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className={`h-16 w-16 bg-primary/20 border-2 border-primary/30 ${cls}`} />
              <span className="text-xs text-muted-foreground text-center font-mono">{name}</span>
              <span className="text-xs text-muted-foreground/70 text-center">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Shadows ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Shadows</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Use shadows to communicate elevation. Cards don't need shadows unless floating. Modals use <code className="text-xs bg-muted px-1 py-0.5 rounded">shadow-lg</code>.
        </p>
        <div className="flex flex-wrap gap-6">
          {shadows.map(({ name, cls, label }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className={`h-16 w-24 bg-background rounded-lg border ${cls}`} />
              <span className="text-xs text-muted-foreground font-mono">{name}</span>
              <span className="text-xs text-muted-foreground/70 text-center max-w-[100px]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Token Reference ── */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Token Quick Reference</h2>
        <p className="text-sm text-muted-foreground mb-4">Copy these into your prompt to reference tokens by name.</p>
        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Token reference for AI prompts</span>
            <CopyButton text={`Colors: bg-background, bg-foreground, bg-primary, bg-secondary, bg-muted, bg-accent, bg-destructive, bg-card, bg-border\nText: text-foreground, text-primary, text-muted-foreground, text-primary-foreground\nChart: bg-chart-1, bg-chart-2, bg-chart-3, bg-chart-4, bg-chart-5\nSidebar: bg-sidebar, bg-sidebar-accent, bg-sidebar-primary\nSpacing: px-4 lg:px-6 (page), gap-12 (sections), gap-6 (cards), gap-4 (items)\nRadius: rounded-xl (cards), rounded-md (buttons/inputs), rounded-full (badges)\nTypography: text-xs text-sm text-base text-lg text-xl text-2xl text-3xl\nWeights: font-normal font-medium font-semibold font-bold`} />
          </div>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-5">{`Colors:   bg-background, bg-foreground, bg-primary, bg-secondary,
          bg-muted, bg-accent, bg-destructive, bg-card, bg-border
Text:     text-foreground, text-primary, text-muted-foreground
Chart:    bg-chart-1 → bg-chart-5  (data visualization only)
Spacing:  px-4 lg:px-6 (page), gap-12 (sections), gap-4 (cards)
Radius:   rounded-xl (cards), rounded-md (buttons), rounded-full (badges)
Type:     text-xs → text-3xl  |  font-normal → font-bold`}</pre>
        </div>
      </section>

    </div>
  );
}
