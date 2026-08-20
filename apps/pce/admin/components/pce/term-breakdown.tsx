'use client'

// ============================================================================
// Term card "Breakdown Mode" — Aug 19 2026 dashboard feedback, Cases 4–9.
//
// Documented hand-roll (docs/governance/ds-adoption.md "Documented hand-rolls
// → PCE", ds-adoption-reviewer 2026-08-19): status-bucket rows for a term
// card once evaluations exist. The DS has no status-action-row organism —
// DataRowList is a filterable/virtualized list hub, MetricItem.progress is a
// KPI-strip mini-bar with no action buttons.
//
// Fourth pass, same day, from a live design review (Romit): "each row maps
// to which situation... where's the logical grouping." The flat list this
// started as had no structure beyond "here are five facts in a row" — this
// version groups by lifecycle phase instead:
//   Setup      — not-configured / draft / scheduled: nothing has gone out
//                yet, the work is getting evaluations ready to send.
//   Collection — live / closed: evaluations are out, this is about
//                responses. The at-risk detail folds into the Live row as
//                its own subtitle line instead of a separate, unexplained
//                sibling row — it's a fact ABOUT Live, not a peer of it, and
//                it shared the exact same "Remind" destination anyway.
// Two groups, one small label each — not per-row, so this doesn't repeat the
// uppercase-tracking-wide "Claude tell" the workspace explicitly bans.
//
// Row actions were DS `Button`s through the third pass — Romit: "buttons are
// making it really difficult and asking for too much attention... is there
// a better way... such as links?" Replaced with plain text links.
//
// Fifth pass, same day: primary links first used `--foreground`, matching
// the `ViewTermLink` convention elsewhere in dashboard-home.tsx — but that's
// the exact same color as BreakdownRow's own title text, so actions and
// content were indistinguishable (Romit: "the links aren't clear to me and
// hard to distinguish between content and action"). Primary now uses
// `--primary`, the token the DS's own `Button variant="link"` applies —
// borrowed for genuine brand-tinted distinction without taking on that
// component's button-box sizing, which doesn't fit a compact row action.
//
// Eighth pass, same day: row titles got a short lead ("3 courses live") to
// stop actions wrapping to their own line (seventh pass), but the demoted
// subtitle detail was still three unrelated facts glued together with
// middle-dots — "Next closes today · Avg response 47% · 2 below 60%".
// Romit: "doesn't give context with any storytelling." Subtitles are now
// composed as real sentences in pce-term-metrics.ts (`liveNarrative`,
// `closedNarrative`, `coverageDetail`) that connect the numbers into a
// claim — e.g. the response average becomes evidence FOR "2 of 3 courses
// are behind on responses" instead of a fourth, disconnected stat — and the
// Closed row drops a redundant duplicate percentage the title already
// implied, replacing it with the actual outcome.
//
// Ninth pass, same day — full content + visual-hierarchy audit (Romit: "the
// content looks conflicting and confusing... doesn't make sense as the user
// reads through"). Concrete fixes from that audit:
//   - Scheduled row's "Update"/"Delete" actions linked to the identical
//     workspace href — two labels promising different, consequential
//     actions that did the exact same thing. Collapsed to one "Manage" link
//     until real per-row update/delete exist.
//   - Closed row's icon (fa-hourglass-half, reads as "still counting down")
//     contradicted its own "Finished collecting" copy. Swapped to
//     fa-flag-checkered.
//   - "Set up evaluation" is now plural-aware ("Set up evaluations") when
//     the row it's attached to covers more than one course.
//   - "Response collection" renamed to "Collecting responses" — matches the
//     verb-first register the row content itself uses, less clinical.
//
// Tenth pass, same day — identifiability + priority-driven visuals. Romit:
// "2 courses need setup, which courses?... there needs to be an intent when
// you are adding a line... think holistically... proper hierarchy,
// visualization... add a sub card background color to differentiate... but
// be careful not to apply to every situation." Sequence that led here:
//   1. Mobbin research (ClickUp, Vanta, Midday, Linear) showed real SaaS
//      rows stay text-only or use small muted chips — never a per-row
//      chart. shadcn docs surfaced `HoverCard` (richer than `Tip` for a
//      multi-item disclosure) and confirmed `Badge`/`DropdownMenu` APIs.
//   2. Vishal's original mock (course-eval-dashboard-v0, Aug 2026) boxed
//      each status bucket in its own tinted sub-card with real DS Buttons
//      for actions on their own line. Romit: "use these as reference on why
//      that mattered, but it doesn't have to be designed like that" — the
//      lesson taken was STRUCTURAL (urgent content earns its own visual
//      space and a dedicated action line), not literal (still links, not
//      buttons — Romit rejected buttons for this list back in the third
//      pass, that stands).
// Net result:
//   - `CourseChips` names the specific courses in a bucket (Badge pills),
//     with a `HoverCard`-based "+N more" for buckets too large to list
//     inline — no more guessing which course a count refers to.
//   - `RowCountdown` gives date facts ("Opens in 107 days") their own small
//     icon+text chip, matching the `CountdownIndicator` pattern already
//     established in dashboard-home.tsx, instead of burying them in prose.
//   - Two-action rows (Live: Remind + Extend) collapse to one visible
//     primary link + an overflow trigger (`DropdownMenu`) — there's never a
//     "which one's primary" question because there's only one link to read.
//   - Exactly two rows can qualify as "urgent": Live with at-risk courses,
//     and (Upcoming-only) Setup when the term starts imminently with low
//     coverage. Both reuse the SAME reserved tint
//     (`LIST_HUB_STATUS_TINT_WARNING`, already defined, previously only
//     used for icon color) as a flat background wash — no border, no
//     shadow, no card-in-card chrome (`BreakdownRow`'s own doctrine below
//     still holds) — plus their own dedicated action line and a short
//     consequence sentence. Every other row stays exactly as flat/compact
//     as before; density scales with priority, not applied everywhere.
// ============================================================================

