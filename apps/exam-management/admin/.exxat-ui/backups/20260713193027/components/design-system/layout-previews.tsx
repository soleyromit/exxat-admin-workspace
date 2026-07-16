"use client"

import type * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardSection,
  CardScrollRegion,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { KeyMetrics, type MetricInsight, type MetricItem } from "@/components/key-metrics"
import { Separator } from "@/components/ui/separator"

const CARD_KPI_METRICS: MetricItem[] = [
  {
    id: "active",
    label: "Active placements",
    value: 42,
    delta: "+5",
    trend: "up",
    trendPolarity: "higher_is_better",
  },
  {
    id: "review",
    label: "Need review",
    value: 6,
    delta: "−2",
    trend: "down",
    trendPolarity: "lower_is_better",
  },
]

const CARD_KPI_INSIGHT: MetricInsight = {
  title: "Spring cohort review",
  description: "6 placements flagged before site confirmation deadlines.",
  severity: "warning",
  actionLabel: "Ask Leo",
}

function CardStructureLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-xs text-muted-foreground">{children}</p>
  )
}

export function CardSizesPreview() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <CardStructureLabel>size="default" (implicit)</CardStructureLabel>
        <Card>
          <CardHeader>
            <CardTitle>Default spacing</CardTitle>
            <CardDescription>--card-spacing: 16px (default tier)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use on dashboard tiles and section panels.</p>
          </CardContent>
        </Card>
      </div>
      <div>
        <CardStructureLabel>size="sm"</CardStructureLabel>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Compact spacing</CardTitle>
            <CardDescription>--card-spacing: 12px (sm tier)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use inside dense grids and board columns.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function CardAnatomyPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CardHeader + CardTitle</CardTitle>
        <CardDescription>CardDescription sits under the title in the header grid.</CardDescription>
        <CardAction>
          <Button type="button" size="sm" variant="outline">
            CardAction
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          CardContent owns horizontal padding only. Card sets vertical rhythm (py + gap).
        </p>
      </CardContent>
      <CardFooter>
        <Button type="button" size="sm" variant="outline">
          CardFooter CTA
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CardPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Supporting description text.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Header and body only — no footer or header action.</p>
      </CardContent>
    </Card>
  )
}

export function CardWithActionPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Placement summary</CardTitle>
        <CardDescription>Fall 2026 · PT cohort</CardDescription>
        <CardAction>
          <Button type="button" size="sm" variant="outline">
            Export
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">42 active placements · 6 need review.</p>
      </CardContent>
    </Card>
  )
}

export function CardWithFooterPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>Due this week</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">3 items pending coordinator review.</p>
      </CardContent>
      <CardFooter>
        <Button type="button" size="sm" variant="outline">
          View all tasks
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CardContentOnlyPreview() {
  return (
    <Card size="sm" className="max-w-sm">
      <CardContent>
        <p className="text-sm font-medium text-foreground">Content-only card</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Omit CardHeader when the surrounding chrome already names the section.
        </p>
      </CardContent>
    </Card>
  )
}

export function CardHeaderBorderPreview() {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>Section with divider</CardTitle>
        <CardDescription>CardHeader with border-b before scrollable body.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Use when the header stays fixed above a list region.</p>
      </CardContent>
    </Card>
  )
}

export function CardScrollableContentPreview() {
  const items = ["Review placement paperwork", "Confirm preceptor availability", "Upload compliance packet", "Send welcome email"]

  return (
    <Card size="sm" className="max-w-sm">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Recent updates</CardDescription>
      </CardHeader>
      <CardContent className="max-h-28 overflow-auto">
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/** Photo / video / illustration — not charts (use ChartCard for data viz). */
export function CardMediaPreview() {
  return (
    <Card className="max-w-sm">
      <CardMedia aspect="video">
        <img
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=640&h=360&fit=crop"
          alt="Clinical placement site exterior"
          className="size-full object-cover"
        />
      </CardMedia>
      <CardHeader>
        <CardTitle>Memorial Hospital — PT rotation</CardTitle>
        <CardDescription>Spring 2026 · 12 student capacity</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          CardMedia for photo, video, animation, illustration, or audio. Charts belong in ChartCard.
        </p>
      </CardContent>
    </Card>
  )
}

/** Subdued in-card band for secondary or inactive content. */
export function CardSubduedSectionPreview() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Staff accounts</CardTitle>
        <CardDescription>Active coordinators for this program</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1 text-sm">
          <li>Jordan Lee</li>
          <li>Sam Rivera</li>
        </ul>
      </CardContent>
      <CardSection subdued>
        <p className="text-sm font-medium text-foreground">Deactivated accounts</p>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
          <li>Alex Chen</li>
          <li>Morgan Patel</li>
        </ul>
      </CardSection>
    </Card>
  )
}

/** interactive prop — hover shadow when wrapped in Link or single navigational target. */
export function CardInteractivePreview() {
  return (
    <Card interactive className="max-w-sm">
      <CardHeader>
        <CardTitle>Interactive surface</CardTitle>
        <CardDescription>Pass interactive on Card; wrap in Link for keyboard access.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          ListPageBoardCard uses the same token via interactive + Link.
        </p>
      </CardContent>
    </Card>
  )
}

/** Edge-to-edge scroll region using --card-spacing bleed utilities. */
export function CardEdgeToEdgePreview() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Terms of placement</CardTitle>
        <CardDescription>Review before accepting the agreement.</CardDescription>
      </CardHeader>
      <CardContent className="-mb-(--card-spacing)">
        <CardScrollRegion
          label="Agreement terms"
          edgeToEdge
          className="max-h-32 space-y-3 overflow-y-auto border-t py-(--card-spacing) text-sm leading-relaxed text-muted-foreground"
        >
          <p>Students must complete all compliance requirements before the rotation start date.</p>
          <p>Site coordinators may update availability weekly; schools receive automated notifications.</p>
          <p>Placement changes within 14 days of start require program director approval.</p>
          <p>By continuing, you agree to keep student records confidential per FERPA guidelines.</p>
        </CardScrollRegion>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button type="button" size="sm" variant="outline">
          Decline
        </Button>
        <Button type="button" size="sm">
          Accept
        </Button>
      </CardFooter>
    </Card>
  )
}

/** KPI inside Card — flat-band cells (transparent + hairlines) on card glow. */
export function CardKpiInCardPreview() {
  return (
    <KeyMetrics
      variant="card"
      title="Placement health"
      description="Spring 2026 cohort"
      metrics={CARD_KPI_METRICS}
      insight={CARD_KPI_INSIGHT}
      metricsSingleRow
      className="max-w-2xl"
    />
  )
}

/** @deprecated Use CardKpiInCardPreview */
export const CardKpiFlatBandPreview = CardKpiInCardPreview
export const CardGlowPreview = CardKpiInCardPreview

export function AccordionPreview() {
  return (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>Section one</AccordionTrigger>
        <AccordionContent>Collapsible body copy.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section two</AccordionTrigger>
        <AccordionContent>Second panel content.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function CollapsiblePreview() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Toggle details
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
        Collapsible region content.
      </CollapsibleContent>
    </Collapsible>
  )
}

export function SeparatorPreview() {
  return (
    <div className="flex h-8 items-center gap-2">
      <span className="text-sm">Left</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Right</span>
    </div>
  )
}

export function ScrollAreaPreview() {
  return (
    <ScrollArea className="h-24 rounded-md border border-border p-2">
      <p className="text-sm text-muted-foreground">
        Scrollable region for nested panes with overflow.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Line two</p>
      <p className="mt-2 text-sm text-muted-foreground">Line three</p>
    </ScrollArea>
  )
}
