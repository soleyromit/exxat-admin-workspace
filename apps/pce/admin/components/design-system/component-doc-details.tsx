"use client"

import { Link } from "react-router-dom"

import type {
  ComponentDocAccessibilityItem,
  ComponentDocAnatomyPart,
  ComponentDocFeatureGroup,
  ComponentDocGuidelines,
  ComponentDocSpec,
  ComponentDocSpecAccessibility,
  ComponentDocUx,
} from "@/lib/design-system/component-doc-types"
import {
  A11Y_PRINCIPLE_LABEL,
  A11Y_PRINCIPLE_ORDER,
  A11Y_PRINCIPLE_SUMMARY,
  isStructuredAccessibility,
} from "@/lib/design-system/component-doc-a11y"
import { SelectionTileShowcase } from "@/components/ui/selection-tile-grid"
import { Badge } from "@/components/ui/badge"
import { ComponentDocApiTable } from "@/components/design-system/component-doc-api-table"
import { DS_DOC_BODY, DS_DOC_BODY_EMPHASIS, DS_DOC_CODE_LABEL, DS_DOC_GUIDELINE_DO_ICON, DS_DOC_GUIDELINE_DONT_ICON, DS_DOC_GUIDELINE_ICON, DS_DOC_LINK, DS_DOC_SECTION_TITLE, DS_DOC_SUBSECTION_TITLE } from "@/lib/design-system/doc-typography"
import { cn } from "@/lib/utils"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

