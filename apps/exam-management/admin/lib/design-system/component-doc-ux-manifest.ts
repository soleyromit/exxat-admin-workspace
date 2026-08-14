/**
 * UX manifest — automated defaults for design-system component doc pages.
 *
 * Skeleton pages (`buildSkeletonComponentDoc`) and full docs without an explicit
 * `ux` block merge from here. Add slug overrides for high-traffic primitives;
 * tier/group defaults cover the long tail.
 *
 * Audit: `pnpm ds:catalog:audit` reports `UX coverage` per entry.
 */

import type {
  ComponentDocGuidelines,
  ComponentDocUx,
} from "@/lib/design-system/component-doc-types"
import type { DesignSystemRegistryEntry, DesignSystemTier } from "@/lib/design-system/registry-types"

export interface ComponentDocUxManifestEntry {
  ux: ComponentDocUx
  guidelines?: ComponentDocGuidelines
  accessibility?: string[]
}

const GROUP_UX: Record<string, ComponentDocUxManifestEntry> = {
  Forms: {
    ux: {
      job: "Collect or edit a bounded set of user inputs with clear labels and validation.",
      principles: ["P3", "P5", "P6", "P13"],
      whenToUse: [
        "User submits data on a hub, focus workflow, drawer, or settings surface.",
        "Field count fits one scroll region or one wizard panel.",
      ],
      whenNotToUse: [
        "Read-only record display — use description lists or table cells.",
        "Binary on/off preference — prefer ToggleSwitch.",
      ],
      rulePath: ".cursor/rules/exxat-token-discipline.mdc",
    },
    guidelines: {
      do: [
        "Pair every control with a visible label (Field + FieldLabel).",
        "Use token-backed field chrome — transparent in light, filled in dark.",
        "Expose invalid state inline; no toast on validation failure.",
      ],
      dont: [
        "Raw hex or one-off input backgrounds.",
        "Placeholder-only labels without aria-label.",
        "Multiple primary submit buttons on one form.",
      ],
    },
  },
  Layout: {
    ux: {
      job: "Structure page regions and scrolling without breaking shell rhythm.",
      principles: ["P1", "P6", "P19"],
      whenToUse: ["Composable layout chrome inside templates and hubs."],
      whenNotToUse: ["Product-specific IA — use ListPageTemplate or focus shells instead."],
    },
  },
  Navigation: {
    ux: {
      job: "Move the user between views, scopes, or steps with one active affordance.",
      principles: ["P1", "P2", "P13"],
      whenToUse: ["View switching, breadcrumbs, segmented controls, wizard rails."],
      whenNotToUse: ["Unrelated record actions — use Button or dropdown menu."],
      rulePath: ".cursor/rules/exxat-nav-single-active.mdc",
    },
  },
  Overlays: {
    ux: {
      job: "Interrupt or assist without stealing the user's place on the hub.",
      principles: ["P1", "P3", "P7"],
      whenToUse: ["Short confirm, export, properties, or reversible edit."],
      whenNotToUse: [
        "Long create flows — use a route + focus workflow.",
        "Destructive ack without explicit copy — use AlertDialog.",
      ],
      rulePath: ".cursor/rules/exxat-drawer-vs-dialog.mdc",
    },
  },
  Feedback: {
    ux: {
      job: "Communicate status, risk, or outcome persistently on the surface.",
      principles: ["P5", "P8"],
      whenToUse: ["Banners, inline alerts, badges tied to record state."],
      whenNotToUse: ["Transient success — no toast; use inline status or banner."],
      rulePath: "apps/web/.cursor/rules/exxat-no-toast.mdc",
    },
  },
  "Data display": {
    ux: {
      job: "Present entity metadata at the right density for the container.",
      principles: ["P6", "P13", "P19"],
      whenToUse: ["Avatars, cards, KPI tiles, chart summaries."],
      whenNotToUse: ["Comparable many-row data — use DataTable in a hub."],
    },
  },
  Actions: {
    ux: {
      job: "Trigger one clear action with correct visual hierarchy.",
      principles: ["P3", "P8"],
      whenToUse: ["Primary, secondary, and destructive CTAs."],
      whenNotToUse: ["Navigation between routes — use Link or nav primitives."],
      rulePath: ".cursor/rules/exxat-accessibility.mdc",
    },
  },
}

