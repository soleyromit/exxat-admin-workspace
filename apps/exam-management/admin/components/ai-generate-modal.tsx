'use client'

/**
 * AI Question Generation Modal — Aarti's central differentiator.
 *
 * "AI-assisted question creation — Generating questions based on curriculum
 * objectives, identifying untested content areas, and flagging gaps before an
 * assessment is published."
 *
 * Three states:
 *   1. SETUP — pick source objectives, count, difficulty mix, Bloom mix
 *   2. GENERATING — ~1.4s mock delay with shimmer; real impl will stream
 *   3. RESULTS — 4 draft questions with accept/refine/reject + "Add to QB"
 *
 * Mock generation. No backend. Real implementation will call an LLM endpoint
 * scoped to the institution's question style guide.
 */

import { useEffect, useState, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Badge, Checkbox,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Tooltip, TooltipTrigger, TooltipContent,
  LocalBanner,
} from '@exxat/ds/packages/ui/src'
import { StatusPill, BloomChip, DifficultyChip, type Tone } from '@/components/faculty-ui-kit'
import type { CourseObjective } from '@/lib/faculty-mock-data'

export interface AiGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Objectives the user wants to generate questions for. */
  objectives: CourseObjective[]
  /**
   * Called with the user-selected drafts when they confirm Add. If provided,
   * the modal CTA reads "Add to assessment" instead of "Add to Question Bank"
   * so the assessment-builder caller can route drafts directly into the
   * active assessment via its own createQuestion path.
   */
  onAccept?: (drafts: AiGenerateAcceptedDraft[]) => void
  /** CTA label override — defaults to "Add to Question Bank". */
  acceptLabel?: string
}

export interface AiGenerateAcceptedDraft {
  stem: string
  options: string[]
  correctIdx: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  blooms: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'
  rationale: string
  objectiveTitle: string
}

type Difficulty = 'Easy' | 'Medium' | 'Hard'
type Bloom = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'

interface DraftQuestion {
  id: string
  code: string
  objectiveTitle: string
  difficulty: Difficulty
  blooms: Bloom
  stem: string
  options: string[]
  correctIdx: number
  rationale: string
  /** UI state */
  selected: boolean
  status: 'idle' | 'refining'
}

type ViewState = 'setup' | 'generating' | 'results'

