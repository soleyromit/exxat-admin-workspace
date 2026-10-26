// Pure functions behind scripts/lab-ds-gate.mjs. No I/O except readFileSync in collectUsage, so they are unit tested.
import fs from "node:fs"
import path from "node:path"

const DS_IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+["'](@exxatdesignux\/ui[^"']*)["']/g
const LOCAL_IMPORT = /import\s+(?:type\s+)?(?:\{([^}]*)\}|(\w+))\s+from\s+["']@\/([^"']+)["']/g

/** Named imports from @exxatdesignux/ui*. Only capitalised names are components (hooks and cn are not). */
export function parseDsImports(src) {
  const out = []
  for (const m of src.matchAll(DS_IMPORT)) {
    for (const part of m[1].split(",")) {
      const p = part.trim()
      if (!p || p.startsWith("type ")) continue
      const name = p.split(/\s+as\s+/)[0].trim()
      if (/^[A-Z]/.test(name)) out.push({ name, from: m[2] })
    }
  }
  return out
}

/** Local `@/...` imports with the path they point to. */
export function parseLocalImports(src) {
  const out = []
  for (const m of src.matchAll(LOCAL_IMPORT)) out.push({ spec: m[3], names: (m[1] ?? m[2] ?? "").split(",").map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean) })
  return out
}

export function resolveLocal(root, spec) {
  const base = path.join(root, spec)
  for (const c of [`${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) if (fs.existsSync(c)) return c
  return null
}

/**
 * Components a file uses: its own DS imports (direct) and those of the local files it imports, up to `depth` levels (via).
 * A local import of the vendored chart-card counts as "ChartCard" (it is a vendored pattern, not a package export).
 */
export function collectUsage(file, root, depth = 3, seen = new Set()) {
  const direct = []
  const via = []
  if (seen.has(file)) return { direct, via }
  seen.add(file)
  const src = fs.readFileSync(file, "utf8")
  direct.push(...parseDsImports(src))
  for (const li of parseLocalImports(src)) {
    if (li.spec.startsWith("components/chart-card")) direct.push({ name: "ChartCard", from: "@/components/chart-card (vendored)" })
    if (depth <= 0 || !li.spec.startsWith("components/")) continue
    const f = resolveLocal(root, li.spec)
    if (!f) continue
    const sub = collectUsage(f, root, depth - 1, seen)
    const label = li.spec
    for (const d of [...sub.direct, ...sub.via]) via.push({ name: d.name, from: d.from, via: d.via ?? label })
  }
  return { direct, via }
}

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[\s;,{(])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length))

/** Opening tags of `<Name ...>` with their text and 1-based line. Tracks braces and quotes so `=>` inside props does not end the tag. */
export function openingTags(src, name) {
  const out = []
  const re = new RegExp(`<${name}(?=[\\s/>])`, "g")
  for (const m of src.matchAll(re)) {
    let i = m.index + m[0].length
    let depth = 0
    let q = null
    for (; i < src.length; i++) {
      const c = src[i]
      if (q) { if (c === q && src[i - 1] !== "\\") q = null; continue }
      if (c === '"' || c === "'" || (c === "`" && depth > 0)) { q = c; continue }
      if (c === "{") depth++
      else if (c === "}") depth--
      else if (c === ">" && depth === 0) break
    }
    out.push({ text: src.slice(m.index, i + 1), line: src.slice(0, m.index).split("\n").length })
  }
  return out
}

