import * as React from "react"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"

let search = new URLSearchParams()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/lab/student/log-skill",
  useSearchParams: () => search,
}))

import { aNoun, capitalize, resetTerms, setTerms, withNoun } from "@/lib/lab/terms"
import { PERSONA_BY_ID } from "@/lib/lab/personas"
import { MARQUEE } from "@/lib/lab/present"
import { LibraryFrame } from "@/components/lab/library/library-chrome"
import { InlineAddTrigger } from "@/components/lab/library/inline-add-row"
import { SkillSheet } from "@/components/lab/library/skill-sheet"
import { StudentRequestA } from "@/components/lab/screens/student-request-a"
import { StudentLogA } from "@/components/lab/screens/student-log-a"
import type { LibraryApi } from "@/components/lab/library/use-library"
import { Table, TableBody } from "@exxatdesignux/ui/components/ui/table"
import { V2StoreProvider } from "@/lib/v2/react"
import { createV2Store } from "@/lib/v2/store"

const wrap = (el: React.ReactElement) => render(<V2StoreProvider store={createV2Store({ storage: null })}>{el}</V2StoreProvider>)

/**
 * Article sweep (2026-10-26): with a program noun such as "EPA" or "competency", copy that hard-codes "a " before the noun
 * reads wrong ("Log a EPA"). Every such place goes through aNoun() (lib/lab/terms.ts); fixed labels written with the default
 * noun (registry titles, the present list) go through withNoun().
 */

afterEach(() => {
  cleanup()
  resetTerms()
  search = new URLSearchParams()
  window.sessionStorage.clear()
})

const NOUNS = [
  { one: "EPA", many: "EPAs", a: "an EPA", A: "An EPA" },
  { one: "competency", many: "competencies", a: "a competency", A: "A competency" },
] as const

const fakeApi = { hydrated: true, demo: "loading", rows: [], counts: { all: 0, notConfigured: 0, configured: 0, published: 0, inactive: 0 }, banner: null, setBanner: () => {} } as unknown as LibraryApi
const BAD = /\b[Aa] (EPA|EPAs)\b|\ban competenc/

describe.each(NOUNS)("with the noun $one", (n) => {
  const use = () => setTerms({ skillNoun: n.one, skillNounPlural: n.many })

  it("nav labels use the right article and the plural", () => {
    use()
    // The student has 3 rows and no "Log" row (LEDGER D-L10); Send for evaluation is the header action.
    expect(PERSONA_BY_ID.student.nav!().map((r) => r.title)).toEqual(["My progress", "My requests", "My evaluations"])
    expect(PERSONA_BY_ID.admin.nav!().find((r) => r.key === "skills")!.title).toBe(capitalize(n.many))
    const all = [...PERSONA_BY_ID.student.nav!(), ...PERSONA_BY_ID.admin.nav!()].map((r) => r.title).join(" | ")
    expect(all).not.toMatch(BAD)
  })

  it("library title and the Add button", () => {
    use()
    render(React.createElement(LibraryFrame, { api: fakeApi, onAdd: () => {} } as React.ComponentProps<typeof LibraryFrame>, null))
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(capitalize(n.many))
    expect(screen.getByRole("button", { name: `Add ${n.a}` })).toBeTruthy()
  })

  it("the inline add row and the add sheet title", () => {
    use()
    // Two renders: the add sheet is modal, so it hides the page behind it from the accessibility tree.
    const row = wrap(<Table><TableBody><InlineAddTrigger category="Assessment" colSpan={3} onOpen={() => {}} /></TableBody></Table>)
    expect(screen.getByRole("button", { name: `Add ${n.a} to Assessment` })).toBeTruthy()
    row.unmount()
    wrap(<SkillSheet open onOpenChange={() => {}} rows={[]} onSave={() => {}} />)
    expect(screen.getByRole("dialog").textContent).toContain(`Add ${n.a}`)
    expect(document.body.textContent).not.toMatch(BAD)
  })

  it("quick entry title and the Send empty state", async () => {
    use()
    search = new URLSearchParams("state=empty")
    const send = wrap(<StudentRequestA />)
    await waitFor(() => expect(send.container.textContent).toContain(`Your program has not set up ${n.many} to send.`))
    expect(screen.getByRole("link", { name: "Back to My progress" })).toBeTruthy()
    expect(send.container.textContent).not.toMatch(BAD)
    send.unmount()
    search = new URLSearchParams()
    const log = wrap(<StudentLogA />)
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(`Log ${n.a}`))
    expect(log.container.textContent).not.toMatch(BAD)
  })

  it("fixed labels (registry titles, present list, fallbacks) follow the noun", () => {
    use()
    expect(withNoun("Add a skill")).toBe(`Add ${n.a}`)
    expect(withNoun("Log a skill")).toBe(`Log ${n.a}`)
    expect(withNoun("A skill is missing")).toBe(`${n.A} is missing`)
    expect(withNoun("Skills library")).toBe(`${capitalize(n.many)} library`)
    expect(withNoun("Skill detail")).toBe(`${capitalize(n.one)} detail`)
    expect(withNoun("Configure a skill")).toBe(`Configure ${n.a}`)
    const labels = MARQUEE.map((m) => withNoun(m.label)).join(" | ")
    expect(labels).toContain(`Add ${n.a}`)
    expect(labels).not.toMatch(BAD)
    expect(capitalize(aNoun())).toBe(n.A)
  })
})