import Link from 'next/link'
import {
  StatusBadge, Tip, Badge, Button,
  HoverCard, HoverCardTrigger, HoverCardContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@exxatdesignux/ui'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
} from '@/lib/list-status-badges'
import {
  type CourseBreakdown,
  coveragePercent, isFullyCovered, coverageLead, coverageDetail, coverageCodes, coverageUrgentConsequence,
  scheduledLead, scheduledDetail, scheduledCountdown,
  liveLead, liveNarrative, liveCountdown, liveAtRiskCodes, liveUrgentConsequence,
  closedNarrative, courseRates,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/** Row action — real DS `Button variant="ghost" size="sm"`, not a hand-rolled
 *  Link (eleventh pass, same day). The color-plus-underline fix (fifth pass,
 *  below) was still reading as too subtle to operate — re-checked the DS's
 *  own compiled CVA source rather than trusting that prior conclusion, and
 *  found `ghost` has NO border/fill at rest (`text-foreground
 *  hover:bg-interactive-hover`, `--interactive-hover: var(--muted)`) — it
 *  was never actually as loud as the `outline`/`default` Button Romit
 *  rejected in the third pass (those carry an always-on border+fill; ghost
 *  doesn't). `size="sm"` (h-8) matches `RowActionMenu`'s own `icon-sm`
 *  trigger height so the two controls in a row sit at the same height.
 *  `className="text-muted-foreground hover:text-foreground"` /
 *  `"text-primary hover:text-primary"` is the same override pattern already
 *  used 8+ times elsewhere in this app (courses-evaluatees steps, templates
 *  hub) — not a one-off.
 *
 *  Icon + label, not label alone — the disambiguation signal is now the
 *  icon + real button hover/focus affordance (shape), not color alone,
 *  which is what already failed once (fifth pass). Icons reuse the exact
 *  verbs' icons from term-workspace.tsx's own actions column (fa-bell
 *  Remind, fa-pen-ruler Manage/Set up, fa-share-from-square Review) —
 *  this table and this card described the same actions with two different
 *  icon vocabularies (one had icons, one didn't) until now.
 *
 *  Fifth pass (superseded above, kept for the record): primary links first
 *  used `--foreground`, matching `ViewTermLink`'s convention elsewhere in
 *  dashboard-home.tsx — but that's the exact color `BreakdownRow` uses for
 *  its own title text, so actions and content were indistinguishable
 *  (Romit: "the links aren't clear to me and hard to distinguish between
 *  content and action"). */
export function RowAction({
  href, primary = false, icon, children,
}: {
  href: string
  primary?: boolean
  icon: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={primary ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-foreground'}
    >
      <Link href={href}>
        <i className={`fa-light ${icon}`} aria-hidden="true" />
        {children}
      </Link>
    </Button>
  )
}

/** Overflow trigger for a row's secondary action(s) — pairs with one
 *  visible `RowAction primary`. Tenth pass: replaces a second same-weight
 *  inline link (Remind + Extend used to sit side by side with only color/
 *  underline telling them apart, which kept reading as ambiguous even after
 *  the fifth-pass contrast fix). With only one link ever visible, there's
 *  nothing left to disambiguate. */
function RowActionMenu({ items }: { items: { href: string; label: string; icon: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="More actions" className="size-5 shrink-0 text-muted-foreground">
          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <i className={`fa-light ${item.icon}`} aria-hidden="true" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Names the specific courses a row's count refers to (Romit: "2 courses
 *  need setup, which courses?... there needs to be an intent when you are
 *  adding a line"). Shows up to `max` as `Badge` pills; anything past that
 *  collapses into a `HoverCard`-disclosed "+N more" rather than growing the
 *  row unboundedly — an 11-course bucket stays exactly as tall as a
 *  1-course one. `rates`, when passed, appends each course's response rate
 *  to its pill — only done on the urgent Live row, where knowing WHICH
 *  course and HOW far behind both matter; every other row's chips stay
 *  name-only so density stays proportional to priority. */
function CourseChips({
  codes, rates, atRisk, max = 3,
}: {
  codes: string[]
  rates?: Record<string, number>
  atRisk?: Set<string>
  max?: number
}) {
  if (codes.length === 0) return null
  const shown = codes.slice(0, max)
  const hidden = codes.slice(max)
  const label = (code: string) => (rates?.[code] != null ? `${code} · ${rates[code]}%` : code)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((code) => (
        <Badge
          key={code}
          variant="outline"
          className="rounded-full px-2 py-0 text-[11px] font-medium tabular-nums"
          style={
            atRisk?.has(code)
              ? { color: LIST_HUB_STATUS_TINT_WARNING.fg, background: LIST_HUB_STATUS_TINT_WARNING.bg, borderColor: LIST_HUB_STATUS_TINT_WARNING.border }
              : undefined
          }
        >
          {label(code)}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <HoverCard openDelay={100}>
          <HoverCardTrigger asChild>
            <Badge
              variant="outline"
              tabIndex={0}
              className="cursor-default rounded-full border-dashed px-2 py-0 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ color: 'var(--primary)' }}
            >
              +{hidden.length} more
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent align="start" className="w-auto max-w-64 p-2">
            <div className="flex flex-wrap gap-1">
              {hidden.map((code) => (
                <Badge key={code} variant="outline" className="rounded-full px-2 py-0 text-[11px] font-medium">
                  {label(code)}
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  )
}

/** Date fact as its own small chip — icon + tabular-nums text — rather than
 *  folded into a sentence (Romit: "Next opens in 107 days, can we use some
 *  different ds component"). Matches `CountdownIndicator`'s anatomy
 *  (dashboard-home.tsx, used for `daysLeft`/`startsIn`) instead of
 *  inventing a new date treatment for this one spot. */
function RowCountdown({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium tabular-nums"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />
      {label}
    </span>
  )
}

/** Shared row anatomy. Not a bordered box by default — a row inside the
 *  card's own list, not a sibling card (still true even with `urgent`
 *  below: that's a flat color wash, never a border/shadow/radius treatment,
 *  which is what would actually reintroduce the card-in-card look this
 *  comment originally ruled out).
 *
 *  `urgent` is the priority-driven exception (tenth pass): reserved for a
 *  row that's BOTH time-bound and has something genuinely wrong with it
 *  (Live closing with at-risk courses; Setup with an imminent term start
 *  and low coverage) — never applied by row TYPE alone. An urgent row gets
 *  the reserved warning wash, a left accent, its `narrative` line, and its
 *  action(s) on their own line below instead of crammed inline next to the
 *  title — the same "give the urgent thing more room" instinct behind
 *  Vishal's original boxed-button mock, without the box or the buttons. */
export function BreakdownRow({
  icon, tint, title, subtitle, meta, srSummary, narrative, actions, urgent = false,
}: {
  icon: string
  tint: { bg: string; fg: string } | null
  title: string
  /** Plain prose fallback line — still used where there's no course list to
   *  name (the fully-covered banner, the readiness row). */
  subtitle?: string
  /** Course chips + optional countdown chip — replaces `subtitle` when a
   *  row has real courses to name. */
  meta?: React.ReactNode
  /** Full-sentence equivalent of `meta`, screen-reader only — decomposing
   *  the sentence into chips shouldn't mean losing it for anyone who can't
   *  see the chips. */
  srSummary?: string
  /** Short consequence line — only present on `urgent` rows. */
  narrative?: string
  actions?: React.ReactNode
  urgent?: boolean
}) {
  return (
    <div
      className={
        'flex items-start gap-2 border-t border-border/60 py-2 first:border-t-0' +
        (urgent ? ' -mx-2.5 mt-0.5 rounded-md border-t-0 border-l-2 px-2.5' : '')
      }
      style={urgent ? { background: LIST_HUB_STATUS_TINT_WARNING.bg, borderLeftColor: LIST_HUB_STATUS_TINT_WARNING.border } : undefined}
    >
      <i
        className={`fa-light ${icon} mt-0.5 shrink-0`}
        style={{ color: tint?.fg ?? 'var(--muted-foreground)', fontSize: 12 }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <p className="text-xs font-medium text-foreground">{title}</p>
          {actions && !urgent && <div className="ms-auto flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {meta && (
          <>
            {meta}
            {srSummary && <span className="sr-only">{srSummary}</span>}
          </>
        )}
        {narrative && <p className="text-xs text-muted-foreground">{narrative}</p>}
        {actions && urgent && <div className="mt-0.5 flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}

/** Small sentence-case cluster label — not uppercase/tracking-wide (that's
 *  the banned "Claude tell"), one per group, says what phase these rows
 *  belong to rather than leaving the reader to infer it from a bare list.
 *  Exported so `UpcomingCard`'s readiness row (dashboard-home.tsx) can use
 *  the same label anatomy — it used to sit unlabeled right above "Setup"
 *  with identical row anatomy, reading as if it were part of that group
 *  when it's actually a separate data-readiness concern (UX audit, I4). */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}

export function TermBreakdown({
  term, breakdown, needsAttention = false, hideLiveAndClosed = false, setupUrgent = null,
}: {
  term: ProgramTerm
  breakdown: CourseBreakdown
  /** Last-column-only warning (Cases 4–6): the term ended with courses still
   *  unconfigured, drafted, or scheduled — nothing to act on for Current or
   *  Upcoming, where that's simply normal in-progress state. */
  needsAttention?: boolean
  /** Upcoming-column-only: a term that hasn't started yet can't have Live or
   *  Closed evaluations — those states are logically impossible before the
   *  term begins, so this hides them regardless of what the underlying data
   *  says, rather than trusting mock data not to have that combination. */
  hideLiveAndClosed?: boolean
  /** Upcoming-column-only compound condition (term starts imminently, low
   *  coverage) — computed by the caller, which already has `startsIn` in
   *  scope. Non-null triggers the Setup row's urgent treatment. */
  setupUrgent?: { startsInDays: number } | null
}) {
  const b = breakdown
  const fullyCovered = isFullyCovered(b)
  const coveragePct = coveragePercent(b)
  const setupTotal = b.notConfiguredCount + b.draft.length
  const setupCodes = coverageCodes(b.notConfiguredCodes, b.draft)
  const covLead = coverageLead(b.notConfiguredCount, b.draft.length)
  const covDetail = coverageDetail(b.notConfiguredCount, b.draft.length)
  const schedLead = scheduledLead(b.scheduled)
  const schedDetail = scheduledDetail(b.scheduled)
  const schedCountdown = scheduledCountdown(b.scheduled)
  const scheduledCodes = b.scheduled.map((s) => s.courseCode)
  const liveLeadText = liveLead(b.live)
  const liveStory = liveNarrative(b.live)
  const liveCountdownText = liveCountdown(b.live)
  const liveCodes = b.live.map((s) => s.courseCode)
  const liveAtRisk = liveAtRiskCodes(b.live)
  const isLiveUrgent = liveAtRisk.size > 0
  const liveConsequence = liveUrgentConsequence(b.live)
  const closedStory = closedNarrative(b.closed)
  const closedCodes = b.closed.map((s) => s.courseCode)
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`

  const isSetupUrgent = !!setupUrgent && !fullyCovered && setupTotal > 0

  const showSetupGroup = !fullyCovered || b.scheduled.length > 0
  const showCollectionGroup = !hideLiveAndClosed && (b.live.length > 0 || b.closed.length > 0)

  return (
    <div className="flex flex-col gap-3">
      {needsAttention && (
        <Tip label="Term ended with evaluations still outstanding" side="top">
          <span tabIndex={0} className="inline-flex w-fit outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <StatusBadge label="Needs attention" tone="warning" icon="fa-triangle-exclamation" size="sm" />
          </span>
        </Tip>
      )}

      {/* "All courses scheduled" used to say this — `isFullyCovered` means
          nothing is left unconfigured or in draft, NOT that every course's
          individual status is literally "scheduled." Found live on
          Ridgeline DPT (Case 6): this banner and the Setup group's own
          "N courses scheduled" row (a narrower, different status — one
          that hasn't gone live yet) rendered on the same card at the same
          time, using the same word for two different things. */}
      {fullyCovered && (
        <BreakdownRow icon="fa-circle-check" tint={LIST_HUB_STATUS_TINT_SUCCESS} title="Evaluation coverage complete" />
      )}

      {/* Setup — not-configured / draft / scheduled: nothing here has gone
          out yet, this is entirely prep work. */}
      {showSetupGroup && (
        <div className="flex flex-col gap-1.5">
          <GroupLabel>Setup</GroupLabel>
          <div className="flex flex-col">
            {!fullyCovered && (
              <div className="flex items-baseline justify-between gap-2 py-2">
                <span className="text-xs text-muted-foreground">Evaluation coverage</span>
                <span className="text-sm font-semibold tabular-nums leading-none text-foreground">{coveragePct}%</span>
              </div>
            )}
            {!fullyCovered && covLead && (
              <BreakdownRow
                icon="fa-list-check"
                tint={null}
                title={covLead}
                meta={<CourseChips codes={setupCodes} />}
                srSummary={covDetail ?? undefined}
                narrative={isSetupUrgent ? coverageUrgentConsequence(setupUrgent!.startsInDays, coveragePct) : undefined}
                urgent={isSetupUrgent}
                actions={
                  <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                    {setupTotal === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                  </RowAction>
                }
              />
            )}
            {b.scheduled.length > 0 && schedLead && (
              <BreakdownRow
                icon="fa-calendar"
                tint={LIST_HUB_STATUS_TINT_PLANNED}
                title={schedLead}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <CourseChips codes={scheduledCodes} />
                    {schedCountdown && <RowCountdown label={schedCountdown} />}
                  </div>
                }
                srSummary={schedDetail ?? undefined}
                actions={<RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">Manage</RowAction>}
              />
            )}
          </div>
        </div>
      )}

      {/* Collection — live / closed: evaluations are out, this is about
          responses. At-risk detail is a fact ABOUT the live row (folded
          into its own subtitle), not a separate row — it shares the exact
          same "Remind" destination, so a second row saying it again in
          different words was two facts pretending to be independent. */}
      {showCollectionGroup && (
        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
          <GroupLabel>Collecting responses</GroupLabel>
          <div className="flex flex-col">
            {b.live.length > 0 && liveLeadText && (
              <BreakdownRow
                icon="fa-circle-dot"
                tint={LIST_HUB_STATUS_TINT_SUCCESS}
                title={liveLeadText}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <CourseChips codes={liveCodes} rates={courseRates(b.live)} atRisk={liveAtRisk} />
                    {liveCountdownText && <RowCountdown label={liveCountdownText} urgent={isLiveUrgent} />}
                  </div>
                }
                srSummary={liveStory ?? undefined}
                narrative={isLiveUrgent ? liveConsequence ?? undefined : undefined}
                urgent={isLiveUrgent}
                actions={
                  <>
                    <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">Remind</RowAction>
                    <RowActionMenu items={[{ href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' }]} />
                  </>
                }
              />
            )}
            {b.closed.length > 0 && (
              <BreakdownRow
                icon="fa-flag-checkered"
                tint={LIST_HUB_STATUS_TINT_WARNING}
                title={`${b.closed.length} of ${b.totalCourses} closed`}
                meta={<CourseChips codes={closedCodes} rates={courseRates(b.closed)} />}
                srSummary={closedStory ?? undefined}
                actions={<RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">Review feedback</RowAction>}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
