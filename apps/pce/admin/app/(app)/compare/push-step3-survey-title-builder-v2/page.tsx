'use client'

// COMPARE ROUTE (throwaway — same lifecycle as the other /compare/push-step3-*
// siblings, delete once a direction is picked).
//
// 2026-08-11 — Round 2 of the Survey title builder exploration. Variants A–E
// live at /compare/push-step3-survey-title-builder (inline chip row, toggle
// pills, formula slots, reorderable chips, click-to-edit preview). Romit's
// feedback after that round: he remembers "a text box, with chip, when
// selected, get added in the textbox" — i.e. the token should land INSIDE the
// text field, inline with the typed text, not sit in a separate chip row that
// merely mirrors the field. That is the HubSpot personalization-token model.
//
// The DS has no rich-text / contentEditable primitive, and hand-rolling one is
// off the table (design-anti-patterns.md; contentEditable = cursor/IME/paste/
// SR risk). All four variants below fake the inline feeling with a SEGMENTED
// FIELD instead: one Input-styled container holding an alternating sequence of
// token pills (Badge) and borderless text inputs. Typing happens in the text
// segments; pills sit between them; serialization is just segment
// concatenation, so the " – " separators are literal typed text — exactly
// Monil's formula model ("course name – academic year – something"), with no
// auto-separator magic.
//
// Four directions, each grounded in a real analogy (Mobbin, Aug 11):
//
//   F  TOKEN FIELD, CURSOR-AWARE — the full HubSpot approximation. A { }
//                                  trigger sits INSIDE the field's right edge
//                                  (Rox subject line); picking a field splits
//                                  the focused text segment at the caret and
//                                  drops the pill exactly there. Backspace at
//                                  a segment start deletes the pill before it,
//                                  like deleting a character. Analogies:
//                                  HubSpot "Happy 25th Birthday, [First Name]!"
//                                  inline pill (mobbin.com/screens/f6657e01-
//                                  c8ca-429b-964c-dcc69a1f1590) + Rox's in-
//                                  field { } token trigger (mobbin.com/screens/
//                                  7a6d159c-eff6-4a13-91bb-c03e7424d777).
//   G  FIELD PALETTE             — same segmented field, but insertion is
//                                  append-only ("cursor logically at the end")
//                                  and the pickers are always-visible
//                                  "+ Course name" action chips BELOW the
//                                  field. Click a chip → it lands in the box.
//                                  This is the engineering-cheap tier of F.
//                                  Analogy: Juicebox's variable chip palette
//                                  above the email body (mobbin.com/screens/
//                                  cf273706-766d-4114-9de1-767d448a9a74).
//   H  SLASH INSERT              — no visible trigger at all. Type "/" inside
//                                  the field and an inline menu opens,
//                                  filtered as you type; Enter drops the top
//                                  match as a pill at that spot. Analogy:
//                                  Notion / Fibery / Dovetail slash commands
//                                  (mobbin.com/screens/8cbe99a8-57a4-40e6-
//                                  85c8-5f55712b6cf3).
//   I  PRESET FORMULAS           — most admins will keep the default, so lead
//                                  with a Select of 3 ready-made formulas
//                                  shown RESOLVED ("Human Anatomy &
//                                  Kinesiology – 2026–2027 – EOT Eval");
//                                  "Custom formula" reveals the token field
//                                  seeded from the preset you were on.
//                                  Analogy: Salesforce's pick-a-merge-field-
//                                  from-a-list flow (mobbin.com/screens/
//                                  000ba1f7-9a85-4cc3-9bf5-9283e564d5cb) +
//                                  date-format preset pickers. Mailchimp's raw
//                                  *|FNAME|* helper text (mobbin.com/screens/
//                                  6519f156-1dd7-4929-91bc-920321203f5f) is
//                                  the anti-reference — that is the round-1
//                                  rejected pattern.
//
// All four pull the SAME real fixture (DPT-501 Human Anatomy & Kinesiology,
// academic year 2026–2027, term "Fall 2026") and the same three merge fields
// the shipped version ships with. Each variant is fully self-contained — no
// shared state. Shared pure helpers only (parse/serialize/resolve).