/** Rule violations in one source file. */
export function scanViolations(rawSrc) {
  const src = stripComments(rawSrc)
  const out = []
  const lineOf = (idx) => src.slice(0, idx).split("\n").length
  const add = (rule, re, msg) => { for (const m of src.matchAll(re)) out.push({ rule, line: lineOf(m.index), message: msg }) }
  add("raw-button", /<button[\s>]/g, "Raw <button>: use the DS Button with variant and size")
  add("raw-table", /<table[\s>]/g, "Raw <table>: use DataTable, or DS Table primitives for a cross-tab")
  add("hex-colour", /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, "Hex colour: use a var(--token)")
  add("rgb-colour", /\brgba?\(/g, "rgb colour: use a var(--token)")
  add("uppercase-tracking", /uppercase\s+tracking-wide/g, "Banned: uppercase tracking-wide")
  add("copy-items", /(["'`])[^"'`\n<>]*(?<![\w-])items(?![\w-])[^"'`\n<>]*\1|(?<!=)>[^<>{}\n]*(?<![\w-])items(?![\w-])[^<>{}\n]*</g, 'The word "items" in copy: say the program noun via lib/lab/terms.ts')
  for (const t of openingTags(src, "Button")) {
    const miss = ["variant", "size"].filter((p) => !new RegExp(`\\b${p}\\s*=`).test(t.text))
    if (miss.length) out.push({ rule: "button-props", line: t.line, message: `Button without explicit ${miss.join(" and ")}` })
  }
  return out
}

/** Shared (non-lab) component folders whose files a lab variant renders, so their markup is the variant's markup. */
export const SHARED_SCAN_PREFIXES = ["components/v2/", "components/skills/"]

/**
 * Files whose violations count for one variant:
 * - the variant file and every lab-owned file it reaches (components/lab/**, transitively);
 * - every shared file (components/v2/**, including components/v2/viz/**, and components/skills/**) imported by any of
 *   those, plus the shared files that shared file imports (transitively one level).
 */
export function scanSetFor(file, root) {
  const scan = new Set([file])
  const lab = [file]
  const seenLab = new Set([file])
  const shared = new Set()
  while (lab.length) {
    const f = lab.pop()
    for (const li of parseLocalImports(fs.readFileSync(f, "utf8"))) {
      const r = resolveLocal(root, li.spec)
      if (!r) continue
      if (li.spec.startsWith("components/lab/") && !seenLab.has(r)) { seenLab.add(r); scan.add(r); lab.push(r) }
      else if (SHARED_SCAN_PREFIXES.some((p) => li.spec.startsWith(p))) shared.add(r)
    }
  }
  for (const s of [...shared]) {
    scan.add(s)
    for (const li of parseLocalImports(fs.readFileSync(s, "utf8"))) {
      if (!SHARED_SCAN_PREFIXES.some((p) => li.spec.startsWith(p))) continue
      const r = resolveLocal(root, li.spec)
      if (r) scan.add(r)
    }
  }
  return [...scan]
}

/** Lab chrome that wraps every variant (not a variant itself) and the shared chart layer the lab may render. */
export const SHARED_ENTRY_FILES = ["components/lab/lab-frame.tsx", "components/lab/lab-index.tsx"]
export const SHARED_SCAN_DIRS = ["components/v2/viz"]

/** Violations in components/v2/viz/** and in the lab chrome plus the shared files it imports. Run once per gate, not per variant. */
export function checkShared(root) {
  const files = new Set()
  for (const d of SHARED_SCAN_DIRS) {
    const dir = path.join(root, d)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) if (/\.tsx?$/.test(f)) files.add(path.join(dir, f))
  }
  for (const e of SHARED_ENTRY_FILES) {
    const f = path.join(root, e)
    if (fs.existsSync(f)) for (const s of scanSetFor(f, root)) files.add(s)
  }
  const violations = []
  for (const f of files) for (const v of scanViolations(fs.readFileSync(f, "utf8"))) violations.push({ ...v, file: path.relative(root, f) })
  return { scanned: [...files].map((f) => path.relative(root, f)).sort(), violations }
}

/**
 * Check one built variant file. `required` is the screen's requiredDsComponents. Returns used/missing components and violations.
 * Violations are scanned in every file of `scanSetFor`: the lab files the variant reaches and the shared v2/skills files they import.
 */
export function checkVariant(file, root, required) {
  const usage = collectUsage(file, root)
  const used = new Set([...usage.direct, ...usage.via].map((d) => d.name))
  const missing = required.filter((r) => !used.has(r))
  const violations = []
  const scanFiles = scanSetFor(file, root)
  for (const f of scanFiles) for (const v of scanViolations(fs.readFileSync(f, "utf8"))) violations.push({ ...v, file: path.relative(root, f) })
  return { used: [...used].sort(), missing, violations, direct: usage.direct, via: usage.via, scanned: scanFiles.map((f) => path.relative(root, f)) }
}
