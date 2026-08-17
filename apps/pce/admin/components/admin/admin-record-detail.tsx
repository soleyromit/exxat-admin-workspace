"use client"

/**
 * Record detail for any foundational object.
 *
 * The section that justifies the whole console is Used across products. Before
 * it, every product held its own copy of the roster and none of them knew about
 * the others, so nobody could answer "if I retire this course or deactivate
 * this person, what breaks?" The answer has to live next to the record, not in
 * a report someone runs afterwards.
 *
 * Each reference links into the product that owns it, which is a hard product
 * switch by design (multi-product routing, rule 6): the theme, nav and scope
 * chrome all have to follow, and pretending otherwise would strand the user in
 * an Admin shell showing another product's data.
 */

import * as React from "react"
import { Link } from "react-router"

import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/page-header"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { AvatarInitials } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { STATUS_BADGE_TONE_CLASS } from "@/lib/list-status-badges"
import {
  ADMIN_SOURCE_ICON,
  ADMIN_SOURCE_LABEL,
  ADMIN_STATUS_LABEL,
  type AdminRecordStatus,
  type AdminRecordUsage,
  type AdminSource,
} from "@/lib/mock/admin-directory"

const STATUS_TINT: Record<AdminRecordStatus, string> = {
  active: STATUS_BADGE_TONE_CLASS.success,
  invited: STATUS_BADGE_TONE_CLASS.warning,
  inactive: STATUS_BADGE_TONE_CLASS.neutral,
}

const STATUS_ICON: Record<AdminRecordStatus, string> = {
  active: "fa-circle-check",
  invited: "fa-paper-plane",
  inactive: "fa-circle-minus",
}

export interface AdminRecordField {
  label: string
  value: React.ReactNode
  /** Render in mono, for workspace IDs and course codes. */
  mono?: boolean
}

export interface AdminRecordDetailProps {
  /** Hub this record belongs to, for the single way back. */
  backTo: { label: string; href: string }
  title: string
  /** Line under the title: the record in one phrase. */
  subtitle: string
  /** Shown when the record represents a person. */
  initials?: string
  status: AdminRecordStatus
  source: AdminSource
  lastSyncedOn: string
  fields: AdminRecordField[]
  usage: AdminRecordUsage[]
  /** Why this record has no product references, in the record's own terms. */
  usageEmptyState: string
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function AdminRecordDetail({
  backTo,
  title,
  subtitle,
  initials,
  status,
  source,
  lastSyncedOn,
  fields,
  usage,
  usageEmptyState,
}: AdminRecordDetailProps) {
  return (
    <PrimaryPageTemplate
      maxWidthClassName="max-w-5xl"
      contentClassName="pt-8 pb-24"
      siteHeader={{
        breadcrumbs: [{ label: backTo.label, href: backTo.href }],
        title,
      }}
    >
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {initials ? <AvatarInitials initials={initials} className="size-10 text-sm" /> : null}
            {title}
          </span>
        }
        subtitle={subtitle}
        // No back button here: the breadcrumb above already carries the way
        // back, and P1 allows exactly one.
        actions={
          <DropdownMenu>
            <Tip side="bottom" label="More actions">
              <DropdownMenuTrigger asChild>
                <Button type="button" size="icon" variant="outline" aria-label="More actions">
                  <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => {}}>
                <i className="fa-light fa-pen-line" aria-hidden="true" />
                Edit record
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {}}>
                <i className="fa-light fa-circle-minus" aria-hidden="true" />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Status before scroll (P13): whether this record is live, and whether
          the workspace or a feed is responsible for it. */}
      <Card size="sm" className="mx-4 mt-6 flex-row flex-wrap items-center gap-x-6 gap-y-3 bg-muted/30 lg:mx-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <StatusBadge
            label={ADMIN_STATUS_LABEL[status]}
            tintClassName={STATUS_TINT[status]}
            icon={STATUS_ICON[status]}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Source</span>
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <i className={`fa-light ${ADMIN_SOURCE_ICON[source]}`} aria-hidden="true" />
            {ADMIN_SOURCE_LABEL[source]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Last updated</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatDay(lastSyncedOn)}
          </span>
        </div>
      </Card>

      <section className="mt-8 px-4 lg:px-6" aria-labelledby="admin-record-details">
        <h2
          id="admin-record-details"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Details
        </h2>
        <dl className="mt-3 grid gap-x-8 gap-y-4 rounded-2 border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(field => (
            <div key={field.label} className="min-w-0">
              <dt className="text-sm text-muted-foreground">{field.label}</dt>
              <dd
                className={
                  field.mono
                    ? "mt-0.5 font-mono text-sm tabular-nums text-foreground"
                    : "mt-0.5 text-sm font-medium text-foreground"
                }
              >
                {field.value || <span className="text-muted-foreground">Not set</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8 px-4 lg:px-6" aria-labelledby="admin-record-usage">
        <h2
          id="admin-record-usage"
          className="text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          Used across products
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check this before you retire or reassign the record. Opening a reference switches you
          into that product.
        </p>

        {usage.length === 0 ? (
          <Card size="sm" className="mt-3 border-dashed text-center">
            <CardContent>
              <p className="text-sm text-muted-foreground">{usageEmptyState}</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {usage.map(reference => (
              <li key={`${reference.productLabel}-${reference.surface}`}>
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-2 bg-brand-tint text-brand">
                        <i className={`fa-light ${reference.icon}`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{reference.surface}</CardTitle>
                        <p className="truncate text-sm text-muted-foreground">
                          {reference.productLabel}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm leading-6 text-muted-foreground">{reference.detail}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start"
                      asChild
                    >
                      <Link to={reference.href}>
                        View in {reference.productLabel}
                        <i className="fa-light fa-arrow-right" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PrimaryPageTemplate>
  )
}

/** Shared not-found state, so a stale bookmark lands somewhere useful. */
export function AdminRecordNotFound({
  backTo,
  message,
}: {
  backTo: { label: string; href: string }
  message: string
}) {
  return (
    <PrimaryPageTemplate
      maxWidthClassName="max-w-3xl"
      contentClassName="px-8 pt-8 pb-24"
      siteHeader={{
        breadcrumbs: [{ label: backTo.label, href: backTo.href }],
        title: "Record not found",
      }}
    >
      <div className="rounded-2 border border-dashed border-border p-10 text-center">
        <h1 className="text-lg font-semibold text-foreground">Record not found</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{message}</p>
        <Button type="button" className="mt-5" asChild>
          <Link to={backTo.href}>Back to {backTo.label.toLowerCase()}</Link>
        </Button>
      </div>
    </PrimaryPageTemplate>
  )
}