import { useEffect, useRef, useState } from 'react'
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
  return text.trim() || 'Untitled survey'
}

// ── Segmented-field model (pure helpers, shared by all variants) ─────────────
// A template is an alternating sequence of token pills and text runs. Two
// invariants keep the caret math trivial: (1) never two text segments adjacent
// (they merge), (2) the sequence always ends with a text segment (so there is
// always somewhere to type).
type Seg = { kind: 'token'; token: string } | { kind: 'text'; value: string }

function parseTemplate(template: string): Seg[] {
  const raw: Seg[] = []
  let rest = template
  while (rest.length > 0) {
    let nearest: { idx: number; token: string } | null = null
    for (const f of TITLE_MERGE_FIELDS) {
      const idx = rest.indexOf(f.token)
      if (idx >= 0 && (nearest === null || idx < nearest.idx)) nearest = { idx, token: f.token }
    }
    if (!nearest) {
      raw.push({ kind: 'text', value: rest })
      break
    }
    if (nearest.idx > 0) raw.push({ kind: 'text', value: rest.slice(0, nearest.idx) })
    raw.push({ kind: 'token', token: nearest.token })
    rest = rest.slice(nearest.idx + nearest.token.length)
  }
  const segs: Seg[] = []
  for (const s of raw) {
    if (s.kind === 'token' && segs[segs.length - 1]?.kind === 'token') segs.push({ kind: 'text', value: '' })
    segs.push(s)
  }
  if (segs.length === 0 || segs[segs.length - 1].kind === 'token') segs.push({ kind: 'text', value: '' })
  return segs
}

function serializeSegs(segs: Seg[]): string {
  return segs.map(s => (s.kind === 'token' ? s.token : s.value)).join('')
}

function fieldLabel(token: string): string {
  return TITLE_MERGE_FIELDS.find(f => f.token === token)?.label ?? token
}

function formulaLabel(template: string): string {
  let s = template
  for (const f of TITLE_MERGE_FIELDS) s = s.split(f.token).join(f.label)
  return s
}

function usedTokensOf(segs: Seg[]): string[] {
  return segs.filter((s): s is Extract<Seg, { kind: 'token' }> => s.kind === 'token').map(s => s.token)
}

const FIELD_SHELL_CLASS =
  'flex flex-wrap items-center gap-y-1 rounded-md border bg-background px-2.5 py-1 cursor-text ' +
  'focus-within:ring-2 focus-within:ring-[var(--ring)]'

