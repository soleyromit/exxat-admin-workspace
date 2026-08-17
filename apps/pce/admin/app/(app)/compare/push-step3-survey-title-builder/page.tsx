'use client'

// COMPARE ROUTE (throwaway — same lifecycle as the other /compare/push-step3-*
// siblings, delete once a direction is picked).
//
// 2026-08-11 — Romit asked for a few variants of the Survey title builder
// (step-communication.tsx, Step 3 "Survey details" card) to evaluate against
// each other. The shipped version (Variant A here) replaced an earlier
// "Insert field" dropdown + raw {{token}} text Input with a single inline
// row: removable field chips, a custom-text segment, and a trailing "+ Add
// field" chip, all in resolved order with "–" separators so the row reads
// exactly like the preview line below it. Romit's follow-up: "come up with a
// few variants to evaluate" — not settle on the first fix.
//
// Four more directions, each grounded in a real analogy (Mobbin, Aug 11):
//
//   A  INLINE ROW (shipped)     — chips + custom-text segment + "–"
//                                 separators, all inline, "+ Add field" at
//                                 the end. Analogy: none of the searched refs
//                                 do this exact composition — closest is
//                                 Loom's "{name}" inline variable in a title
//                                 bar, adapted to a chip instead of braces.
//   B  ALWAYS-VISIBLE TOGGLES  — every available field renders as a pill
//                                 up front (filled = active, outline =
//                                 inactive); click toggles it on/off, no
//                                 popover at all. Analogy: Preply's filter
//                                 chip bar / Deputy's toggle-pill filters —
//                                 "click a pill to activate/deactivate it."
//   C  FORMULA SLOTS            — explicit ordered Select dropdowns, one per
//                                 position ("Position 1", "Position 2",
//                                 "Position 3"), each either a field or
//                                 "— None —", plus a separate custom-suffix
//                                 input. Analogy: Zapier/Airtable field-
//                                 mapper — explicit slot-to-value mapping,
//                                 reordering by re-picking a slot's value.
//   D  REORDERABLE CHIPS        — same chip row as A, but each chip carries
//                                 move-left/move-right icon buttons instead
//                                 of relying on remove-then-re-add to
//                                 reorder. Deliberately NOT drag-and-drop —
//                                 a hand-rolled DnD implementation is a much
//                                 bigger surface to get right (keyboard
//                                 access, touch, axe) for a 2-3-item list
//                                 that arrow buttons solve just as well.
//   E  CLICK-TO-EDIT PREVIEW   — the resolved preview sentence itself IS
//                                 the editing surface; click a resolved
//                                 segment ("Human Anatomy & Kinesiology") to
//                                 swap or remove that field via a small
//                                 popover, click "+" at the end to append
//                                 one. No separate token/formula view at
//                                 all — what you see is what you get.
//                                 Analogy: Wix/Adobe Express "click text,
//                                 get a small edit panel" inline-editing
//                                 pattern.
//
// All five pull the SAME real fixture (DPT-501 Human Anatomy & Kinesiology,
// academic year 2026–2027, term "Fall 2026") and the same three merge
// fields the shipped version ships with. Each variant is fully
// self-contained — no shared state.

import { useState } from 'react'
import {
  Badge, badgeVariants, Button, Card, CardContent, Input,
  Popover, PopoverTrigger, PopoverContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'

const TITLE_MERGE_FIELDS: { token: string; label: string; sample: string }[] = [
  { token: '{{course_name}}', label: 'Course name', sample: 'Human Anatomy & Kinesiology' },
  { token: '{{academic_year}}', label: 'Academic year', sample: '2026–2027' },
  { token: '{{term_name}}', label: 'Term name', sample: 'Fall 2026' },
]
const DEFAULT_TEMPLATE = '{{course_name}} – {{academic_year}} – EOT Eval'

function resolvePreview(template: string): string {
  let text = template
  for (const f of TITLE_MERGE_FIELDS) text = text.split(f.token).join(f.sample)
  return text || 'Untitled survey'
}

// ── A · Inline row (shipped) ─────────────────────────────────────────────────
function VariantInlineRow() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [open, setOpen] = useState(false)
  const usedFields = TITLE_MERGE_FIELDS
    .filter(f => template.includes(f.token))
    .sort((a, b) => template.indexOf(a.token) - template.indexOf(b.token))
  const availableFields = TITLE_MERGE_FIELDS.filter(f => !template.includes(f.token))
  const customText = TITLE_MERGE_FIELDS
    .reduce((t, f) => t.replace(`${f.token} – `, '').replace(` – ${f.token}`, '').replace(f.token, ''), template)
    .trim()
  const compose = (tokens: string[], text: string) => [...tokens, ...(text ? [text] : [])].join(' – ')

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <div className="flex flex-wrap items-center gap-1.5">
        {usedFields.map((f, i) => (
          <span key={f.token} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">–</span>}
            <Badge variant="secondary" className="gap-1 pr-1">
              {f.label}
              <Button
                variant="ghost" size="icon-sm"
                aria-label={`Remove ${f.label}`}
                onClick={() => setTemplate(compose(usedFields.map(x => x.token).filter(t => t !== f.token), customText))}
                className="rounded-full text-muted-foreground hover:text-foreground shrink-0"
                style={{ width: 20, height: 20 }}
              >
                <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
              </Button>
            </Badge>
          </span>
        ))}
        {usedFields.length > 0 && <span className="text-muted-foreground">–</span>}
        <Input
          aria-label="Custom text"
          placeholder="Custom text (optional)"
          value={customText}
          onChange={e => setTemplate(compose(usedFields.map(f => f.token), e.target.value))}
          className="h-8 text-sm"
          style={{ width: 160 }}
        />
        {availableFields.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="xs" className="gap-1 rounded-full border-dashed font-normal text-muted-foreground hover:text-foreground">
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 10 }} />
                Add field
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <div className="flex flex-col">
                {availableFields.map(f => (
                  <Button key={f.token} variant="ghost" size="sm" className="justify-start font-normal"
                    onClick={() => { setTemplate(compose([...usedFields.map(x => x.token), f.token], customText)); setOpen(false) }}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(template)}</p>
    </div>
  )
}