export function AiGenerateModal({ open, onOpenChange, objectives, onAccept, acceptLabel }: AiGenerateModalProps) {
  const [view, setView] = useState<ViewState>('setup')
  const [count, setCount] = useState<number>(4)
  const [difficultyMix, setDifficultyMix] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed')
  const [bloomMix, setBloomMix] = useState<Bloom | 'Mixed'>('Mixed')
  const [drafts, setDrafts] = useState<DraftQuestion[]>([])

  // Reset on open
  useEffect(() => {
    if (open) {
      setView('setup')
      setDrafts([])
    }
  }, [open])

  const handleGenerate = () => {
    setView('generating')
    // Mock LLM latency
    setTimeout(() => {
      setDrafts(generateDrafts(objectives, count, difficultyMix, bloomMix))
      setView('results')
    }, 1400)
  }

  const handleToggleSelect = (id: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d))
  }

  const handleRefine = (id: string) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'refining' } : d))
    setTimeout(() => {
      setDrafts(prev => prev.map(d => d.id === id ? {
        ...d,
        stem: d.stem + ' (Refined: tightened wording for clarity.)',
        status: 'idle',
      } : d))
    }, 900)
  }

  const handleReject = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const selectedCount = drafts.filter(d => d.selected).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-start gap-3">
            <i className="fa-duotone fa-solid fa-star-christmas text-brand text-base mt-1 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-heading text-lg">Generate questions with AI</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Drafts are scoped to the selected objectives and your institution's style guide. Review before adding to your bank.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {view === 'setup' && (
            <SetupView
              objectives={objectives}
              count={count} setCount={setCount}
              difficultyMix={difficultyMix} setDifficultyMix={setDifficultyMix}
              bloomMix={bloomMix} setBloomMix={setBloomMix}
            />
          )}
          {view === 'generating' && <GeneratingView count={count} />}
          {view === 'results' && (
            <ResultsView
              drafts={drafts}
              objectives={objectives}
              onToggleSelect={handleToggleSelect}
              onRefine={handleRefine}
              onReject={handleReject}
            />
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border shrink-0 gap-2">
          {view === 'setup' && (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleGenerate} disabled={objectives.length === 0} className="gap-2">
                <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />
                Generate {count} {count === 1 ? 'question' : 'questions'}
              </Button>
            </>
          )}
          {view === 'generating' && (
            <Button variant="outline" size="sm" disabled>
              Generating…
            </Button>
          )}
          {view === 'results' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setView('setup')}>
                <i className="fa-light fa-arrow-left" aria-hidden="true" />
                Adjust prompt
              </Button>
              <span className="ms-auto text-xs text-muted-foreground self-center">
                {selectedCount} of {drafts.length} selected
              </span>
              <Button
                size="sm"
                disabled={selectedCount === 0}
                className="gap-2"
                onClick={() => {
                  const accepted: AiGenerateAcceptedDraft[] = drafts
                    .filter(d => d.selected)
                    .map(d => ({
                      stem: d.stem,
                      options: d.options,
                      correctIdx: d.correctIdx,
                      difficulty: d.difficulty,
                      blooms: d.blooms,
                      rationale: d.rationale,
                      objectiveTitle: d.objectiveTitle,
                    }))
                  onAccept?.(accepted)
                  onOpenChange(false)
                }}
              >
                <i className="fa-light fa-plus" aria-hidden="true" />
                {acceptLabel ?? 'Add to Question Bank'} {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Setup view ──────────────────────────────────────────────────────────────
function SetupView({
  objectives, count, setCount, difficultyMix, setDifficultyMix, bloomMix, setBloomMix,
}: {
  objectives: CourseObjective[]
  count: number; setCount: (n: number) => void
  difficultyMix: 'Easy' | 'Medium' | 'Hard' | 'Mixed'; setDifficultyMix: (v: 'Easy' | 'Medium' | 'Hard' | 'Mixed') => void
  bloomMix: Bloom | 'Mixed'; setBloomMix: (v: Bloom | 'Mixed') => void
}) {
  return (
    <div className="px-6 py-5 flex flex-col gap-5">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Source objectives ({objectives.length})
        </p>
        <ul className="flex flex-col gap-1.5">
          {objectives.map(o => (
            <li
              key={o.id}
              className="inline-flex items-center gap-2 rounded-md bg-muted border border-border px-2.5 py-1.5 text-xs font-medium text-foreground"
            >
              <i className="fa-light fa-circle-dashed text-chart-4 shrink-0" aria-hidden="true" style={{ fontSize: 10 }} />
              <span className="line-clamp-1">{o.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Generation settings
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Question count</label>
            <Select value={String(count)} onValueChange={(v) => setCount(parseInt(v, 10))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Difficulty</label>
            <Select value={difficultyMix} onValueChange={(v) => setDifficultyMix(v as typeof difficultyMix)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mixed">Mixed</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Bloom level</label>
            <Select value={bloomMix} onValueChange={(v) => setBloomMix(v as typeof bloomMix)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mixed">Mixed</SelectItem>
                <SelectItem value="Remember">Remember</SelectItem>
                <SelectItem value="Understand">Understand</SelectItem>
                <SelectItem value="Apply">Apply</SelectItem>
                <SelectItem value="Analyze">Analyze</SelectItem>
                <SelectItem value="Evaluate">Evaluate</SelectItem>
                <SelectItem value="Create">Create</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* DS LocalBanner (was hand-rolled info strip per dialog-banner-badge audit) */}
      <LocalBanner variant="info" title="AI drafts are starting points">
        Review every question for clinical accuracy, distractor quality, and alignment with your course before adding to the bank.
      </LocalBanner>
    </div>
  )
}

// ─── Generating view ─────────────────────────────────────────────────────────
function GeneratingView({ count }: { count: number }) {
  return (
    <div className="px-6 py-12 flex flex-col items-center justify-center gap-4">
      <div className="relative size-16 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand/14 [animation:pulse-soft_1.2s_ease-in-out_infinite]" />
        <i className="fa-duotone fa-solid fa-star-christmas text-brand text-3xl relative" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="font-heading text-base font-semibold text-foreground">Drafting {count} questions…</p>
        <p className="text-xs text-muted-foreground mt-1">Aligning to objectives, your style guide, and Bloom distribution.</p>
      </div>
      <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-brand [animation:ai-progress_1.4s_ease-out_forwards]" />
      </div>
      <style jsx>{`
        @keyframes ai-progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}

// ─── Results view ────────────────────────────────────────────────────────────
function ResultsView({
  drafts, objectives, onToggleSelect, onRefine, onReject,
}: {
  drafts: DraftQuestion[]
  objectives: CourseObjective[]
  onToggleSelect: (id: string) => void
  onRefine: (id: string) => void
  onReject: (id: string) => void
}) {
  if (drafts.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-semibold text-foreground">All drafts dismissed</p>
        <p className="text-xs text-muted-foreground mt-1">Adjust the prompt or close this dialog.</p>
      </div>
    )
  }
  return (
    <div className="px-6 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          Generated <span className="text-foreground font-semibold">{drafts.length}</span> {drafts.length === 1 ? 'draft' : 'drafts'} from <span className="text-foreground font-semibold">{objectives.length}</span> {objectives.length === 1 ? 'objective' : 'objectives'}
        </p>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5">
          <i className="fa-light fa-check-double" aria-hidden="true" />
          Select all
        </Button>
      </div>
      {drafts.map((d, idx) => (
        <DraftQuestionCard
          key={d.id}
          draft={d}
          index={idx + 1}
          onToggleSelect={() => onToggleSelect(d.id)}
          onRefine={() => onRefine(d.id)}
          onReject={() => onReject(d.id)}
        />
      ))}
    </div>
  )
}

function DraftQuestionCard({
  draft, index, onToggleSelect, onRefine, onReject,
}: {
  draft: DraftQuestion; index: number
  onToggleSelect: () => void; onRefine: () => void; onReject: () => void
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-all ${draft.selected ? 'border-brand/40 ring-2 ring-brand/15' : 'border-border'}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={draft.selected}
          onCheckedChange={() => onToggleSelect()}
          aria-label={`${draft.selected ? 'Deselect' : 'Select'} draft ${index}`}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="secondary" className="rounded font-mono text-[10px] bg-muted text-foreground">
              {draft.code}
            </Badge>
            <DifficultyChip level={draft.difficulty} />
            <BloomChip level={draft.blooms} />
            <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[260px]" title={draft.objectiveTitle}>
              <i className="fa-light fa-bullseye-pointer me-1" aria-hidden="true" /> {draft.objectiveTitle}
            </span>
            {draft.status === 'refining' && (
              <StatusPill tone="info" icon="fa-arrows-rotate" pulse label="Refining…" />
            )}
          </div>
          <p className={`text-sm text-foreground leading-relaxed mb-3 ${draft.status === 'refining' ? 'opacity-50' : ''}`}>
            {draft.stem}
          </p>
          <ul className="flex flex-col gap-1 mb-2">
            {draft.options.map((opt, oi) => (
              <li
                key={oi}
                className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs ${oi === draft.correctIdx ? 'bg-chart-2/10 border border-chart-2/26' : 'bg-muted'}`}
              >
                <span className={`size-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${oi === draft.correctIdx ? 'bg-chart-2 text-primary-foreground' : 'bg-background text-muted-foreground border border-border'}`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className={oi === draft.correctIdx ? 'font-medium text-foreground' : 'text-foreground'}>
                  {opt}
                </span>
                {oi === draft.correctIdx && (
                  <i className="fa-solid fa-check text-chart-2 text-[10px] ms-auto" aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
          <div className="rounded-md bg-muted/60 border border-border px-2.5 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Rationale</p>
            <p className="text-xs text-foreground leading-snug">{draft.rationale}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onRefine} disabled={draft.status === 'refining'} className="text-xs gap-1.5">
                  <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
                  Refine
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ask AI to tighten wording or change difficulty</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="sm" onClick={onReject} className="text-xs gap-1.5 text-muted-foreground">
              <i className="fa-light fa-xmark" aria-hidden="true" />
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mock generator ─────────────────────────────────────────────────────────
//
// Generates plausible draft questions from given objectives. For demo only —
// real implementation will hit an LLM endpoint scoped to course content.
function generateDrafts(
  objectives: CourseObjective[],
  count: number,
  difficultyMix: 'Easy' | 'Medium' | 'Hard' | 'Mixed',
  bloomMix: Bloom | 'Mixed',
): DraftQuestion[] {
  const STEMS_BY_OBJ: Record<string, { stem: string; options: string[]; correctIdx: number; rationale: string }[]> = {
    // PHAR101-OBJ-6 — Black-box warnings
    'PHAR101-OBJ-6': [
      {
        stem: 'A 65-year-old patient with a history of arrhythmia is being considered for fluoroquinolone therapy. Which black-box warning should the prescriber consider before initiating treatment?',
        options: [
          'Tendon rupture and aortic dissection risk',
          'Severe nephrotoxicity in renal impairment',
          'Hepatic failure from cumulative dose',
          'Bone marrow suppression in elderly',
        ],
        correctIdx: 0,
        rationale: 'Fluoroquinolones carry a black-box warning for tendinopathy/rupture and aortic aneurysm/dissection — especially in older patients. The other options are not part of the boxed warning for this class.',
      },
      {
        stem: 'Which of the following antidiabetic agents carries a black-box warning for the risk of bladder cancer with prolonged use?',
        options: [
          'Pioglitazone',
          'Metformin',
          'Glipizide',
          'Sitagliptin',
        ],
        correctIdx: 0,
        rationale: 'Pioglitazone has a black-box warning for increased risk of bladder cancer, particularly with long-term use. The other agents do not carry this warning.',
      },
    ],
    // BIOL201-OBJ-5 — Apoptosis vs necrosis
    'BIOL201-OBJ-5': [
      {
        stem: 'Which of the following best distinguishes apoptosis from necrosis in a cellular response to injury?',
        options: [
          'Apoptosis is energy-dependent and produces apoptotic bodies; necrosis is uncontrolled cell lysis',
          'Apoptosis releases inflammatory cytokines; necrosis is silent',
          'Apoptosis only occurs in cancer cells; necrosis only in normal cells',
          'Apoptosis requires extracellular calcium; necrosis does not',
        ],
        correctIdx: 0,
        rationale: 'Apoptosis is an ATP-dependent, regulated process that compartmentalizes cellular contents into membrane-bound apoptotic bodies, avoiding inflammation. Necrosis is unregulated, energy-independent, and triggers inflammatory responses through release of damage-associated molecular patterns.',
      },
    ],
  }

  // Generic fallback templates
  const GENERIC_STEMS = [
    {
      stem: 'A faculty member is reviewing the assessment plan for the upcoming term. Which approach best aligns with the principles of curricular mapping for this objective?',
      options: [
        'Tag each question to the specific objective and content area before publication',
        'Group all questions by author rather than objective',
        'Allow questions to remain untagged for instructor flexibility',
        'Map only summative assessments, leaving formative untagged',
      ],
      correctIdx: 0,
      rationale: 'Per-question objective tagging is the foundation of curricular assessment. It enables performance reporting at the objective level and identifies coverage gaps before publication.',
    },
    {
      stem: 'When designing assessment items for this objective, which Bloom level shift would most likely improve item discrimination among high-performing students?',
      options: [
        'Move from Remember to Apply or Analyze',
        'Move from Apply to Remember',
        'Eliminate the rationale field',
        'Reduce question stem length',
      ],
      correctIdx: 0,
      rationale: 'Higher-Bloom items (Apply/Analyze) require integration of knowledge, which discriminates more effectively among students who have built robust mental models versus those who memorized facts.',
    },
  ]

  const out: DraftQuestion[] = []
  const diffPool: Difficulty[] = difficultyMix === 'Mixed' ? ['Easy', 'Medium', 'Hard'] : [difficultyMix]
  const bloomPool: Bloom[] = bloomMix === 'Mixed' ? ['Apply', 'Analyze', 'Evaluate', 'Understand'] : [bloomMix]

  for (let i = 0; i < count; i++) {
    const obj = objectives[i % objectives.length]
    const seed = (i + 1) * 17
    const templates = STEMS_BY_OBJ[obj.code] ?? GENERIC_STEMS
    const tmpl = templates[i % templates.length]
    const diff = diffPool[seed % diffPool.length]
    const bloom = bloomPool[seed % bloomPool.length]
    out.push({
      id: `ai-draft-${i + 1}`,
      code: `AI-${obj.id.split('-').slice(-1)[0]}-${String(i + 1).padStart(3, '0')}`,
      objectiveTitle: obj.title,
      difficulty: diff,
      blooms: bloom,
      stem: tmpl.stem,
      options: tmpl.options,
      correctIdx: tmpl.correctIdx,
      rationale: tmpl.rationale,
      selected: i < 3, // pre-select first 3 as a "looks good" default
      status: 'idle',
    })
  }
  return out
}
