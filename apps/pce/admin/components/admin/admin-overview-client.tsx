"use client"

/**
 * Admin overview — is this workspace set up, and did the data land?
 *
 * A card stack on `PrimaryPageTemplate` rather than a hub, because there is no
 * list here to sort or filter; it is a status read that ends in a link to the
 * object that needs attention. Same shape as organization settings, which is
 * its neighbour in the user's head.
 *
 * The one thing it must not do is invent a health score. Counts and dates are
 * verifiable; a green tick that means nothing is worse than no tick.
 */

import * as React from "react"
import { Link, useNavigate } from "react-router"

import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LocalBanner } from "@/components/ui/banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ADMIN_IMPORT_HISTORY,
  adminObjectSummaries,
  type AdminObjectSummary,
} from "@/lib/mock/admin-directory"

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ObjectCard({ summary }: { summary: AdminObjectSummary }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2 bg-brand-tint text-brand">
            <i className={`fa-light ${summary.icon}`} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">{summary.label}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">{summary.scope}</p>
          </div>
        </div>
        <Badge variant="secondary">{summary.total}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Active</dt>
            <dd className="font-medium tabular-nums text-foreground">{summary.active}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Needs attention</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {summary.needsAttention}
              {summary.needsAttention > 0 ? (
                <span className="ms-1.5 font-normal text-muted-foreground">
                  {summary.needsAttentionLabel}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatDay(summary.lastUpdatedOn)}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">Kept current by {summary.source}.</p>
        <Button type="button" variant="outline" size="sm" className="self-start" asChild>
          <Link to={summary.href}>
            Open {summary.label.toLowerCase()}
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function AdminOverviewClient() {
  const navigate = useNavigate()
  const summaries = React.useMemo(() => adminObjectSummaries(), [])
  const heldRows = React.useMemo(
    () => ADMIN_IMPORT_HISTORY.reduce((sum, event) => sum + event.skipped, 0),
    [],
  )

  return (
    <PrimaryPageTemplate
      maxWidthClassName="max-w-5xl"
      contentClassName="pt-8 pb-24"
      siteHeader={{ title: "Administrator" }}
    >
      <PageHeader title="Administrator" />

      {heldRows > 0 ? (
        <LocalBanner
          variant="warning"
          title={`${heldRows} rows are waiting on you`}
          className="mx-4 mt-6 lg:mx-6"
          action={{ label: "Review held rows", onClick: () => navigate("/people") }}
        >
          The last two imports could not place these rows. They were held rather than skipped, so
          nothing was lost, but the people they describe cannot be placed or cleared until you
          resolve them.
        </LocalBanner>
      ) : null}

      <section className="mt-8 px-4 lg:px-6" aria-labelledby="admin-objects">
        <h2
          id="admin-objects"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Foundational records
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map(summary => (
            <ObjectCard key={summary.id} summary={summary} />
          ))}
        </div>
      </section>

      <section className="mt-10 px-4 lg:px-6" aria-labelledby="admin-imports">
        <h2
          id="admin-imports"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Recent imports
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every landing, whether it came from a feed overnight or from someone uploading a file.
        </p>
        <ul className="mt-3 divide-y divide-border rounded-2 border border-border">
          {ADMIN_IMPORT_HISTORY.map(event => (
            <li
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {event.object}
                  <span className="ms-2 font-normal text-muted-foreground">{event.source}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDay(event.landedOn)} by {event.actor}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm tabular-nums">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{event.added}</span> added
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{event.updated}</span> updated
                </span>
                {event.skipped > 0 ? (
                  <Badge variant="secondary">{event.skipped} held</Badge>
                ) : (
                  <span className="text-muted-foreground">0 held</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 px-4 lg:px-6" aria-labelledby="admin-elsewhere">
        <h2
          id="admin-elsewhere"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Configured elsewhere
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These already have a home. Administrator links to them rather than keeping a second copy
          of the controls.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2 bg-brand-tint text-brand">
                <i className="fa-light fa-grid-2" aria-hidden="true" />
              </span>
              <CardTitle className="text-base">Products and branding</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Which products this workspace uses, and the colour and wordmark for any product
                you have built yourself.
              </p>
              <Button type="button" variant="outline" size="sm" className="self-start" asChild>
                <Link to="/settings/organization">
                  Organization settings
                  <i className="fa-light fa-arrow-right" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-2 bg-brand-tint text-brand">
                <i className="fa-light fa-user-shield" aria-hidden="true" />
              </span>
              <CardTitle className="text-base">Roles and access</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Who can administer this workspace, and what a program admin sees compared with a
                tenant admin. Not built yet, so access still follows the defaults.
              </p>
              <Badge variant="secondary" className="self-start">
                Coming next
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </PrimaryPageTemplate>
  )
}
