'use client'

/**
 * /my-analytics — faculty longitudinal analytics. Not built yet, and this page
 * says so honestly instead of pretending.
 *
 * WHY "coming soon" here is a sequencing statement, not a scope cut:
 * the Jul 13 decision (analytics: single-survey vs multi-survey) splits this in
 * two — single-survey analytics (one course × term: per-question breakdown +
 * comments) "ships to engineering first" and ALREADY EXISTS under My Results.
 * Multi-survey / longitudinal analytics is the later leg. So what's pending is
 * specifically the across-terms view — which is what this page names.
 *
 * D-4 guardrail (Aarti) binds whatever lands here: faculty see their own
 * performance vs an AVERAGE, never peer comparison — and never a percentile or
 * rank, because those reverse-encode peer position. The copy below is written
 * to promise only what D-4 permits.
 *
 * Not a centered-blob empty state (a banned pattern): it names what is coming,
 * and routes you to the analytics that do exist today.
 */

import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'

const PLANNED: { icon: string; title: string; body: string }[] = [
  {
    icon: 'fa-chart-line',
    title: 'Your rating trend across terms',
    body: 'How a course you teach has moved term over term, so a single cohort’s feedback isn’t read as a trend.',
  },
  {
    icon: 'fa-code-compare',
    title: 'Your scores against the program average',
    body: 'Context for a number without naming anyone else — your own performance next to the department and program averages.',
  },
  {
    icon: 'fa-layer-group',
    title: 'Section-level breakdown',
    body: 'Course performance and your teaching scored separately, so you can see which one moved.',
  },
]

export default function MyAnalyticsPage() {
  return (
    <>
      <SiteHeader title="Analytics" />
      <PageHeader
        title="Analytics"
        subtitle="Longitudinal analytics across your courses and terms."
      />

      <div className="flex-1 overflow-auto px-7 py-4">
        <div className="flex flex-col gap-4 max-w-3xl">
          <Card size="sm" className="border-dashed bg-muted/25">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Coming soon</CardTitle>
              <CardDescription className="max-w-[520px]">
                Results for a single course are available today under{' '}
                <strong>My Results</strong> — every question, its score breakdown, and
                student comments. Analytics across terms is being built next.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href="/results">Go to My Results</Link>
              </Button>
            </CardContent>
          </Card>

          <section aria-label="Planned in analytics">
            <h2 className="text-sm font-medium mb-2">What you’ll get here</h2>
            <ul className="flex flex-col gap-2">
              {PLANNED.map((p) => (
                <li key={p.title}>
                  <Card size="sm">
                    <CardContent className="flex items-start gap-3">
                      <i
                        className={`fa-light ${p.icon} text-muted-foreground mt-0.5 shrink-0`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.body}</p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