function AnatomyList({ parts }: { parts: ComponentDocAnatomyPart[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {parts.map((row) => (
        <li key={row.part} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
          <code className={cn("shrink-0 sm:w-44", DS_DOC_CODE_LABEL)}>{row.part}</code>
          <span className={cn("min-w-0 flex-1", DS_DOC_BODY)}>{row.description}</span>
        </li>
      ))}
    </ul>
  )
}

function AnatomyBlock({ parts }: { parts: ComponentDocAnatomyPart[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className={DS_DOC_SECTION_TITLE}>Anatomy</h2>
      <AnatomyList parts={parts} />
    </section>
  )
}

function featureOptionValue(part: string) {
  return part.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function FeaturesBlock({ groups }: { groups: ComponentDocFeatureGroup[] }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className={DS_DOC_SECTION_TITLE}>Features</h2>
      {groups.map((group) => (
        <SelectionTileShowcase
          key={group.group}
          sectionLabel={group.group}
          sectionIcon={group.icon}
          columns={Math.min(4, Math.max(2, group.items.length)) as 2 | 3 | 4}
          align="center"
          density="compact"
          options={group.items.map((item) => ({
            value: featureOptionValue(item.part),
            label: item.part,
            icon: item.icon ?? "fa-circle-info",
            description: item.description,
          }))}
        />
      ))}
    </section>
  )
}

function CriterionHeading({ item }: { item: ComponentDocAccessibilityItem }) {
  const title = item.criterionTitle ? ` ${item.criterionTitle}` : ""
  return (
    <h4 className={cn("text-sm font-medium text-foreground", DS_DOC_BODY_EMPHASIS)}>
      <span className="font-mono tabular-nums">{item.criterion}</span>
      {title}
      {item.level ? (
        <Badge variant="outline" className="ms-2 align-middle text-[10px] font-normal">
          Level {item.level}
        </Badge>
      ) : null}
    </h4>
  )
}

function AccessibilityBlock({ items }: { items: ComponentDocSpecAccessibility }) {
  if (isStructuredAccessibility(items)) {
    const grouped = A11Y_PRINCIPLE_ORDER.map((principle) => ({
      principle,
      items: items.filter((row) => row.principle === principle),
    })).filter((group) => group.items.length > 0)

    return (
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className={DS_DOC_SECTION_TITLE}>Accessibility</h2>
          <p className={DS_DOC_BODY}>
            WCAG 2.1 Level AA floor, grouped by POUR (Perceivable, Operable, Understandable, Robust).
          </p>
        </div>
        {grouped.map(({ principle, items: principleItems }) => (
          <div key={principle} className="flex flex-col gap-3">
            <div>
              <h3 className={DS_DOC_SUBSECTION_TITLE}>{A11Y_PRINCIPLE_LABEL[principle]}</h3>
              <p className={cn("mt-0.5", DS_DOC_BODY)}>{A11Y_PRINCIPLE_SUMMARY[principle]}</p>
            </div>
            <div className="flex flex-col gap-3 ps-0 sm:ps-2">
              {principleItems.map((item) => (
                <div key={`${item.criterion}-${item.guidance}`} className="flex flex-col gap-1">
                  <CriterionHeading item={item} />
                  <p className={DS_DOC_BODY}>{item.guidance}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className={DS_DOC_SECTION_TITLE}>Accessibility</h2>
      <ul className={cn("list-disc space-y-1 ps-4", DS_DOC_BODY)}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

function GuidelineListItem({
  item,
  iconClassName,
  iconToneClassName,
}: {
  item: string
  iconClassName: string
  iconToneClassName: string
}) {
  return (
    <li className="flex gap-2">
      <span
        className={cn(
          "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center",
          DS_DOC_GUIDELINE_ICON,
          iconToneClassName,
        )}
        aria-hidden="true"
      >
        <i className={iconClassName} />
      </span>
      <span className="text-sm text-foreground">{item}</span>
    </li>
  )
}

function ImplementationBlock({ guidelines }: { guidelines: ComponentDocGuidelines }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className={DS_DOC_SECTION_TITLE}>Implementation</h2>
        <p className={DS_DOC_BODY}>
          How to compose and configure the primitive. Technical and structural rules, not product UX.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className={cn("mb-1.5", DS_DOC_SUBSECTION_TITLE)}>Do</h3>
          <ul className={cn("space-y-1", DS_DOC_BODY)}>
            {guidelines.do.map((item) => (
              <GuidelineListItem
                key={item}
                item={item}
                iconClassName="fa-solid fa-check"
                iconToneClassName={DS_DOC_GUIDELINE_DO_ICON}
              />
            ))}
          </ul>
        </div>
        <div>
          <h3 className={cn("mb-1.5", DS_DOC_SUBSECTION_TITLE)}>Avoid</h3>
          <ul className={cn("space-y-1", DS_DOC_BODY)}>
            {guidelines.dont.map((item) => (
              <GuidelineListItem
                key={item}
                item={item}
                iconClassName="fa-solid fa-xmark"
                iconToneClassName={DS_DOC_GUIDELINE_DONT_ICON}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function WhenToUseColumns({ ux }: { ux: ComponentDocUx }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ux.whenToUse?.length ? (
        <div>
          <h3 className={cn("mb-1.5", DS_DOC_SUBSECTION_TITLE)}>When to use</h3>
          <ul className="space-y-1">
            {ux.whenToUse.map((item) => (
              <GuidelineListItem
                key={item}
                item={item}
                iconClassName="fa-solid fa-check"
                iconToneClassName={DS_DOC_GUIDELINE_DO_ICON}
              />
            ))}
          </ul>
        </div>
      ) : null}
      {ux.whenNotToUse?.length ? (
        <div>
          <h3 className={cn("mb-1.5", DS_DOC_SUBSECTION_TITLE)}>When not to use</h3>
          <ul className="space-y-1">
            {ux.whenNotToUse.map((item) => (
              <GuidelineListItem
                key={item}
                item={item}
                iconClassName="fa-solid fa-xmark"
                iconToneClassName={DS_DOC_GUIDELINE_DONT_ICON}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ConstraintsBlock({
  budgets,
}: {
  budgets: NonNullable<ComponentDocUx["budgets"]>
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className={DS_DOC_SECTION_TITLE}>Constraints</h2>
        <p className={DS_DOC_BODY}>
          Quantitative design limits for scanning and density. These are IA and layout budgets, not WCAG
          criteria.
        </p>
      </div>
      <ul className={cn("space-y-2", DS_DOC_BODY)}>
        {budgets.map((row) => (
          <li key={row.label}>
            <span className={DS_DOC_BODY_EMPHASIS}>{row.label}: </span>
            {row.value}. <span className="text-foreground">{row.rationale}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Product UX only — job, when to pick this primitive, references. */
function UxGuidelinesBlock({ ux }: { ux: ComponentDocUx }) {
  const hasWhenToUse = Boolean(ux.whenToUse?.length || ux.whenNotToUse?.length)

  return (
    <section className="flex flex-col gap-4">
      <h2 className={DS_DOC_SECTION_TITLE}>UX guidelines</h2>
      {ux.job ? <p className="text-sm text-foreground">{ux.job}</p> : null}
      {hasWhenToUse ? <WhenToUseColumns ux={ux} /> : null}
      {ux.principles?.length ? (
        <p className="text-sm text-foreground">
          <span className={DS_DOC_BODY_EMPHASIS}>Principles: </span>
          {ux.principles.join(", ")}
        </p>
      ) : null}
      {ux.modernReferences?.length ? (
        <p className="text-sm text-foreground">
          <span className={DS_DOC_BODY_EMPHASIS}>Modern references: </span>
          {ux.modernReferences.join("; ")}
        </p>
      ) : null}
      {(ux.patternDoc || ux.rulePath) ? (
        <p className="text-sm text-foreground">
          {ux.patternDoc ? (
            <>
              <span className={DS_DOC_BODY_EMPHASIS}>Pattern: </span>
              <code className={DS_DOC_CODE_LABEL}>{ux.patternDoc}</code>
            </>
          ) : null}
          {ux.patternDoc && ux.rulePath ? " · " : null}
          {ux.rulePath ? (
            <>
              <span className={DS_DOC_BODY_EMPHASIS}>Rule: </span>
              <code className={DS_DOC_CODE_LABEL}>{ux.rulePath}</code>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  )
}

function RelatedBlock({ slugs }: { slugs: string[] }) {
  const dashboardHref = useProductDashboardHref()
  const productBase = dashboardHref.replace(/\/dashboard$/, "")
  const basePath = `${productBase}/design-system`

  return (
    <section className="flex flex-col gap-2">
      <h2 className={DS_DOC_SECTION_TITLE}>Related</h2>
      <ul className="flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <li key={slug}>
            <Link
              to={`${basePath}/${slug}`}
              className={DS_DOC_LINK}
            >
              {slug}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Live previews → UX → Implementation → Constraints → Accessibility → reference sections. */
export function ComponentDocDetails({ spec }: { spec: ComponentDocSpec }) {
  const showUx = Boolean(
    spec.ux?.job ||
      spec.ux?.whenToUse?.length ||
      spec.ux?.whenNotToUse?.length ||
      spec.ux?.principles?.length,
  )

  return (
    <div className="flex flex-col gap-6 border-t border-border pt-6">
      {showUx && spec.ux ? <UxGuidelinesBlock ux={spec.ux} /> : null}
      {spec.guidelines ? <ImplementationBlock guidelines={spec.guidelines} /> : null}
      {spec.ux?.budgets?.length ? <ConstraintsBlock budgets={spec.ux.budgets} /> : null}
      {spec.accessibility?.length ? <AccessibilityBlock items={spec.accessibility} /> : null}
      {spec.anatomy?.length ? <AnatomyBlock parts={spec.anatomy} /> : null}
      {spec.features?.length ? <FeaturesBlock groups={spec.features} /> : null}
      {spec.api?.length ? <ComponentDocApiTable rows={spec.api} /> : null}
      {spec.relatedSlugs?.length ? <RelatedBlock slugs={spec.relatedSlugs} /> : null}
    </div>
  )
}