const TIER_UX: Partial<Record<DesignSystemTier, ComponentDocUxManifestEntry>> = {
  pattern: {
    ux: {
      job: "Document a repeatable composition across products.",
      principles: ["P1", "P10"],
      whenToUse: ["When multiple hubs share the same IA and data contract."],
    },
  },
  template: {
    ux: {
      job: "Own page-level IA for a job type (hub, focus, settings).",
      principles: ["P1", "P2", "P3"],
      whenToUse: ["New routes that match an existing job doc."],
      rulePath: ".cursor/rules/_constitution.exxat-ds.mdc",
    },
  },
}

/** Slug-specific overrides — highest precedence after full ComponentDocSpec. */
export const UX_MANIFEST_BY_SLUG: Record<string, ComponentDocUxManifestEntry> = {
  wizard: {
    ux: {
      job: "Advance a sequential multi-step task with visible progress and linear gating.",
      budgets: [
        {
          label: "Top-level steps (ideal)",
          value: "3–4",
          rationale: "Users can scan the full journey on one line.",
        },
        {
          label: "Top-level steps (max horizontal)",
          value: "≤6",
          rationale: "WIZARD_RECOMMENDED_MAX_STEPS — use WizardStepGuidance above this.",
        },
        {
          label: "7+ steps",
          value: "Avoid",
          rationale: "Group fields inside WizardPanel, vertical rail, or route split.",
        },
      ],
      principles: ["P1", "P2", "P3", "P5", "P6", "P13", "P19"],
      modernReferences: [
        "Stripe Connect onboarding (M4, M7)",
        "Linear project setup (M1, M4)",
      ],
      patternDoc: "apps/web/docs/wizard-pattern.md",
      rulePath: ".cursor/rules/exxat-wizard.mdc",
      whenToUse: [
        "Focus-workflow create flows with 3–6 named chapters.",
        "Linear gating with optional back-navigation to completed steps.",
      ],
      whenNotToUse: [
        "Peer view switching on one record — use Tabs.",
        "Eight or more top-level chapters without IA review.",
        "Modal with more than three decisions — prefer a route.",
      ],
    },
    guidelines: {
      do: [
        "Keep ≤6 top-level steps; put sections inside WizardPanel.",
        "Horizontal overflow: HorizontalScrollControls + auto-scroll active step.",
        "Pair with FocusWorkflowTemplate on create routes.",
        "WizardStepHeading (H2) per panel; one H1 on the page.",
      ],
      dont: [
        "Use Wizard as Tabs — no fourth tabs variant.",
        "Hide overflowing rails without keyboard scroll buttons.",
        "Toast on step advance — inline validation only.",
        "Ship the 8-step catalog demo as a product pattern.",
      ],
    },
    accessibility: [
      "Step list uses ol/li; aria-current=step on active marker.",
      "Linear future steps: aria-disabled; completed steps clickable only with onStepClick.",
      "WizardProgress uses aria-live=polite.",
      "Horizontal scroll: grouped prev/next Buttons with Tip labels.",
      "Footer actions: Kbd variant=bare per exxat-kbd-shortcuts.",
    ],
  },
  "horizontal-scroll-controls": {
    ux: {
      job: "Let keyboard and pointer users reach overflowed horizontal rows.",
      principles: ["P7", "P8", "P13"],
      patternDoc: "apps/web/docs/horizontal-scroll-pattern.md",
      rulePath: ".cursor/rules/exxat-horizontal-scroll.mdc",
      whenToUse: ["Wizard step rails, view tabs, breadcrumb trails, chip rows."],
      whenNotToUse: ["Vertical lists — use ScrollArea or native overflow-y."],
    },
  },
  "horizontal-scroll-region": {
    ux: {
      job: "Wrap overflow-x content with grouped scroll controls when needed.",
      principles: ["P7", "P8"],
      patternDoc: "apps/web/docs/horizontal-scroll-pattern.md",
      rulePath: ".cursor/rules/exxat-horizontal-scroll.mdc",
    },
  },
  tabs: {
    ux: {
      job: "Switch between named peer panels; Radix tablist with one visible TabsContent at a time.",
      principles: ["P1", "P2", "P13"],
      whenToUse: ["Peer panels on one surface — TabsList + TabsTrigger + TabsContent."],
      whenNotToUse: [
        "Hub view switching — ViewSegmentedControl.",
        "Sequential create with completion states — Wizard.",
      ],
      rulePath: ".cursor/rules/exxat-tabs-chrome.mdc",
    },
    guidelines: {
      do: [
        "Keep TabsList inline-flex w-fit; use TabsListScrollRegion when triggers overflow.",
        "variant=\"default\" for pill chrome; variant=\"line\" for underline panels.",
      ],
      dont: [
        "Stretch TabsList full width.",
        "Use for hub table/board/dashboard views — ViewSegmentedControl instead.",
      ],
    },
  },
  button: {
    ux: {
      job: "Trigger the single most important action on a surface.",
      principles: ["P3", "P8"],
      whenToUse: ["Primary CTA, toolbar actions, wizard footer."],
      whenNotToUse: ["Persistent on/off — use ToggleSwitch."],
    },
  },
  card: {
    ux: {
      job: "Group related content on one elevated surface without breaking shell scroll rhythm.",
      principles: ["P3", "P6", "P13", "P19"],
      patternDoc: "apps/web/docs/card-vs-rows-pattern.md",
      rulePath: ".cursor/rules/exxat-card-vs-list-rows.mdc",
      whenToUse: [
        "Dashboard sections with header + body or scrollable list.",
        "Kanban tiles via ListPageBoardCard.",
        "Photo / video / illustration via CardMedia.",
        "KPI or chart summaries via KeyMetrics or ChartCard.",
      ],
      whenNotToUse: [
        "Primary sortable hubs with many homogeneous records — use DataTable.",
        "Transient feedback — use banners or inline status.",
      ],
    },
    guidelines: {
      do: [
        "Let Card own vertical spacing; overflow-auto only on CardContent.",
        "Use size=\"sm\" in board columns and compact grids.",
      ],
      dont: [
        "Add h-full / flex-col stretch hacks on Card.",
        "Use CardMedia for charts — use ChartCard.",
        "Add glow to task, activity, or standard chart cards.",
      ],
    },
  },
  table: {
    ux: {
      job: "Compare and act on many comparable records in one hub.",
      principles: ["P1", "P4", "P6", "P13"],
      modernReferences: ["Airtable grid (M2, M4)", "Linear list (M1, M4)"],
      patternDoc: "apps/web/docs/blueprints/data-table.md",
      rulePath: ".cursor/rules/exxat-data-tables.mdc",
    },
  },
}

export function getUxManifestForSlug(slug: string): ComponentDocUxManifestEntry | undefined {
  return UX_MANIFEST_BY_SLUG[slug]
}

export function getUxManifestForEntry(
  entry: Pick<DesignSystemRegistryEntry, "slug" | "tier" | "group">,
): ComponentDocUxManifestEntry | undefined {
  return (
    UX_MANIFEST_BY_SLUG[entry.slug] ??
    GROUP_UX[entry.group] ??
    (entry.tier ? TIER_UX[entry.tier] : undefined)
  )
}

export function listUxManifestSlugs(): string[] {
  return Object.keys(UX_MANIFEST_BY_SLUG)
}
