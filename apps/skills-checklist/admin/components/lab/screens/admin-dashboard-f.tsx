"use client"

/**
 * Admin Dashboard, variant F: narrative brief (concept F in design/dashboard-concepts; formerly variant A, strategy/06 section 5.1).
 * Bands: verdict band (Filters sits in the header beside Export) (hero number, cause, primary action, 3 supporting figures), diagnose row (who is behind on the gap
 * axis | which required skill blocks the most), then one Waiting work band: stuck requests by site | Needs you. Single scope; comparison across
 * cohorts or groups only through Split by. Demo states: ?state=loading|empty|clear|error|partial|stale.
 */
import * as React from "react"
import { DashboardPage } from "@/components/lab/dashboard/frame"
import { TYPE } from "@/components/lab/type-scale"
import { setupOnly, BlockerCard, CardError, Hero, NeedsYou, SetupHero, SitesCard, WhoIsBehindCard } from "@/components/lab/dashboard/cards"

export function AdminDashboardF() {
  return (
    <DashboardPage variant="F">
      {({ model, scope, split, setSplit, demo, clearDemo }) =>
        demo === "empty" ? (
          <div className="flex flex-col gap-4">
            <SetupHero termName={model.term.name} />
            <NeedsYou model={setupOnly(model)} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Hero model={model} />
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {demo === "error" ? (
                <CardError className="lg:col-span-7" title="Students behind, by gap" onRetry={clearDemo} />
              ) : (
                <WhoIsBehindCard className="lg:col-span-7" model={model} scope={scope} split={split} onSplit={setSplit} partial={demo === "partial"} />
              )}
              <BlockerCard className="lg:col-span-5" model={model} scope={scope} />
            </div>
            {/* One band, one question: what is waiting, and on whom (2026-10-30: merged into one group, as on dashboard A, when
                Filters moved to the header and the band rose into the first viewport; strategy/07 regions budget 5). */}
            <section aria-labelledby="group-waiting" className="flex flex-col gap-3" data-region="waiting">
              <h2 id="group-waiting" className={TYPE.section}>Waiting work</h2>
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                <SitesCard className="lg:col-span-8" model={model} scope={scope} />
                <NeedsYou className="lg:col-span-4 self-start" model={model} />
              </div>
            </section>
          </div>
        )
      }
    </DashboardPage>
  )
}