// ── B · Always-visible toggle chips ──────────────────────────────────────────
function VariantToggleChips() {
  const [activeTokens, setActiveTokens] = useState<string[]>(['{{course_name}}', '{{academic_year}}'])
  const [customText, setCustomText] = useState('EOT Eval')
  const template = [...activeTokens, ...(customText ? [customText] : [])].join(' – ')
  function toggle(token: string) {
    setActiveTokens(p => p.includes(token) ? p.filter(t => t !== token) : [...p, token])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Fields">
        {TITLE_MERGE_FIELDS.map(f => {
          const active = activeTokens.includes(f.token)
          return (
            <Button
              key={f.token}
              type="button"
              variant="ghost"
              size="xs"
              aria-pressed={active}
              onClick={() => toggle(f.token)}
              className={cn(
                badgeVariants({ variant: active ? 'secondary' : 'outline' }),
                'h-auto font-normal cursor-pointer',
                active ? 'gap-1' : 'gap-1 text-muted-foreground',
              )}
            >
              {active && <i className="fa-light fa-check text-xs" aria-hidden="true" />}
              {f.label}
            </Button>
          )
        })}
      </div>
      <Input
        aria-label="Custom text"
        placeholder="Custom text (optional)"
        value={customText}
        onChange={e => setCustomText(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(template)}</p>
    </div>
  )
}

// ── C · Formula slots ─────────────────────────────────────────────────────────
function VariantFormulaSlots() {
  const [slots, setSlots] = useState<(string | null)[]>(['{{course_name}}', '{{academic_year}}', null])
  const [customText, setCustomText] = useState('EOT Eval')
  const template = [...slots.filter((s): s is string => !!s), ...(customText ? [customText] : [])].join(' – ')

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      {slots.map((slot, i) => {
        const usedElsewhere = slots.filter((s, j) => j !== i && s !== null)
        const options = TITLE_MERGE_FIELDS.filter(f => !usedElsewhere.includes(f.token))
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0" style={{ width: 64 }}>Position {i + 1}</span>
            <Select
              value={slot ?? '__none__'}
              onValueChange={v => setSlots(p => p.map((s, j) => j === i ? (v === '__none__' ? null : v) : s))}
            >
              <SelectTrigger className="w-full" aria-label={`Position ${i + 1} field`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {options.map(f => <SelectItem key={f.token} value={f.token}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )
      })}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0" style={{ width: 64 }}>Suffix</span>
        <Input
          aria-label="Custom suffix text"
          placeholder="Custom text (optional)"
          value={customText}
          onChange={e => setCustomText(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(template)}</p>
    </div>
  )
}

// ── D · Reorderable chips ─────────────────────────────────────────────────────
function VariantReorderableChips() {
  const [tokens, setTokens] = useState<string[]>(['{{course_name}}', '{{academic_year}}'])
  const [customText, setCustomText] = useState('EOT Eval')
  const [open, setOpen] = useState(false)
  const availableFields = TITLE_MERGE_FIELDS.filter(f => !tokens.includes(f.token))
  const template = [...tokens, ...(customText ? [customText] : [])].join(' – ')
  function move(index: number, dir: -1 | 1) {
    setTokens(p => {
      const next = [...p]
      const target = index + dir
      if (target < 0 || target >= next.length) return next
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tokens.map((token, i) => {
          const f = TITLE_MERGE_FIELDS.find(x => x.token === token)!
          return (
            <span key={token} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground">–</span>}
              <Badge variant="secondary" className="gap-0.5 pr-1">
                <Button
                  variant="ghost" size="icon-sm" aria-label={`Move ${f.label} earlier`}
                  disabled={i === 0} onClick={() => move(i, -1)}
                  className="rounded-full text-muted-foreground hover:text-foreground shrink-0" style={{ width: 18, height: 18 }}
                >
                  <i className="fa-light fa-chevron-left" aria-hidden="true" style={{ fontSize: 9 }} />
                </Button>
                {f.label}
                <Button
                  variant="ghost" size="icon-sm" aria-label={`Move ${f.label} later`}
                  disabled={i === tokens.length - 1} onClick={() => move(i, 1)}
                  className="rounded-full text-muted-foreground hover:text-foreground shrink-0" style={{ width: 18, height: 18 }}
                >
                  <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 9 }} />
                </Button>
                <Button
                  variant="ghost" size="icon-sm" aria-label={`Remove ${f.label}`}
                  onClick={() => setTokens(p => p.filter(t => t !== token))}
                  className="rounded-full text-muted-foreground hover:text-foreground shrink-0" style={{ width: 18, height: 18 }}
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
                </Button>
              </Badge>
            </span>
          )
        })}
        {tokens.length > 0 && <span className="text-muted-foreground">–</span>}
        <Input
          aria-label="Custom text" placeholder="Custom text (optional)"
          value={customText} onChange={e => setCustomText(e.target.value)}
          className="h-8 text-sm" style={{ width: 160 }}
        />
        {availableFields.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="xs" className="gap-1 rounded-full border-dashed font-normal text-muted-foreground hover:text-foreground">
                <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 10 }} />
                Add field
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <div className="flex flex-col">
                {availableFields.map(f => (
                  <Button key={f.token} variant="ghost" size="sm" className="justify-start font-normal"
                    onClick={() => { setTokens(p => [...p, f.token]); setOpen(false) }}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(template)}</p>
    </div>
  )
}

// ── E · Click-to-edit preview ─────────────────────────────────────────────────
type Segment = { kind: 'field'; token: string } | { kind: 'text'; value: string }

function VariantClickToEditPreview() {
  const [segments, setSegments] = useState<Segment[]>([
    { kind: 'field', token: '{{course_name}}' },
    { kind: 'field', token: '{{academic_year}}' },
    { kind: 'text', value: 'EOT Eval' },
  ])
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const template = segments
    .map(s => s.kind === 'field' ? s.token : s.value)
    .filter(Boolean)
    .join(' – ')
  const usedTokens = segments.filter((s): s is Extract<Segment, { kind: 'field' }> => s.kind === 'field').map(s => s.token)
  const availableFields = TITLE_MERGE_FIELDS.filter(f => !usedTokens.includes(f.token))

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <Card className="shadow-none">
        <CardContent style={{ padding: 12 }}>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {segments.map((seg, i) => {
              const label = seg.kind === 'field'
                ? TITLE_MERGE_FIELDS.find(f => f.token === seg.token)!.sample
                : (seg.value || 'custom text')
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground">–</span>}
                  <Popover open={editIndex === i} onOpenChange={o => setEditIndex(o ? i : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-auto rounded px-1 -mx-1 font-normal underline decoration-dotted underline-offset-4 hover:bg-interactive-hover"
                        style={{ color: seg.kind === 'field' ? 'var(--brand-color)' : undefined }}
                      >
                        {label}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 flex flex-col gap-2" align="start">
                      {seg.kind === 'text' ? (
                        <Input
                          autoFocus
                          aria-label="Custom text"
                          value={seg.value}
                          onChange={e => setSegments(p => p.map((s, j) => j === i ? { kind: 'text', value: e.target.value } : s))}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">{TITLE_MERGE_FIELDS.find(f => f.token === seg.token)!.label}</p>
                      )}
                      <Button
                        variant="ghost" size="sm" className="justify-start font-normal text-destructive"
                        onClick={() => { setSegments(p => p.filter((_, j) => j !== i)); setEditIndex(null) }}
                      >
                        Remove
                      </Button>
                    </PopoverContent>
                  </Popover>
                </span>
              )
            })}
            {segments.length > 0 && <span className="text-muted-foreground">–</span>}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Add to title" className="rounded-full text-muted-foreground hover:text-foreground" style={{ width: 22, height: 22 }}>
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                <div className="flex flex-col">
                  {availableFields.map(f => (
                    <Button key={f.token} variant="ghost" size="sm" className="justify-start font-normal"
                      onClick={() => setSegments(p => [...p, { kind: 'field', token: f.token }])}>
                      {f.label}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" className="justify-start font-normal"
                    onClick={() => setSegments(p => [...p, { kind: 'text', value: '' }])}>
                    Custom text
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Click any part to edit or remove it. No separate formula view — this line is the title.</p>
    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────
function VariantSection({
  letter, title, analogy, tradeoff, children,
}: {
  letter: string
  title: string
  analogy: string
  tradeoff: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold font-heading">{letter} · {title}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">{analogy}</p>
      </div>
      <Card className="shadow-none">
        <CardContent style={{ padding: 16 }}>
          {children}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground max-w-2xl border-t border-dashed border-border pt-2.5">
        <span className="font-medium text-foreground">Trade-off: </span>{tradeoff}
      </p>
    </section>
  )
}

export default function PushStep3SurveyTitleBuilderComparePage() {
  return (
    <div className="flex flex-col gap-10 p-6 max-w-[820px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 3 — Survey title builder, five variants</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Riffs on the shipped Survey title field (<code className="text-xs">step-communication.tsx</code>, Survey
          details card). Same three merge fields, same real fixture (DPT-501 Human Anatomy &amp; Kinesiology,
          2026–2027). Each section below is fully interactive.
        </p>
      </div>

      <VariantSection
        letter="A"
        title="Inline row (shipped)"
        analogy="Field chips, a custom-text segment, and '+ Add field' all sit on one line in resolved order, with '–' separators — the row reads exactly like the preview beneath it. No searched reference does this exact composition; closest is Loom's inline '{name}' variable in a title bar, adapted to a chip."
        tradeoff="Best match between the editor and the preview — no mental translation needed. Costs a fixed-width custom-text input that can feel cramped for a long suffix, and reordering fields still means remove-then-re-add (no direct drag/arrows)."
      >
        <VariantInlineRow />
      </VariantSection>

      <VariantSection
        letter="B"
        title="Always-visible toggle chips"
        analogy="Every available field renders as a pill up front — filled means active, outline means inactive — click toggles it, no popover to open. Analogy: Preply's filter chip bar and Deputy's toggle-pill filters, 'click a pill to activate/deactivate it.'"
        tradeoff="Fastest to scan and toggle — every option is always visible, zero clicks to discover what exists. Costs order control entirely: toggling determines WHETHER a field is used, not WHERE — this variant can't reorder fields relative to each other at all, only Position via re-typing the custom text isn't possible either since fields always resolve in a fixed declared order."
      >
        <VariantToggleChips />
      </VariantSection>

      <VariantSection
        letter="C"
        title="Formula slots"
        analogy="Explicit ordered Select dropdowns — Position 1, Position 2, Position 3 — each either a field or '— None —', plus a separate custom-suffix input. Analogy: Zapier/Airtable's field-mapper, explicit slot-to-value mapping."
        tradeoff="Most explicit about ORDER — reordering is just re-picking which field goes in which position, no remove/re-add dance. Costs the most visual weight (3 full-width rows before you even reach the suffix) for what's usually a 2-field formula, and 'Position 1/2/3' is DB-schema language, not how an admin thinks about a title."
      >
        <VariantFormulaSlots />
      </VariantSection>

      <VariantSection
        letter="D"
        title="Reorderable chips"
        analogy="Same chip row as A, but each chip carries move-left/move-right icon buttons instead of relying on remove-then-re-add. Deliberately not drag-and-drop — a hand-rolled DnD implementation is a much bigger surface (keyboard access, touch, axe) to get right for a 2-3-item list arrow buttons solve just as well."
        tradeoff="Fixes A's one real gap (reordering) with the least new interaction vocabulary — same chip shape, two more tiny icon buttons. Costs visual density: each chip is now three icon-buttons-plus-a-label wide, which starts to feel busy past 3 fields (this fixture's ceiling, so not tested at scale here)."
      >
        <VariantReorderableChips />
      </VariantSection>

      <VariantSection
        letter="E"
        title="Click-to-edit preview"
        analogy="The resolved preview sentence IS the editing surface — click 'Human Anatomy & Kinesiology' to swap or remove that field via a small popover, click '+' to append. No separate token/formula view at all. Analogy: Wix / Adobe Express 'click text, get a small edit panel' inline-editing pattern."
        tradeoff="Zero translation between what you edit and what students see — what you click IS the title, full stop. Costs discoverability: dotted-underline-as-affordance is a subtler signal than a bordered chip, and first-time admins may not realize resolved text is clickable without a hint the first time it ships."
      >
        <VariantClickToEditPreview />
      </VariantSection>
    </div>
  )
}
