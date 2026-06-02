/**
 * STUDY RESOURCES — student-facing practice + reference surface.
 *
 * Three sections:
 *   1. Recommended for you — based on competency weak areas (cross-course)
 *   2. Faculty-assigned practice packs — Aarti's course-coordinator workflow
 *      (faculty assigns extra practice to bottom-20% post-exam)
 *   3. Resource library — reference material, rationales, study guides
 *
 * The "Recommended" section is the differentiator — it surfaces relevant
 * practice based on student performance gaps, not just a flat catalog.
 */

import { useState } from 'react'
import {
  Avatar, AvatarFallback,
  Badge, Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@exxat/ds/packages/ui/src'

// ─── Mock data ──────────────────────────────────────────────────────────────

type RecommendedItem = {
  id: string
  type: 'practice-pack' | 'review-prompt' | 'rationale' | 'reading'
  title: string
  reason: string                 // why we're recommending it
  competencyArea: string
  source: 'ai' | 'faculty' | 'auto'
  estimatedMinutes: number
  questionCount?: number
  weakSignal?: { yourScore: number; cohortMedian: number }
}

const RECOMMENDED: RecommendedItem[] = [
  {
    id: 'r1', type: 'practice-pack',
    title: 'Antimicrobial Therapy — Targeted Practice',
    reason: 'You scored 71% on this content area in MICRO 401, vs. 79% cohort median.',
    competencyArea: 'Antimicrobial Therapy',
    source: 'faculty',
    estimatedMinutes: 25,
    questionCount: 15,
    weakSignal: { yourScore: 71, cohortMedian: 79 },
  },
  {
    id: 'r2', type: 'review-prompt',
    title: 'Pharmacokinetics half-life calculations',
    reason: 'AI-flagged based on Q14 of Pharmacokinetics Final — try a similar problem set.',
    competencyArea: 'Pharmacokinetics',
    source: 'ai',
    estimatedMinutes: 12,
    questionCount: 8,
  },
  {
    id: 'r3', type: 'rationale',
    title: 'Cellular Injury & Adaptation — Reviewed Rationales',
    reason: 'You missed 3 questions in this area on Pathology Quiz (Apr 2).',
    competencyArea: 'Cellular Pathology',
    source: 'auto',
    estimatedMinutes: 18,
    questionCount: 8,
  },
  {
    id: 'r4', type: 'practice-pack',
    title: 'Drug-drug Interactions — Mixed Difficulty',
    reason: 'Your Pharmacology trend shows decline; this pack mirrors the upcoming final\'s rigor.',
    competencyArea: 'Drug Interactions',
    source: 'ai',
    estimatedMinutes: 35,
    questionCount: 22,
  },
]

type FacultyPack = {
  id: string
  title: string
  course: string
  facultyName: string
  facultyInitials: string
  assignedDate: string
  dueDate?: string
  questionCount: number
  status: 'not-started' | 'in-progress' | 'completed'
  progress?: number
  message?: string
}

const FACULTY_PACKS: FacultyPack[] = [
  {
    id: 'f1', title: 'Antimicrobial Therapy — Catch-up Pack',
    course: 'MICRO 401', facultyName: 'Dr. Priya Nair', facultyInitials: 'PN',
    assignedDate: '2026-04-26', dueDate: '2026-05-12',
    questionCount: 15, status: 'in-progress', progress: 6,
    message: 'Ramona — based on your Unit 2 results, focus on these 15 questions before the final. Reach out if anything is unclear.',
  },
  {
    id: 'f2', title: 'Cellular Injury — Rationale Walkthrough',
    course: 'PATH 503', facultyName: 'Dr. Eric Hoffman', facultyInitials: 'EH',
    assignedDate: '2026-04-04',
    questionCount: 8, status: 'completed', progress: 8,
  },
  {
    id: 'f3', title: 'Drug-drug Interactions Module',
    course: 'PHARM 502', facultyName: 'Prof. Anand Kumar', facultyInitials: 'AK',
    assignedDate: '2026-04-30', dueDate: '2026-05-15',
    questionCount: 22, status: 'not-started',
    message: 'Strong work on Module 2. This pack previews what you\'ll see on the Module 3 quiz.',
  },
]

type LibraryItem = {
  id: string
  title: string
  type: 'pdf' | 'video' | 'article' | 'guide'
  course: string
  author: string
  duration?: string  // for videos
  pages?: number     // for pdfs
}

const LIBRARY: LibraryItem[] = [
  { id: 'l1', title: 'Beta-Lactam Antibiotics Mechanism Reference', type: 'pdf',     course: 'MICRO 401', author: 'Dr. Priya Nair', pages: 14 },
  { id: 'l2', title: 'Pharmacokinetics Visual Guide',                type: 'guide',   course: 'PHARM 502', author: 'Prof. Anand Kumar', pages: 28 },
  { id: 'l3', title: 'Cardiovascular Anatomy — Clinical Cases',      type: 'video',   course: 'ANAT 601',  author: 'Dr. Meera Pillai', duration: '24 min' },
  { id: 'l4', title: 'Inflammation & Repair — Image Atlas',          type: 'pdf',     course: 'PATH 503',  author: 'Dr. Eric Hoffman', pages: 42 },
  { id: 'l5', title: 'Common Drug-drug Interactions Cheat-Sheet',    type: 'pdf',     course: 'PHARM 502', author: 'Prof. Anand Kumar', pages: 6 },
  { id: 'l6', title: 'Auscultation Patterns Reference',              type: 'video',   course: 'CLIN 301',  author: 'Prof. Marcus Lee', duration: '18 min' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function StudyResources() {
  const [query, setQuery] = useState('')

  return (
    <div className="flex flex-1 flex-col px-6 py-6 gap-5" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-5">

        {/* Header */}
        <header className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight font-heading">Study Resources</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Practice packs, AI-recommended review, and reference material — tailored to your performance gaps.
            </p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full gap-1.5"
            style={{
              backgroundColor: 'var(--brand-tint)',
              color: 'var(--brand-color)',
            }}
          >
            <i className="fa-duotone fa-solid fa-sparkles" aria-hidden="true" style={{ fontSize: 11 }} />
            Personalized for you
          </Badge>
        </header>

        {/* Search */}
        <InputGroup className="w-full max-w-sm">
          <InputGroupAddon align="inline-start">
            <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search resources, courses, topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search resources"
          />
        </InputGroup>

        {/* Tabs */}
        <Tabs defaultValue="recommended" className="w-full">
          <TabsList variant="line">
            <TabsTrigger value="recommended">
              <i className="fa-light fa-bullseye-arrow me-1.5" aria-hidden="true" />
              Recommended
            </TabsTrigger>
            <TabsTrigger value="faculty">
              <i className="fa-light fa-user-graduate me-1.5" aria-hidden="true" />
              Faculty assigned
            </TabsTrigger>
            <TabsTrigger value="library">
              <i className="fa-light fa-book-open me-1.5" aria-hidden="true" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="pt-5">
            <RecommendedSection items={RECOMMENDED} />
          </TabsContent>

          <TabsContent value="faculty" className="pt-5">
            <FacultyPacksSection items={FACULTY_PACKS} />
          </TabsContent>

          <TabsContent value="library" className="pt-5">
            <LibrarySection items={LIBRARY} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Recommended ────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<RecommendedItem['source'], { label: string; icon: string }> = {
  ai:      { label: 'AI suggestion',  icon: 'fa-duotone fa-solid fa-sparkles' },
  faculty: { label: 'From faculty',   icon: 'fa-user-graduate' },
  auto:    { label: 'Auto-flagged',   icon: 'fa-bolt' },
}

const TYPE_LABEL: Record<RecommendedItem['type'], string> = {
  'practice-pack': 'Practice pack',
  'review-prompt': 'Review prompt',
  'rationale':     'Rationale review',
  'reading':       'Reading',
}

function RecommendedSection({ items }: { items: RecommendedItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(item => (
        <RecommendedCard key={item.id} item={item} />
      ))}
    </div>
  )
}

function RecommendedCard({ item }: { item: RecommendedItem }) {
  const src = SOURCE_LABEL[item.source]
  return (
    <article
      className="rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
      style={{ background: 'var(--card)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant="secondary"
          className="rounded-full gap-1.5"
          style={
            item.source === 'ai'
              ? { backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color)' }
              : item.source === 'faculty'
                ? { backgroundColor: 'color-mix(in oklch, var(--chart-1) 12%, var(--background))', color: 'var(--chart-1)' }
                : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
          }
        >
          <i className={src.icon} aria-hidden="true" style={{ fontSize: 10 }} />
          {src.label}
        </Badge>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {TYPE_LABEL[item.type]}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground leading-snug font-heading">{item.title}</h3>

      <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>

      {item.weakSignal && (
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">You</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden relative">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${item.weakSignal.yourScore}%`,
                background: 'var(--state-warning-dark)',
              }}
            />
            <div
              className="absolute inset-y-0 w-px"
              style={{
                left: `${item.weakSignal.cohortMedian}%`,
                background: 'var(--foreground)',
              }}
              aria-hidden="true"
            />
          </div>
          <span className="font-mono tabular-nums text-foreground font-semibold">{item.weakSignal.yourScore}%</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono tabular-nums text-muted-foreground">cohort {item.weakSignal.cohortMedian}%</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><i className="fa-light fa-clock" aria-hidden="true" />{item.estimatedMinutes} min</span>
          {item.questionCount && (
            <span className="inline-flex items-center gap-1"><i className="fa-light fa-circle-question" aria-hidden="true" />{item.questionCount} Qs</span>
          )}
          <span className="inline-flex items-center gap-1"><i className="fa-light fa-tag" aria-hidden="true" />{item.competencyArea}</span>
        </span>
        <Button size="sm" variant="default" className="gap-1.5 text-xs">
          Start
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

// ─── Faculty packs ──────────────────────────────────────────────────────────

function FacultyPacksSection({ items }: { items: FacultyPack[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(pack => <FacultyPackRow key={pack.id} pack={pack} />)}
    </div>
  )
}

function FacultyPackRow({ pack }: { pack: FacultyPack }) {
  const progressPct = pack.progress != null ? Math.round((pack.progress / pack.questionCount) * 100) : 0
  const statusTone =
    pack.status === 'completed' ? { fg: 'var(--state-success-dark)',     bg: 'var(--state-success-bg-soft)',  label: 'Completed'   } :
    pack.status === 'in-progress' ? { fg: 'var(--state-info-blue-dark)',  bg: 'var(--state-info-blue-bg)',     label: 'In progress' } :
                                   { fg: 'var(--state-warning-dark)',     bg: 'var(--state-warning-bg-soft)',  label: 'Not started' }

  return (
    <article
      className="rounded-xl border border-border p-4 flex flex-col gap-3"
      style={{ background: 'var(--card)' }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback
            className="text-xs font-bold"
            style={{ background: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
          >
            {pack.facultyInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground font-heading">{pack.title}</h3>
            <Badge variant="secondary" className="rounded font-mono text-[9px] uppercase tracking-wider"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              {pack.course}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Assigned by <span className="text-foreground font-medium">{pack.facultyName}</span>
            {' · '}
            {new Date(pack.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {pack.dueDate && (
              <>
                {' · due '}
                <span className="text-foreground font-medium">
                  {new Date(pack.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full font-medium shrink-0"
          style={{ backgroundColor: statusTone.bg, color: statusTone.fg }}
        >
          {statusTone.label}
        </Badge>
      </div>

      {pack.message && (
        <div
          className="rounded-md px-3 py-2 text-xs leading-relaxed border-l-2"
          style={{
            background: 'color-mix(in oklch, var(--chart-1) 5%, var(--card))',
            borderLeftColor: 'var(--chart-1)',
            color: 'var(--foreground)',
          }}
        >
          <i className="fa-light fa-quote-left me-1.5 text-muted-foreground" aria-hidden="true" />
          {pack.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: pack.status === 'completed' ? 'var(--state-success-dark)' : 'var(--brand-color)',
            }}
          />
        </div>
        <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
          {pack.progress ?? 0}/{pack.questionCount}
        </span>
        <Button
          size="sm"
          variant={pack.status === 'completed' ? 'outline' : 'default'}
          className="gap-1.5 text-xs"
        >
          {pack.status === 'completed' ? 'Review' : pack.status === 'in-progress' ? 'Continue' : 'Start'}
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

// ─── Library ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<LibraryItem['type'], string> = {
  pdf: 'fa-file-pdf', video: 'fa-circle-play', article: 'fa-newspaper', guide: 'fa-map',
}
const TYPE_TONE: Record<LibraryItem['type'], string> = {
  pdf: 'var(--destructive)', video: 'var(--chart-1)', article: 'var(--chart-2)', guide: 'var(--brand-color)',
}

function LibrarySection({ items }: { items: LibraryItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <article
          key={item.id}
          className="rounded-xl border border-border p-4 flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer"
          style={{ background: 'var(--card)' }}
        >
          <span
            className="flex size-10 items-center justify-center rounded-lg shrink-0"
            style={{
              background: 'var(--muted)',
              color: TYPE_TONE[item.type],
            }}
            aria-hidden="true"
          >
            <i className={`fa-light ${TYPE_ICON[item.type]}`} aria-hidden="true" style={{ fontSize: 16 }} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {item.course} · {item.author}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {item.pages ? `${item.pages} pages` : item.duration}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
