"use client"

/**
 * Layout 2 setup card (HY-01 section 9.1): open while any skill is unconfigured or the library is empty, one summary line
 * when everything is configured. Open or closed is DERIVED from the data (a re-import re-opens it); the only local state is
 * whether the admin chose to look at the steps while it is closed. No Go live gate, no progress bar, no dismiss (IM-10, OD-15).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { home } from "@/lib/copy/home"
import { isFirstRun, setupOpen, type HomeSummary } from "@/lib/home/derive"
import { HOME_LINKS } from "@/lib/home/links"
import { PREVIEW_ROUTES, ROUTES } from "@/lib/skills-routes"
import { LinkButton } from "./link-button"

type Tone = "success" | "info" | "neutral"

interface StepProps {
  n: number
  title: string
  description?: string
  detail?: React.ReactNode
  badge?: { label: string; tone: Tone; icon?: string }
  actions?: React.ReactNode
  /** Why the step cannot be used yet (blocked-with-reason, never hidden). */
  disabledReason?: string
  reasonId?: string
}

function Step({ n, title, description, detail, badge, actions, disabledReason, reasonId }: StepProps) {
  return (
    <li className="flex flex-wrap items-start gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0" data-testid={`setup-step-${n}`}>
      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground" aria-hidden="true">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge ? <StatusBadge label={badge.label} tone={badge.tone} icon={badge.icon} size="sm" /> : null}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {detail ? <div className="text-sm text-foreground">{detail}</div> : null}
        {disabledReason ? (
          <p id={reasonId} className="text-sm text-muted-foreground">
            {disabledReason}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </li>
  )
}

function Steps({ s }: { s: HomeSummary }) {
  const first = isFirstRun(s)
  const step1Done = s.total > 0
  const step2Done = s.total > 0 && s.unconfigured === 0
  return (
    <ol aria-label={home.aria.setupSteps} className="flex flex-col divide-y divide-border">
      <Step
        n={1}
        title={home.steps.bring.title}
        description={home.steps.bring.description}
        badge={step1Done ? { label: home.badges.done, tone: "success", icon: "fa-circle-check" } : undefined}
        detail={
          step1Done ? (
            <>
              <span>{home.stepDetail.inLibrary(s.total)}</span>
              {s.unreadLines > 0 ? <span> {home.stepDetail.unread(s.unreadLines)}</span> : null}
            </>
          ) : null
        }
        actions={
          first ? (
            <>
              <LinkButton href={ROUTES.import} variant="outline" size="default">
                {home.actions.import}
              </LinkButton>
              <LinkButton href={ROUTES.skillNew} variant="outline" size="default">
                {home.actions.add}
              </LinkButton>
            </>
          ) : s.unreadLines > 0 ? (
            <LinkButton href={ROUTES.import}>{home.buttons.reviewLines}</LinkButton>
          ) : null
        }
      />
      <Step
        n={2}
        title={home.steps.configure.title}
        description={home.steps.configure.description}
        badge={first ? undefined : step2Done ? { label: home.badges.done, tone: "success", icon: "fa-circle-check" } : { label: home.badges.inProgress, tone: "info", icon: "fa-clock" }}
        detail={first ? null : home.stepDetail.configured(s.configuredActive, s.total)}
        disabledReason={first ? home.disabled.afterAdd : undefined}
        reasonId="setup-step-2-reason"
        actions={
          first ? (
            <Button variant="outline" size="sm" disabled aria-describedby="setup-step-2-reason" aria-label={home.aria.continue}>
              {home.buttons.continue}
            </Button>
          ) : !step2Done ? (
            <LinkButton href={s.firstUnconfiguredId ? ROUTES.skillConfigure(s.firstUnconfiguredId) : HOME_LINKS.unconfigured} aria-label={home.aria.continue}>
              {home.buttons.continue}
            </LinkButton>
          ) : null
        }
      />
      <Step
        n={3}
        title={home.steps.preview.title}
        disabledReason={s.configuredActive === 0 ? (first ? home.disabled.afterAdd : home.disabled.afterConfigure) : undefined}
        reasonId="setup-step-3-reason"
        actions={
          s.configuredActive === 0 ? (
            <Button variant="outline" size="sm" disabled aria-describedby="setup-step-3-reason">
              {home.buttons.preview}
            </Button>
          ) : (
            <>
              <LinkButton href={PREVIEW_ROUTES.student} aria-label={home.aria.previewStudent}>
                {home.buttons.preview}
              </LinkButton>
              <LinkButton href={PREVIEW_ROUTES.preceptor} variant="ghost" aria-label={home.aria.previewEvaluator}>
                {home.buttons.evaluatorView}
              </LinkButton>
            </>
          )
        }
      />
      <Step
        n={4}
        title={home.steps.map.title}
        description={home.steps.map.description}
        badge={{ label: home.badges.recommended, tone: "neutral" }}
        detail={first ? null : home.stepDetail.offerings(s.offeringsWithSkills, s.offerings)}
        disabledReason={first ? home.disabled.afterAdd : undefined}
        reasonId="setup-step-4-reason"
        actions={
          first ? (
            <Button variant="outline" size="sm" disabled aria-describedby="setup-step-4-reason" aria-label={home.aria.openMapping}>
              {home.buttons.open}
            </Button>
          ) : (
            <LinkButton href={ROUTES.courses} aria-label={home.aria.openMapping}>
              {home.buttons.open}
            </LinkButton>
          )
        }
      />
    </ol>
  )
}

export function SetupCard({ summary: s }: { summary: HomeSummary }) {
  const [reviewing, setReviewing] = React.useState(false)
  const forcedOpen = setupOpen(s)
  const open = forcedOpen || reviewing
  const first = isFirstRun(s)
  const contentId = "home-setup-steps"

  return (
    <Card data-testid="setup-card" data-open={forcedOpen ? "true" : "false"}>
      <Collapsible open={open} onOpenChange={(o) => setReviewing(o)}>
        <CardHeader>
          <CardTitle asChild className="text-base font-semibold">
            <h2>{forcedOpen ? home.setupTitle : home.collapsed(s.total)}</h2>
          </CardTitle>
          <CardDescription className="text-sm">
            {first ? (
              <span data-testid="setup-headline">
                {home.firstRunHeadline}. {home.firstRunSub}
              </span>
            ) : forcedOpen ? (
              <span data-testid="setup-headline">
                <span className="font-medium text-foreground">{home.headline(s.unconfigured)}</span>. {home.headlineSub(s.configuredActive, s.total)}
              </span>
            ) : (
              <span data-testid="readiness">{home.readiness(s.configuredActive)}</span>
            )}
          </CardDescription>
          {!forcedOpen ? (
            <CardAction>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" aria-controls={contentId}>
                  {open ? home.buttons.hideSetup : home.buttons.reviewSetup}
                </Button>
              </CollapsibleTrigger>
            </CardAction>
          ) : null}
        </CardHeader>
        <CollapsibleContent id={contentId}>
          <CardContent className="pt-4">
            <Steps s={s} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