// ── F · Token field, cursor-aware insert ─────────────────────────────────────
function VariantTokenFieldCursor() {
  const [segs, setSegs] = useState<Seg[]>(() => parseTemplate(DEFAULT_TEMPLATE))
  const [open, setOpen] = useState(false)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const caretRef = useRef<{ seg: number; pos: number } | null>(null)
  const pendingFocus = useRef<{ seg: number; pos: number } | null>(null)

  useEffect(() => {
    const pf = pendingFocus.current
    if (!pf) return
    pendingFocus.current = null
    const el = inputRefs.current[pf.seg]
    if (el) {
      el.focus()
      el.setSelectionRange(pf.pos, pf.pos)
    }
  })

  const availableFields = TITLE_MERGE_FIELDS.filter(f => !usedTokensOf(segs).includes(f.token))
  const lastTextIndex = segs.reduce((acc, s, i) => (s.kind === 'text' ? i : acc), segs.length - 1)

  const trackCaret = (i: number) => (e: React.SyntheticEvent<HTMLInputElement>) => {
    caretRef.current = { seg: i, pos: e.currentTarget.selectionStart ?? e.currentTarget.value.length }
  }

  function setText(i: number, value: string) {
    setSegs(p => p.map((s, j) => (j === i ? { kind: 'text', value } : s)))
  }

  function insertToken(token: string) {
    setSegs(p => {
      const fallbackSeg = p.reduce((acc, s, i) => (s.kind === 'text' ? i : acc), p.length - 1)
      const target =
        caretRef.current && p[caretRef.current.seg]?.kind === 'text'
          ? caretRef.current
          : { seg: fallbackSeg, pos: (p[fallbackSeg] as { kind: 'text'; value: string }).value.length }
      const cur = p[target.seg] as { kind: 'text'; value: string }
      // Segments join with no separator (see the plain .join('') below) — so
      // the split itself must guarantee a visible gap on both sides of the
      // inserted pill, regardless of exactly where the caret landed relative
      // to existing whitespace. Caught live: splitting "EOT Eval" right
      // after the space put "EOT " before and "Eval" after with nothing
      // re-added, rendering as "...EOTFall 2026Eval" with no gap.
      let before = cur.value.slice(0, target.pos)
      let after = cur.value.slice(target.pos)
      if (before && !before.endsWith(' ')) before += ' '
      if (after && !after.startsWith(' ')) after = ' ' + after
      pendingFocus.current = { seg: target.seg + 2, pos: 0 }
      return [
        ...p.slice(0, target.seg),
        { kind: 'text', value: before },
        { kind: 'token', token },
        { kind: 'text', value: after },
        ...p.slice(target.seg + 1),
      ]
    })
    setOpen(false)
  }

  function removeToken(i: number) {
    setSegs(p => {
      if (p[i]?.kind !== 'token') return p
      if (i > 0 && p[i - 1].kind === 'text' && p[i + 1]?.kind === 'text') {
        const before = p[i - 1] as { kind: 'text'; value: string }
        const after = p[i + 1] as { kind: 'text'; value: string }
        pendingFocus.current = { seg: i - 1, pos: before.value.length }
        return [...p.slice(0, i - 1), { kind: 'text', value: before.value + after.value }, ...p.slice(i + 2)]
      }
      pendingFocus.current = { seg: 0, pos: 0 }
      return [...p.slice(0, i), ...p.slice(i + 1)]
    })
  }

  const onTextKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0 && segs[i - 1]?.kind === 'token') {
      e.preventDefault()
      removeToken(i - 1)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <div
        className={FIELD_SHELL_CLASS}
        style={{ borderColor: 'var(--border-control-35)', minHeight: 'var(--control-height)' }}
        onMouseDown={e => {
          if (e.target === e.currentTarget) {
            e.preventDefault()
            inputRefs.current[lastTextIndex]?.focus()
          }
        }}
      >
        {segs.map((seg, i) =>
          seg.kind === 'token' ? (
            <Badge key={`t-${i}`} variant="secondary" className="mx-0.5 shrink-0 gap-1 pr-1">
              {fieldLabel(seg.token)}
              <Button
                variant="ghost" size="icon-sm"
                aria-label={`Remove ${fieldLabel(seg.token)}`}
                onClick={() => removeToken(i)}
                className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                style={{ width: 18, height: 18 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
              </Button>
            </Badge>
          ) : (
            <Input
              key={`x-${i}`}
              ref={el => { inputRefs.current[i] = el }}
              aria-label={`Title text, part ${i + 1}`}
              value={seg.value}
              onChange={e => setText(i, e.target.value)}
              onKeyDown={onTextKeyDown(i)}
              onSelect={trackCaret(i)}
              onFocus={trackCaret(i)}
              className="h-7 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              style={{ width: `${Math.max(seg.value.length + 1, 2)}ch` }}
            />
          ),
        )}
        {availableFields.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost" size="icon-sm"
                aria-label="Insert merge field"
                className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                style={{ width: 24, height: 24 }}
              >
                <i className="fa-light fa-brackets-curly" aria-hidden="true" style={{ fontSize: 11 }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-1" align="end" onCloseAutoFocus={e => e.preventDefault()}>
              <div className="flex flex-col">
                {availableFields.map(f => (
                  <Button
                    key={f.token} variant="ghost" size="sm"
                    className="h-auto justify-start py-1.5 font-normal"
                    onClick={() => insertToken(f.token)}
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="text-sm">{f.label}</span>
                      <span className="text-xs text-muted-foreground">{f.sample}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(serializeSegs(segs))}</p>
    </div>
  )
}

// ── G · Field palette, append-only ───────────────────────────────────────────
function VariantFieldPalette() {
  const [segs, setSegs] = useState<Seg[]>(() => parseTemplate(DEFAULT_TEMPLATE))
  const usedTokens = usedTokensOf(segs)

  function setText(i: number, value: string) {
    setSegs(p => p.map((s, j) => (j === i ? { kind: 'text', value } : s)))
  }

  function appendToken(token: string) {
    setSegs(p => {
      const last = p[p.length - 1] as { kind: 'text'; value: string }
      const needsSeparator = serializeSegs(p).trim().length > 0 && !/[\s–-]$/.test(last.value)
      return [
        ...p.slice(0, p.length - 1),
        { kind: 'text', value: needsSeparator ? `${last.value} – ` : last.value },
        { kind: 'token', token },
        { kind: 'text', value: '' },
      ]
    })
  }

  function removeToken(i: number) {
    setSegs(p => {
      if (p[i]?.kind !== 'token') return p
      if (i > 0 && p[i - 1].kind === 'text' && p[i + 1]?.kind === 'text') {
        const before = p[i - 1] as { kind: 'text'; value: string }
        const after = p[i + 1] as { kind: 'text'; value: string }
        return [...p.slice(0, i - 1), { kind: 'text', value: before.value + after.value }, ...p.slice(i + 2)]
      }
      return [...p.slice(0, i), ...p.slice(i + 1)]
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <div
        className={FIELD_SHELL_CLASS}
        style={{ borderColor: 'var(--border-control-35)', minHeight: 'var(--control-height)' }}
      >
        {segs.map((seg, i) =>
          seg.kind === 'token' ? (
            <Badge key={`t-${i}`} variant="secondary" className="mx-0.5 shrink-0 gap-1 pr-1">
              {fieldLabel(seg.token)}
              <Button
                variant="ghost" size="icon-sm"
                aria-label={`Remove ${fieldLabel(seg.token)}`}
                onClick={() => removeToken(i)}
                className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                style={{ width: 18, height: 18 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
              </Button>
            </Badge>
          ) : (
            <Input
              key={`x-${i}`}
              aria-label={`Title text, part ${i + 1}`}
              value={seg.value}
              onChange={e => setText(i, e.target.value)}
              className="h-7 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              style={{ width: `${Math.max(seg.value.length + 1, 2)}ch` }}
            />
          ),
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Insert a merge field">
        {TITLE_MERGE_FIELDS.map(f => {
          const used = usedTokens.includes(f.token)
          return (
            <Button
              key={f.token}
              type="button"
              variant="ghost"
              size="xs"
              disabled={used}
              onClick={() => appendToken(f.token)}
              className={cn(
                badgeVariants({ variant: 'outline' }),
                'h-auto font-normal',
                used ? 'gap-1 text-muted-foreground' : 'cursor-pointer gap-1 text-muted-foreground hover:text-foreground',
              )}
            >
              <i className={used ? 'fa-light fa-check' : 'fa-light fa-plus'} aria-hidden="true" style={{ fontSize: 10 }} />
              {f.label}
            </Button>
          )
        })}
        <span className="text-xs text-muted-foreground">Click a field to drop it into the title.</span>
      </div>
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(serializeSegs(segs))}</p>
    </div>
  )
}

// ── H · Slash insert ─────────────────────────────────────────────────────────
function VariantSlashInsert() {
  const [segs, setSegs] = useState<Seg[]>(() => parseTemplate(DEFAULT_TEMPLATE))
  const [menu, setMenu] = useState<{ seg: number; slash: number } | null>(null)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const pendingFocus = useRef<{ seg: number; pos: number } | null>(null)

  useEffect(() => {
    const pf = pendingFocus.current
    if (!pf) return
    pendingFocus.current = null
    const el = inputRefs.current[pf.seg]
    if (el) {
      el.focus()
      el.setSelectionRange(pf.pos, pf.pos)
    }
  })

  const menuSeg = menu ? segs[menu.seg] : null
  const query = menu && menuSeg?.kind === 'text' ? menuSeg.value.slice(menu.slash + 1).toLowerCase() : ''
  const usedTokens = usedTokensOf(segs)
  const matches = menu
    ? TITLE_MERGE_FIELDS.filter(f => !usedTokens.includes(f.token) && f.label.toLowerCase().includes(query))
    : []

  function onTextChange(i: number, value: string) {
    setSegs(p => p.map((s, j) => (j === i ? { kind: 'text', value } : s)))
    const slash = value.lastIndexOf('/')
    setMenu(slash >= 0 ? { seg: i, slash } : null)
  }

  function pick(f: (typeof TITLE_MERGE_FIELDS)[number]) {
    if (!menu) return
    setSegs(p => {
      const cur = p[menu.seg]
      if (cur?.kind !== 'text') return p
      // Same gap as the caret-insert variant: nothing downstream adds a
      // separator, so guarantee one before the pill (typing "EOT/term" with
      // no space would otherwise glue "EOT" straight to the pill), and seed
      // a leading space after so continued typing doesn't jam into it either.
      let before = cur.value.slice(0, menu.slash)
      if (before && !before.endsWith(' ')) before += ' '
      pendingFocus.current = { seg: menu.seg + 2, pos: 1 }
      return [
        ...p.slice(0, menu.seg),
        { kind: 'text', value: before },
        { kind: 'token', token: f.token },
        { kind: 'text', value: ' ' },
        ...p.slice(menu.seg + 1),
      ]
    })
    setMenu(null)
  }

  function removeToken(i: number) {
    setSegs(p => {
      if (p[i]?.kind !== 'token') return p
      if (i > 0 && p[i - 1].kind === 'text' && p[i + 1]?.kind === 'text') {
        const before = p[i - 1] as { kind: 'text'; value: string }
        const after = p[i + 1] as { kind: 'text'; value: string }
        return [...p.slice(0, i - 1), { kind: 'text', value: before.value + after.value }, ...p.slice(i + 2)]
      }
      return [...p.slice(0, i), ...p.slice(i + 1)]
    })
  }

  const onTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!menu) return
    if (e.key === 'Enter' && matches.length > 0) {
      e.preventDefault()
      pick(matches[0])
    } else if (e.key === 'Escape') {
      setMenu(null)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <div className="relative">
        <div
          className={FIELD_SHELL_CLASS}
          style={{ borderColor: 'var(--border-control-35)', minHeight: 'var(--control-height)' }}
        >
          {segs.map((seg, i) =>
            seg.kind === 'token' ? (
              <Badge key={`t-${i}`} variant="secondary" className="mx-0.5 shrink-0 gap-1 pr-1">
                {fieldLabel(seg.token)}
                <Button
                  variant="ghost" size="icon-sm"
                  aria-label={`Remove ${fieldLabel(seg.token)}`}
                  onClick={() => removeToken(i)}
                  className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                  style={{ width: 18, height: 18 }}
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
                </Button>
              </Badge>
            ) : (
              <Input
                key={`x-${i}`}
                ref={el => { inputRefs.current[i] = el }}
                aria-label={`Title text, part ${i + 1}`}
                value={seg.value}
                onChange={e => onTextChange(i, e.target.value)}
                onKeyDown={onTextKeyDown}
                className="h-7 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                style={{ width: `${Math.max(seg.value.length + 1, 2)}ch` }}
              />
            ),
          )}
        </div>
        {menu && (
          <div className="absolute left-0 top-full z-10 mt-1 flex w-60 flex-col rounded-md border border-border bg-card p-1 shadow-md">
            <p className="px-2 py-1 text-xs text-muted-foreground">Insert field</p>
            {matches.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">No matching field</p>
            )}
            {matches.map((f, idx) => (
              <Button
                key={f.token} variant="ghost" size="sm"
                className="justify-between font-normal"
                onMouseDown={e => e.preventDefault()}
                onClick={() => pick(f)}
              >
                <span>{f.label}</span>
                {idx === 0 && <span className="text-xs text-muted-foreground">Enter</span>}
              </Button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Type <span className="font-medium text-foreground">/</span> anywhere in the title to insert a field — Enter picks the top match.
      </p>
      <p className="text-xs text-muted-foreground">preview: {resolvePreview(serializeSegs(segs))}</p>
    </div>
  )
}

// ── I · Preset formulas + custom escape ──────────────────────────────────────
const CUSTOM_CHOICE = '__custom__'
const PRESET_TEMPLATES = [
  DEFAULT_TEMPLATE,
  '{{course_name}} – {{term_name}} – Course Evaluation',
  '{{course_name}} Faculty Evaluation ({{academic_year}})',
]

function VariantPresetFormulas() {
  const [choice, setChoice] = useState<string>(DEFAULT_TEMPLATE)
  const [customSegs, setCustomSegs] = useState<Seg[]>(() => parseTemplate(DEFAULT_TEMPLATE))
  const [open, setOpen] = useState(false)
  const isCustom = choice === CUSTOM_CHOICE
  const template = isCustom ? serializeSegs(customSegs) : choice
  const availableFields = TITLE_MERGE_FIELDS.filter(f => !usedTokensOf(customSegs).includes(f.token))

  function setText(i: number, value: string) {
    setCustomSegs(p => p.map((s, j) => (j === i ? { kind: 'text', value } : s)))
  }

  function appendToken(token: string) {
    setCustomSegs(p => [...p, { kind: 'token', token }, { kind: 'text', value: '' }])
    setOpen(false)
  }

  function removeToken(i: number) {
    setCustomSegs(p => {
      if (p[i]?.kind !== 'token') return p
      if (i > 0 && p[i - 1].kind === 'text' && p[i + 1]?.kind === 'text') {
        const before = p[i - 1] as { kind: 'text'; value: string }
        const after = p[i + 1] as { kind: 'text'; value: string }
        return [...p.slice(0, i - 1), { kind: 'text', value: before.value + after.value }, ...p.slice(i + 2)]
      }
      return [...p.slice(0, i), ...p.slice(i + 1)]
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium">Survey title <span style={{ color: 'var(--destructive)' }}>*</span></p>
      <Select
        value={choice}
        onValueChange={v => {
          if (v === CUSTOM_CHOICE) setCustomSegs(parseTemplate(isCustom ? serializeSegs(customSegs) : choice))
          setChoice(v)
        }}
      >
        <SelectTrigger className="w-full" aria-label="Survey title format"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PRESET_TEMPLATES.map(p => (
            <SelectItem key={p} value={p}>{resolvePreview(p)}</SelectItem>
          ))}
          <SelectItem value={CUSTOM_CHOICE}>Custom formula…</SelectItem>
        </SelectContent>
      </Select>
      {!isCustom && (
        <p className="text-xs text-muted-foreground">formula: {formulaLabel(choice)}</p>
      )}
      {isCustom && (
        <>
          <div
            className={FIELD_SHELL_CLASS}
            style={{ borderColor: 'var(--border-control-35)', minHeight: 'var(--control-height)' }}
          >
            {customSegs.map((seg, i) =>
              seg.kind === 'token' ? (
                <Badge key={`t-${i}`} variant="secondary" className="mx-0.5 shrink-0 gap-1 pr-1">
                  {fieldLabel(seg.token)}
                  <Button
                    variant="ghost" size="icon-sm"
                    aria-label={`Remove ${fieldLabel(seg.token)}`}
                    onClick={() => removeToken(i)}
                    className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                    style={{ width: 18, height: 18 }}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
                  </Button>
                </Badge>
              ) : (
                <Input
                  key={`x-${i}`}
                  aria-label={`Title text, part ${i + 1}`}
                  value={seg.value}
                  onChange={e => setText(i, e.target.value)}
                  className="h-7 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  style={{ width: `${Math.max(seg.value.length + 1, 2)}ch` }}
                />
              ),
            )}
            {availableFields.length > 0 && (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="xs" className="ml-auto shrink-0 gap-1 rounded-full border-dashed font-normal text-muted-foreground hover:text-foreground">
                    <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 10 }} />
                    Field
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="flex flex-col">
                    {availableFields.map(f => (
                      <Button key={f.token} variant="ghost" size="sm" className="justify-start font-normal"
                        onClick={() => appendToken(f.token)}>
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <p className="text-xs text-muted-foreground">preview: {resolvePreview(template)}</p>
        </>
      )}
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

export default function PushStep3SurveyTitleBuilderV2ComparePage() {
  return (
    <div className="flex flex-col gap-10 p-6 max-w-[820px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 3 — Survey title builder v2, inline-token variants</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Round 2 — the token lands INSIDE the text field, inline with typed text (HubSpot personalization-token
          model), instead of a chip row beside the field. Variants A–E live at{' '}
          <code className="text-xs">/compare/push-step3-survey-title-builder</code>. Same three merge fields, same
          real fixture (DPT-501 Human Anatomy &amp; Kinesiology, 2026–2027). Each section below is fully interactive.
        </p>
      </div>

      <VariantSection
        letter="F"
        title="Token field, cursor-aware insert"
        analogy="One Input-styled field holds pills and typed text in a single flow. The { } trigger sits inside the field's right edge (Rox subject line); picking a field splits the focused text run at the caret and drops the pill exactly there. Backspace at a run's start deletes the pill before it, like deleting a character. Analogy: HubSpot's 'Happy 25th Birthday, [First Name]!' inline personalization pill."
        tradeoff="The closest safe approximation of true inline tokens — insert-at-caret, backspace-to-delete, no contentEditable. Costs the most engineering of the four: caret tracking across text runs, segment splitting/merging, and focus restoration all have to be right, and a screen reader experiences one visual field as several inputs (mitigated with per-run labels, but still not one seamless textbox)."
      >
        <VariantTokenFieldCursor />
      </VariantSection>

      <VariantSection
        letter="G"
        title="Field palette, append-only"
        analogy="Same inline field, but the pickers are always-visible '+ Course name' action chips below the box — click one and it lands in the title, with a ' – ' separator typed in automatically when needed. Insertion is append-only: the cursor is logically always at the end. Analogy: Juicebox's variable chip palette above the email body — click a chip, it drops into the text."
        tradeoff="The engineering-cheap tier of F — same 'chip lands in the textbox' feeling with zero caret math, and zero-click discovery since every field is visible up front. Costs mid-string insertion: a pill can only ever land at the end, so building 'Fall 2026 Human Anatomy…' (field first) means removing pills and re-adding in order. Differs from v1's B (toggle pills) because chips here are insert ACTIONS into a real mixed text flow at a position, not on/off switches over a fixed composed order."
      >
        <VariantFieldPalette />
      </VariantSection>

      <VariantSection
        letter="H"
        title="Slash insert"
        analogy="No visible trigger at all — type / inside the field and an inline menu opens, filtered as you type ('/te' → Term name); Enter drops the top match as a pill at that spot. Analogy: Notion / Fibery / Dovetail slash commands — the insertion point IS the cursor, so the mental model is 'typing', never 'configuring'."
        tradeoff="Fastest for repeat admins (never leave the keyboard, insert exactly where you're typing) and the cleanest resting UI — just a field. Costs discoverability hard: without the helper line no one finds /, so the hint text is load-bearing, and the hand-positioned suggestion panel needs real listbox keyboard nav (arrow keys, aria-activedescendant) before shipping — only Enter/Escape are wired in this prototype."
      >
        <VariantSlashInsert />
      </VariantSection>

      <VariantSection
        letter="I"
        title="Preset formulas + custom escape"
        analogy="Most admins will keep the default, so lead with a Select of three ready-made formulas shown RESOLVED against the real course ('Human Anatomy & Kinesiology – 2026–2027 – EOT Eval'), with the token structure captioned underneath. 'Custom formula…' reveals the inline token field, seeded from the preset you were on. Analogy: date-format preset pickers + Salesforce's pick-a-merge-field-from-a-list flow."
        tradeoff="Cheapest cognitive path for the 90% case — one familiar dropdown, zero token vocabulary until the admin opts into it, and presets double as examples that teach the formula concept. Costs a mode switch: the moment someone wants 'the default but with Term name' they cross from picking into building, and the seeded editor must carry them over without losing work (seeding from the current preset covers this, but it's one more state to get right)."
      >
        <VariantPresetFormulas />
      </VariantSection>
    </div>
  )
}
