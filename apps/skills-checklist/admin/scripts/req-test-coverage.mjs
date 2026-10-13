#!/usr/bin/env node
// Test-level requirement coverage (verification review, Pattern C). Unlike docs/build/contracts/_coverage-check.mjs
// (which only checks that a contract's own acceptance-test table mentions each ID), this script reads the REAL test
// files: a requirement ID a contract cites in its "Requirements" section (§5) is covered only if it appears in a test
// name (it/test/describe) or a comment inside the surface's test folders, or in the shared logic tests (store, engine).
// A "tested in S-xx" cross-reference in the contract's §15 is verified against S-xx's own test folders.
// Limit: this proves every cited ID is NAMED by a real test (name or comment) in the right folders; it does not prove the
// assertions are sufficient. The verification reviewer sampled 25 tests for real assertions; keep sampling after changes.
// Usage: pnpm coverage:req          (exit 1 if anything is uncovered and not in scripts/req-test-allowlist.json)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const admin = path.resolve(here, '..')
const contracts = path.resolve(admin, '../docs/build/contracts')
const ID = /\b(SL|IM|SC|CM|ST|EV|AR|RV|SH|RP|AE)-(\d{2})\b/g

const SURFACE_TESTS = {
  'S-01': ['tests/ui/reporting'], 'S-02': ['tests/ui/reporting'], 'S-03': ['tests/ui/reporting'], 'S-17': ['tests/ui/reporting'],
  'S-04': ['tests/ui/library'], 'S-05a': ['tests/ui/library'], 'S-05b': ['tests/ui/library'], 'S-06': ['tests/ui/library'], 'S-07': ['tests/ui/library'],
  'S-08': ['tests/ui/import'], 'S-09': ['tests/ui/configure'], 'S-10': ['tests/ui/mapping'], 'S-11': ['tests/ui/review'],
  'S-12': ['tests/ui/student'], 'S-13': ['tests/ui/student'], 'S-14': ['tests/ui/student'], 'S-15': ['tests/ui/student'],
  'S-16': ['tests/ui/evaluator'], 'S-18': ['tests/ui/evaluator'],
}
const LOGIC = ['tests/store', 'tests/engine', 'tests/copy', 'tests/ui/shells.test.tsx', 'tests/ui/components.test.tsx']

const walk = (p) => {
  const full = path.join(admin, p)
  if (!fs.existsSync(full)) return []
  if (fs.statSync(full).isFile()) return [full]
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(p, e.name)) : /\.(test|spec)\.tsx?$|fixtures\.ts$/.test(e.name) ? [path.join(full, e.name)] : []))
}
const testText = (paths) => {
  const out = []
  for (const f of paths.flatMap(walk)) {
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(/\b(?:it|test|describe)(?:\.\w+)?\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) out.push(m[2])
    for (const m of src.matchAll(/^\s*\/\/(.*)$/gm)) out.push(m[1])
  }
  return out.join('\n')
}
const idsIn = (t) => new Set([...t.matchAll(ID)].map((m) => m[0]))
const section = (txt, n) => {
  const m = txt.match(new RegExp(`^## ${n}\\. .*$`, 'm'))
  if (!m) return ''
  const rest = txt.slice(m.index + m[0].length)
  const e = rest.search(/^## \d+\. /m)
  return e < 0 ? rest : rest.slice(0, e)
}
const allow = fs.existsSync(path.join(here, 'req-test-allowlist.json')) ? JSON.parse(fs.readFileSync(path.join(here, 'req-test-allowlist.json'), 'utf8')) : {}

const logicIds = idsIn(testText(LOGIC))
const own = {}
for (const [s, dirs] of Object.entries(SURFACE_TESTS)) own[s] = idsIn(testText(dirs))

let total = 0
let uncovered = 0
let allowed = 0
for (const f of fs.readdirSync(contracts).filter((x) => /^S-.*\.md$/.test(x)).sort()) {
  const sid = f.match(/^(S-\d+[ab]?)/)[1]
  const t = fs.readFileSync(path.join(contracts, f), 'utf8')
  const req = [...idsIn(section(t, 5))]
  const acc = section(t, 15)
  const miss = []
  for (const id of req) {
    total++
    if (own[sid]?.has(id) || logicIds.has(id)) continue
    // "tested in S-xx" on a line that mentions the id: verify the target surface really has it.
    const refLine = acc.split('\n').find((l) => new RegExp(`\\b${id}\\b`).test(l) && /tested in S-\d+[ab]?/.test(l))
    const target = refLine?.match(/tested in (S-\d+[ab]?)/)?.[1]
    if (target && own[target]?.has(id)) continue
    if (allow[`${sid}:${id}`] || allow[id]) { allowed++; continue }
    miss.push(id + (target ? ` (cross-ref to ${target} has no live test)` : ''))
  }
  uncovered += miss.length
  console.log(`${f.replace('.md', '').padEnd(44)} ids=${String(req.length).padStart(2)} uncovered=${miss.length}${miss.length ? '  -> ' + miss.join(', ') : ''}`)
}
console.log(`TOTAL ids=${total} uncovered=${uncovered} allowlisted=${allowed}`)
process.exit(uncovered ? 1 : 0)