describe("withNoun on the default noun", () => {
  it("leaves the text alone", () => {
    expect(withNoun("Add a skill")).toBe("Add a skill")
    expect(withNoun("Skills library")).toBe("Skills library")
  })
})

describe("source sweep", () => {
  // No template may place a hard-coded article before the program's noun. Comments are skipped.
  const roots = ["lib/lab", "components/lab"].map((r) => join(__dirname, "../..", r))
  const files: string[] = []
  const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) files.push(p) })
  roots.forEach(walk)
  it("finds no 'a ${skillNoun()}' style article in lab copy", () => {
    const hits: string[] = []
    const pattern = /\b[Aa]n? \$\{[^}]*(skillNoun|skillNounPlural|[Nn]oun\b)/
    for (const f of files) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) return
        if (pattern.test(line)) hits.push(`${f.split("/admin/")[1]}:${i + 1}`)
      })
    }
    expect(hits).toEqual([])
  })
  it("never singularises the plural with a regex (competencies is not competencie)", () => {
    const hits = files.filter((f) => /skillNounPlural\(\)\.replace\(\/s\$\//.test(readFileSync(f, "utf8")))
    expect(hits).toEqual([])
  })

  // Naming sweep (CALL 10-26 item 7): the program names the thing (skill, competency, EPA). A literal "skill" or "skills" in
  // user-visible JSX must go through skillNoun() / skillNounPlural() / aNoun() / withNoun() instead. Read with the TypeScript
  // parser, so comments, identifiers and imports never count. What counts as user-visible:
  //   - JSX text;
  //   - a string attribute that people read or hear (label, title, placeholder, description, body, text, hint, heading,
  //     caption, summary, alt, aria-label, scrollLabel, previousLabel ...);
  //   - a string or template part inside a JSX expression that holds a space (copy, not a key such as "skills" or a slug);
  //   - the singular or plural passed as a literal to plural() / pluralize().
  // ALLOW lists the only names that stay fixed whatever the program calls its thing.
  const ALLOW: Array<{ file: string; text: RegExp; why: string }> = [
    { file: "components/lab/evaluator/lab-grid-parts.tsx", text: /^Skills lab$/, why: "the room's name (a skills lab), not the program's noun" },
    { file: "components/lab/lab-index.tsx", text: /^Skills tracking$/, why: "the product's name on the internal lab index" },
  ]
  const VISIBLE_ATTR = /(label|title|placeholder|description|body|text|hint|heading|caption|summary|alt)$/i
  const SKILL = /\bskills?\b/i
  it("finds no literal 'skill' in user-visible JSX outside the allow-list", () => {
    const hits: string[] = []
    for (const f of files.filter((p) => p.endsWith(".tsx"))) {
      const rel = f.split("/admin/")[1]
      const sf = ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const report = (node: ts.Node, text: string) => {
        const clean = text.trim().replace(/\s+/g, " ")
        if (ALLOW.some((a) => a.file === rel && a.text.test(clean))) return
        hits.push(`${rel}:${sf.getLineAndCharacterOfPosition(node.getStart()).line + 1} "${clean.slice(0, 80)}"`)
      }
      const insideJsxExpression = (n: ts.Node) => {
        for (let p = n.parent; p; p = p.parent) {
          if (ts.isJsxExpression(p)) return true
          if (ts.isSourceFile(p)) return false
        }
        return false
      }
      const pluralArg = (n: ts.Node) => ts.isCallExpression(n.parent) && /^(plural|pluralize)$/.test(n.parent.expression.getText(sf)) && n.parent.arguments.some((a) => a === n)
      const visit = (n: ts.Node) => {
        if (ts.isJsxText(n)) {
          if (SKILL.test(n.text)) report(n, n.text)
        } else if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer)) {
          if (VISIBLE_ATTR.test(n.name.getText(sf)) && SKILL.test(n.initializer.text)) report(n, n.initializer.text)
        } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
          if (SKILL.test(n.text) && !ts.isJsxAttribute(n.parent) && !ts.isImportDeclaration(n.parent)) {
            const copy = /\s/.test(n.text.trim()) || /^\s|\s$/.test(n.text)
            if (pluralArg(n) || (copy && insideJsxExpression(n))) report(n, n.text)
          }
        }
        ts.forEachChild(n, visit)
      }
      visit(sf)
    }
    expect(hits).toEqual([])
  })
})
