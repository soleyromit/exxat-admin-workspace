/**
 * The type scale rubric (DS review 2026-10-30 S1, S2, S4, S7, S10; components/lab/type-scale.ts). Source scans over
 * components/lab/**\/*.tsx and the vendored ChartCard:
 * 1. no arbitrary Tailwind text size (text-[10px], text-[0.8rem]): every size is a scale step.
 * 2. a heading (h1-h6, CardTitle, FieldLegend, DialogTitle, SheetTitle, WizardStepHeading) never hand-sets its size with a
 *    literal text-xs / sm / base / lg ... class: it reads TYPE (section 18, card 16, group 14, label 14, meta 12) or keeps the
 *    DS default.
 * 3. nothing renders under 12: no SVG fontSize below 12 and no text-[Npx] below 12.
 * Lab-only chrome (lab bar, lab index, variant bar, components drawer, placeholder) is not product UI and is skipped.
 * The allow-lists are empty and must stay empty; the last test fails on a stale entry.
 */
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { TYPE } from "@/components/lab/type-scale"
import { stripComments } from "./typography.test"

const ROOT = path.resolve(__dirname, "../../components/lab")
const CHART_CARD = path.resolve(__dirname, "../../components/chart-card/index.tsx")

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.tsx$/.test(e.name) ? [p] : []
  })
}
const LAB_ONLY = [/^lab-bar\//, /^lab-index\.tsx$/, /^variant-bar\.tsx$/, /^ds-used-panel\.tsx$/, /^placeholder-screen\.tsx$/]
const FILES = [...walk(ROOT), CHART_CARD]
  .map((p) => ({ rel: path.relative(ROOT, p).split(path.sep).join("/"), src: fs.readFileSync(p, "utf8") }))
  .filter((f) => !LAB_ONLY.some((re) => re.test(f.rel)))

/** Arbitrary text sizes: text-[10px], md:text-[0.8rem]. Colours (text-[var(--x)]) are not sizes. */
export function arbitrarySizeHits(src: string): string[] {
  const code = stripComments(src)
  return [...code.matchAll(/(?<![\w-])(?:[a-z0-9]+:)*text-\[(\d*\.?\d+)(px|rem|em)\]/g)].map((m) => m[0])
}

const HEADING = /<(h[1-6]|CardTitle|FieldLegend|DialogTitle|SheetTitle|WizardStepHeading)\b/g
const LITERAL_SIZE = /(?<![\w:[-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/

/** The opening tag from `start`, ending at the first ">" that is not part of "=>" and not inside braces. */
function tagText(src: string, start: number): string {
  let depth = 0
  for (let i = start; i < src.length; i++) {
    const c = src[i]
    if (c === "{") depth++
    else if (c === "}") depth--
    else if (c === ">" && depth === 0 && src[i - 1] !== "=") return src.slice(start, i + 1)
  }
  return src.slice(start)
}

/** Headings whose string literals carry a raw size class (a TYPE interpolation has no literal size, so it passes). */
export function headingSizeHits(src: string): string[] {
  const code = stripComments(src)
  const out: string[] = []
  for (const m of code.matchAll(HEADING)) {
    const t = tagText(code, m.index!)
    const literals = [...t.matchAll(/"([^"]*)"|`([^`]*)`|'([^']*)'/g)].map((x) => (x[1] ?? x[2] ?? x[3] ?? "").replace(/\$\{[^}]*\}/g, ""))
    const hit = literals.map((l) => l.match(LITERAL_SIZE)?.[0]).find(Boolean)
    if (hit) out.push(`<${m[1]}> ${hit}`)
  }
  return out
}

/** Text under 12px: SVG fontSize={N} / fontSize: N / "Npx" below 12, and text-[Npx] below 12. */
export function underTwelveHits(src: string): string[] {
  const code = stripComments(src)
  const out: string[] = []
  for (const m of code.matchAll(/fontSize(?:=\{|:\s*|=")"?(\d*\.?\d+)(?:px)?/g)) if (Number(m[1]) < 12) out.push(m[0])
  for (const m of code.matchAll(/text-\[(\d*\.?\d+)px\]/g)) if (Number(m[1]) < 12) out.push(m[0])
  return out
}

const ALLOW_ARBITRARY: Record<string, string> = {}
const ALLOW_HEADING: Record<string, string> = {}
const ALLOW_UNDER_12: Record<string, string> = {}

describe("lab type scale rubric", () => {
  it("the scale is the rubric: section 18, card 16, group and label 14, body and helper 14, meta 12, figure 24", () => {
    expect(TYPE.section).toMatch(/\btext-lg\b.*\bfont-semibold\b/)
    expect(TYPE.card).toMatch(/\btext-base\b.*\bfont-semibold\b/)
    expect(TYPE.group).toMatch(/\btext-sm\b.*\bfont-semibold\b/)
    expect(TYPE.label).toMatch(/\btext-sm\b.*\bfont-medium\b/)
    expect(TYPE.body).toMatch(/\btext-sm\b/)
    expect(TYPE.helper).toMatch(/\btext-sm\b.*\btext-muted-foreground\b/)
    expect(TYPE.meta).toMatch(/\btext-xs\b/)
    expect(TYPE.figure).toMatch(/\btext-2xl\b.*\bfont-semibold\b/)
  })

  it("negative controls: each scan flags what it bans and passes what it allows", () => {
    expect(arbitrarySizeHits('<i className="fa-solid fa-check text-[10px]" />')).toEqual(["text-[10px]"])
    expect(arbitrarySizeHits('<p className="text-[var(--x)] text-sm">a</p>')).toEqual([])
    expect(headingSizeHits('<h2 className="text-base font-semibold text-foreground">a</h2>')).toEqual(["<h2> text-base"])
    expect(headingSizeHits('<CardTitle className="flex gap-2 text-sm font-semibold">a</CardTitle>')).toEqual(["<CardTitle> text-sm"])
    expect(headingSizeHits("<h3 className={`flex ${TYPE.group}`}>a</h3>")).toEqual([])
    expect(headingSizeHits('<h2 id={id} className={cn("flex items-baseline gap-2", TYPE.section)}>a</h2>')).toEqual([])
    expect(headingSizeHits('<h2 onClick={() => go()} className="text-sm">a</h2>')).toEqual(["<h2> text-sm"])
    expect(headingSizeHits('<h2 className="sr-only">Skills</h2>')).toEqual([])
    expect(underTwelveHits("<text fontSize={10}>a</text>")).toEqual(["fontSize={10"])
    expect(underTwelveHits("<text style={{ fontSize: 9 }}>a</text>")).toEqual(["fontSize: 9"])
    expect(underTwelveHits("<text fontSize={12}>a</text><text style={{ fontSize: fs }}>b</text>")).toEqual([])
  })

  it("no arbitrary text size (text-[Npx]) in lab product UI", () => {
    const bad = FILES.filter((f) => !ALLOW_ARBITRARY[f.rel]).flatMap((f) => arbitrarySizeHits(f.src).map((h) => `${f.rel}: ${h}`))
    expect(bad).toEqual([])
  })

  it("every lab heading reads its size from TYPE (or the DS default), never a literal size class", () => {
    const bad = FILES.filter((f) => !ALLOW_HEADING[f.rel]).flatMap((f) => headingSizeHits(f.src).map((h) => `${f.rel}: ${h}`))
    expect(bad).toEqual([])
  })

  it("no text under 12px (SVG font sizes, arbitrary sizes)", () => {
    const bad = FILES.filter((f) => !ALLOW_UNDER_12[f.rel]).flatMap((f) => underTwelveHits(f.src).map((h) => `${f.rel}: ${h}`))
    expect(bad).toEqual([])
  })

  it("the allow-lists stay empty", () => {
    expect([...Object.keys(ALLOW_ARBITRARY), ...Object.keys(ALLOW_HEADING), ...Object.keys(ALLOW_UNDER_12)]).toEqual([])
  })
})
