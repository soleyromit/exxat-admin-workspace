#!/usr/bin/env node
/**
 * summarize.mjs — Aggregates axe-core JSON results from run.mjs + interactions.mjs
 * into a markdown report for GitHub Actions step summaries and Teams notifications.
 *
 * Usage:
 *   node tools/visual-check/summarize.mjs [--dir /tmp/visual-check] [--product pce-admin]
 *   node tools/visual-check/summarize.mjs --count-critical    # exit 1 if critical/serious found
 *   node tools/visual-check/summarize.mjs --teams-card        # output Teams MessageCard JSON
 *
 * Output: GitHub-flavored markdown to stdout (pipe to $GITHUB_STEP_SUMMARY)
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const outDir = (() => {
  const i = args.indexOf('--dir')
  return i !== -1 ? args[i + 1] : (process.env.VISUAL_CHECK_OUT_DIR ?? '/tmp/visual-check')
})()
const product = (() => {
  const i = args.indexOf('--product')
  return i !== -1 ? args[i + 1] : (process.env.WCAG_PRODUCT ?? 'unknown')
})()
const countCritical = args.includes('--count-critical')
const teamsCard = args.includes('--teams-card')

// ── Read all axe JSON files ────────────────────────────────────────────────────
// Both run.mjs and interactions.mjs write to the same VISUAL_CHECK_OUT_DIR.
// Static files: <slug>.axe.json  (one dot before .axe.json)
// Interaction files: <slug>.<state>.axe.json  (two dots before .json)

function readAxeFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const results = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Recurse into subdirs (e.g. the legacy /interactions/ subdir)
      results.push(...readAxeFiles(join(dir, entry.name)))
      continue
    }
    if (!entry.name.endsWith('.axe.json')) continue
    const f = entry.name
    const path = join(dir, f)
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'))
      // Detect interaction state from filename: slug.state.axe.json vs slug.axe.json
      const parts = f.replace('.axe.json', '').split('.')
      const isInteraction = parts.length >= 2
      const slugParts = isInteraction ? parts.slice(0, -1) : parts
      const slug = slugParts.join('.')
      const state = isInteraction ? parts[parts.length - 1] : 'default'
      const route = '/' + slug.replace(/__/g, '/').replace(/^root$/, '')
      results.push({
        source: isInteraction ? 'interaction' : 'static',
        state,
        route: route === '//' ? '/' : route,
        slug: f.replace('.axe.json', ''),
        violations: data.violations ?? [],
      })
    } catch {
      // skip unreadable files
    }
  }
  return results
}

const allFiles = readAxeFiles(outDir)

// ── Aggregate violations ───────────────────────────────────────────────────────

const IMPACTS = ['critical', 'serious', 'moderate', 'minor']

const byImpact = { critical: [], serious: [], moderate: [], minor: [] }
const routeMap = {}  // route → { critical, serious, moderate }

for (const file of allFiles) {
  for (const v of file.violations) {
    const impact = v.impact || 'minor'
    if (!byImpact[impact]) continue
    byImpact[impact].push({ ...v, _route: file.slug, _source: file.source })
    if (!routeMap[file.slug]) routeMap[file.slug] = { critical: 0, serious: 0, moderate: 0, minor: 0 }
    routeMap[file.slug][impact] = (routeMap[file.slug][impact] || 0) + 1
  }
}

const totalCritical = byImpact.critical.length
const totalSerious = byImpact.serious.length
const totalModerate = byImpact.moderate.length
const totalBlock = totalCritical + totalSerious

// ── --count-critical mode ─────────────────────────────────────────────────────

if (countCritical) {
  process.stdout.write(String(totalBlock))
  process.exit(totalBlock > 0 ? 1 : 0)
}

// ── Deduplicate violations (same rule ID across routes → count routes) ────────

function dedupeViolations(violations) {
  const map = {}
  for (const v of violations) {
    if (!map[v.id]) map[v.id] = { id: v.id, impact: v.impact, help: v.help, routes: new Set(), nodes: 0 }
    map[v.id].routes.add(v._route)
    map[v.id].nodes += v.nodes?.length ?? 0
  }
  return Object.values(map).sort((a, b) => b.routes.size - a.routes.size)
}

const dedupedCritical = dedupeViolations(byImpact.critical)
const dedupedSerious = dedupeViolations(byImpact.serious)
const dedupedModerate = dedupeViolations(byImpact.moderate)

// ── Teams MessageCard mode ────────────────────────────────────────────────────

if (teamsCard) {
  const status = totalBlock === 0 ? 'PASS' : 'FAIL'
  const color = totalBlock === 0 ? '00C851' : 'FF4444'
  const facts = []

  if (totalBlock === 0) {
    facts.push({ name: 'Result', value: '✅ No critical or serious violations' })
  } else {
    if (totalCritical > 0) facts.push({ name: 'Critical', value: `${totalCritical} violation${totalCritical !== 1 ? 's' : ''}` })
    if (totalSerious > 0) facts.push({ name: 'Serious', value: `${totalSerious} violation${totalSerious !== 1 ? 's' : ''}` })
    if (totalModerate > 0) facts.push({ name: 'Moderate', value: `${totalModerate} violation${totalModerate !== 1 ? 's' : ''}` })
    const topViolations = [...dedupedCritical, ...dedupedSerious].slice(0, 3)
    for (const v of topViolations) {
      facts.push({ name: v.id, value: `${v.help} (${v.routes.size} route${v.routes.size !== 1 ? 's' : ''})` })
    }
  }

  facts.push({ name: 'Routes checked', value: String(new Set(allFiles.map(f => f.route)).size) })
  facts.push({ name: 'Product', value: product })

  const card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: color,
    summary: `WCAG ${status} — ${product}`,
    sections: [{
      activityTitle: `WCAG 2.1 AA Check — ${status}: ${product}`,
      activityText: totalBlock === 0
        ? 'All routes pass. No critical or serious accessibility violations.'
        : `${totalBlock} blocking violation${totalBlock !== 1 ? 's' : ''} found across ${new Set([...byImpact.critical, ...byImpact.serious].map(v => v._route)).size} route${totalBlock !== 1 ? 's' : ''}.`,
      facts,
      markdown: true,
    }],
  }
  process.stdout.write(JSON.stringify(card))
  process.exit(0)
}

// ── Markdown report ───────────────────────────────────────────────────────────

const routeCount = new Set(allFiles.map(f => f.route)).size

const statusEmoji = totalBlock === 0 ? '✅' : '❌'
const statusLine = totalBlock === 0
  ? `No critical or serious violations across ${routeCount} routes.`
  : `**${totalBlock} blocking violation${totalBlock !== 1 ? 's' : ''}** (${totalCritical} critical · ${totalSerious} serious) across ${routeCount} routes.`

let md = `## ${statusEmoji} WCAG 2.1 AA — ${product}\n\n${statusLine}\n\n`

if (totalCritical > 0 || totalSerious > 0) {
  md += `### ❌ Critical + Serious (block ship)\n\n`
  md += `| Rule | Impact | Description | Routes affected |\n`
  md += `|---|---|---|---|\n`
  for (const v of [...dedupedCritical, ...dedupedSerious]) {
    md += `| \`${v.id}\` | **${v.impact}** | ${v.help} | ${v.routes.size} |\n`
  }
  md += '\n'

  md += `<details><summary>Affected routes</summary>\n\n`
  const affectedRoutes = new Set([...byImpact.critical, ...byImpact.serious].map(v => v._route))
  for (const route of [...affectedRoutes].sort()) {
    const counts = routeMap[route] || {}
    md += `- \`${route}\` — critical: ${counts.critical ?? 0}, serious: ${counts.serious ?? 0}\n`
  }
  md += `\n</details>\n\n`
}

if (totalModerate > 0) {
  md += `### ⚠️ Moderate (fix before next sprint)\n\n`
  md += `| Rule | Description | Routes affected |\n`
  md += `|---|---|---|\n`
  const shown = dedupedModerate.slice(0, 8)
  for (const v of shown) {
    md += `| \`${v.id}\` | ${v.help} | ${v.routes.size} |\n`
  }
  if (dedupedModerate.length > 8) {
    md += `| … | *${dedupedModerate.length - 8} more — see artifacts* | |\n`
  }
  md += '\n'
}

md += `### Routes checked (${routeCount})\n\n`
const routeSummary = Object.entries(routeMap)
  .filter(([, c]) => (c.critical ?? 0) + (c.serious ?? 0) + (c.moderate ?? 0) > 0)
  .sort(([, a], [, b]) => (b.critical + b.serious) - (a.critical + a.serious))

if (routeSummary.length > 0) {
  md += `| Route | Critical | Serious | Moderate |\n|---|---|---|---|\n`
  for (const [route, counts] of routeSummary.slice(0, 15)) {
    md += `| \`${route}\` | ${counts.critical ?? 0} | ${counts.serious ?? 0} | ${counts.moderate ?? 0} |\n`
  }
} else {
  md += `All ${routeCount} routes are clean.\n`
}

md += `\n> Run \`node tools/visual-check/run.mjs && node tools/visual-check/interactions.mjs\` locally to reproduce.\n`

process.stdout.write(md)
process.exit(totalBlock > 0 ? 1 : 0)
