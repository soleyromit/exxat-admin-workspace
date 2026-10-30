/**
 * One type scale and no lab labels in product UI (Romit 2026-10-27, on a Configure screenshot: "this hierarchy looks bad, with
 * different text sizes used, too many text again ... this is the problem I am seeing in each page that Sankalp's talking about").
 * Source scans over components/lab/**\/*.tsx:
 * 1. no raw Tailwind size above text-base (text-lg .. text-6xl, responsive prefixes included). Page titles come from the DS
 *    PageHeader (PageFrame), figures from TYPE.figure, section titles from TYPE.section (components/lab/type-scale.ts, the only
 *    place the scale is spelled out). Icon sizing on an <i> element is not text and is skipped.
 * 2. no font-heading (the serif) outside a heading element or a known title component: the serif is the page title's face only.
 * 3. the internal labels "Proposed" and "Decision pending" are not rendered (JSX text or string literal, comments stripped) outside
 *    lab-only components (the lab bar, the lab index, the variant bar, the components drawer).
 * Allow-lists are explicit, each with the file and the reason; TODO entries are files owned by another worker this pass.
 */
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { openingTagAt } from "./source-scan.test"

const ROOT = path.resolve(__dirname, "../../components/lab")

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return walk(p)
    return /\.tsx$/.test(e.name) ? [p] : []
  })
}
const FILES = walk(ROOT).map((p) => ({ rel: path.relative(ROOT, p).split(path.sep).join("/"), src: fs.readFileSync(p, "utf8") }))

/** Strips block comments, JSX comments and line comments (a line comment starts after whitespace or at line start). */
export function stripComments(src: string): string {
  return src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[\s;])\/\/.*$/gm, "$1")
}

const BIG = /(?<![\w-])(?:[a-z0-9]+:)*text-(?:lg|xl|[2-6]xl)(?![\w-])/g

/** Raw sizes above text-base, except on an icon element (<i className="fa-... text-lg">). */
export function bigTextHits(src: string): string[] {
  const code = stripComments(src)
  const out: string[] = []
  for (const m of code.matchAll(BIG)) {
    const t = openingTagAt(code, m.index!)
    if (t && t.tag === "i") continue
    out.push(`${m[0]} in <${t?.tag ?? "?"}>`)
  }
  return out
}

/** Elements and DS components that are headings, where the serif may appear. */
const HEADING_TAGS = /^(h[1-6]|PageHeader|PageFrame|WizardStepHeading|CardTitle|DialogTitle|SheetTitle|DrawerTitle)$/

export function serifHits(src: string): string[] {
  const code = stripComments(src)
  const out: string[] = []
  for (const m of code.matchAll(/(?<![\w-])font-heading(?![\w-])/g)) {
    const t = openingTagAt(code, m.index!)
    if (t && HEADING_TAGS.test(t.tag)) continue
    out.push(`font-heading in <${t?.tag ?? "?"}>`)
  }
  return out
}

const LAB_LABEL = /\b(Proposed|Decision pending)\b/g

export function labLabelHits(src: string): string[] {
  const code = stripComments(src)
  return [...code.matchAll(LAB_LABEL)].map((m) => m[0])
}

/** Lab-only components: lab chrome, never product UI. */
const LAB_ONLY = [/^lab-bar\//, /^lab-index\.tsx$/, /^variant-bar\.tsx$/, /^ds-used-panel\.tsx$/, /^placeholder-screen\.tsx$/]

/**
 * Temporary allow-list, one entry per file, each with a TODO naming the owner (2026-10-27 sweep). Remove the entry when the file
 * is fixed; the test fails on a stale entry so the list cannot rot.
 */
// Configure worker entries removed 2026-10-27: Configure B, import parts, the wizard template and the sentence builder now use
// the scale (section titles TYPE.section, the sentence and inputs at body size).
const ALLOW_BIG: Record<string, string> = {}
const ALLOW_SERIF: Record<string, string> = {}
// Export entries removed 2026-10-30: the OD-10 "Decision pending" badge is gone from Export A (panel) and Export B (anatomy A7).
const ALLOW_LABEL: Record<string, string> = {}

describe("lab typography and lab labels", () => {
  it("negative controls: each scan flags what it bans and passes what it allows", () => {
    expect(bigTextHits('<p className="text-lg font-semibold">a</p>')).toHaveLength(1)
    expect(bigTextHits('<span className="text-sm sm:text-2xl">1</span>')).toHaveLength(1)
    expect(bigTextHits('<i className="fa-light fa-x text-2xl" aria-hidden="true" />')).toHaveLength(0)
    expect(bigTextHits('<p className="text-base text-muted-foreground">a</p>')).toHaveLength(0)
    expect(bigTextHits("{/* text-3xl in a comment */}<p>a</p>")).toHaveLength(0)
    expect(serifHits('<span className="font-heading text-2xl">7</span>')).toHaveLength(1)
    expect(serifHits('<h2 className="font-heading">Title</h2>')).toHaveLength(0)
    expect(labLabelHits('<Badge variant="outline">Proposed</Badge>')).toEqual(["Proposed"])
    expect(labLabelHits("const t = `Decision pending`")).toEqual(["Decision pending"])
    expect(labLabelHits("// Proposed in a comment\nconst x: ProposedSkill = y")).toEqual([])
  })

  it("no raw text size above text-base in components/lab (use the DS page title, TYPE.section or TYPE.figure)", () => {
    const bad = FILES.filter((f) => !ALLOW_BIG[f.rel]).flatMap((f) => bigTextHits(f.src).map((h) => `${f.rel}: ${h}`))
    expect(bad).toEqual([])
  })

  it("no serif (font-heading) outside a heading in components/lab", () => {
    const bad = FILES.filter((f) => !ALLOW_SERIF[f.rel]).flatMap((f) => serifHits(f.src).map((h) => `${f.rel}: ${h}`))
    expect(bad).toEqual([])
  })

  it("no 'Proposed' or 'Decision pending' rendered outside lab-only components", () => {
    const bad = FILES.filter((f) => !LAB_ONLY.some((re) => re.test(f.rel)) && !ALLOW_LABEL[f.rel]).flatMap((f) => labLabelHits(f.src).map((h) => `${f.rel}: ${h}`))
    expect(bad).toEqual([])
  })

  it("every allow-list entry still has a hit (fixed files leave the list)", () => {
    const byRel = new Map(FILES.map((f) => [f.rel, f.src]))
    const stale = [
      ...Object.keys(ALLOW_BIG).filter((r) => !bigTextHits(byRel.get(r) ?? "").length),
      ...Object.keys(ALLOW_SERIF).filter((r) => !serifHits(byRel.get(r) ?? "").length),
      ...Object.keys(ALLOW_LABEL).filter((r) => !labLabelHits(byRel.get(r) ?? "").length),
    ]
    expect(stale).toEqual([])
  })
})
