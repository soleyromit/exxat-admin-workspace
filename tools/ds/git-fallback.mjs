#!/usr/bin/env node
/**
 * Fallback resolver for @exxatdesignux/ui (+ @exxatdesignux/product-framework)
 * when the npm registry / org-scoped npm access is unavailable.
 *
 * Points pnpm at the DS source repo directly over git instead of npmjs.org,
 * via pnpm's workspace-root `pnpm.overrides`, scoped per consuming app so
 * unaffected products keep resolving from npm.
 *
 * Full writeup: docs/governance/ds-git-fallback.md — read that before using
 * this in anger. Mechanism verified live 2026-08-13 (see doc for evidence).
 *
 * Usage:
 *   node tools/ds/git-fallback.mjs status
 *   node tools/ds/git-fallback.mjs enable <app-dir|app-name|--all> [--ref <tag|branch|sha>]
 *   node tools/ds/git-fallback.mjs disable <app-dir|app-name|--all>
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ROOT_PKG_PATH = path.join(ROOT, 'package.json')
const WORKSPACE_YAML_PATH = path.join(ROOT, 'pnpm-workspace.yaml')
const DS_GIT_URL = 'https://github.com/ExxatDesign/Exxat-DS-Workspace.git'
const ONLY_BUILT = ['@exxatdesignux/ui', '@exxatdesignux/product-framework']

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n')
}

function discoverApps() {
  const appsDir = path.join(ROOT, 'apps')
  const found = []
  const walk = (dir, depth) => {
    if (depth > 3) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full, depth + 1)
      } else if (entry.name === 'package.json') {
        const pkg = readJson(full)
        if (pkg.dependencies?.['@exxatdesignux/ui']) {
          found.push({
            dir: full,
            relDir: path.relative(ROOT, dir),
            name: pkg.name,
            uiVersion: pkg.dependencies['@exxatdesignux/ui'],
            pfVersion: pkg.dependencies?.['@exxatdesignux/product-framework'] ?? null,
          })
        }
      }
    }
  }
  walk(appsDir, 0)
  return found
}

function resolveRef(explicitRef, uiVersion) {
  if (explicitRef) return explicitRef
  const bare = uiVersion.replace(/^[\^~]/, '')
  const tag = `ui-v${bare}`
  try {
    const out = execFileSync('git', ['ls-remote', '--tags', DS_GIT_URL, `refs/tags/${tag}`], {
      encoding: 'utf8',
    })
    if (out.trim()) {
      console.log(`  → exact tag ${tag} found upstream, pinning to it`)
      return tag
    }
  } catch {
    // network/git failure — fall through to main
  }
  console.warn(
    `  ⚠ no upstream tag "${tag}" for pinned version ${uiVersion} — defaulting to "main" ` +
      `(this WILL be ahead of what the app currently ships; smoke-test before relying on it)`,
  )
  return 'main'
}

function overrideValue(ref, subdir) {
  return `git+${DS_GIT_URL}#${ref}&path:/packages/${subdir}`
}

function ensureOnlyBuiltDependencies() {
  let doc = fs.existsSync(WORKSPACE_YAML_PATH) ? fs.readFileSync(WORKSPACE_YAML_PATH, 'utf8') : ''
  const missing = ONLY_BUILT.filter((name) => !doc.includes(name))
  if (missing.length === 0) return
  if (!doc.includes('onlyBuiltDependencies:')) {
    doc = doc.trimEnd() + '\nonlyBuiltDependencies:\n' + ONLY_BUILT.map((n) => `  - "${n}"`).join('\n') + '\n'
  } else {
    for (const name of missing) {
      doc = doc.replace(/onlyBuiltDependencies:\n/, `onlyBuiltDependencies:\n  - "${name}"\n`)
    }
  }
  fs.writeFileSync(WORKSPACE_YAML_PATH, doc)
  console.log(`  + added ${missing.join(', ')} to onlyBuiltDependencies in pnpm-workspace.yaml`)
}

function matchApp(apps, selector) {
  const bySuffix = apps.find((a) => a.relDir === selector || a.relDir.endsWith('/' + selector))
  if (bySuffix) return bySuffix
  const byName = apps.find((a) => a.name === selector)
  if (byName) return byName
  return null
}

function cmdStatus() {
  const apps = discoverApps()
  const rootPkg = fs.existsSync(ROOT_PKG_PATH) ? readJson(ROOT_PKG_PATH) : {}
  const overrides = rootPkg.pnpm?.overrides ?? {}
  console.log('App                              npm version    fallback')
  console.log('-------------------------------  -------------  ------------------------------')
  for (const app of apps) {
    const key = `${app.name}>@exxatdesignux/ui`
    const active = overrides[key]
    const state = active ? `ON  → ${active.replace(`git+${DS_GIT_URL}#`, '')}` : 'off (npm)'
    console.log(`${app.name.padEnd(33)}  ${app.uiVersion.padEnd(13)}  ${state}`)
  }
  const pf = overrides['@exxatdesignux/product-framework']
  console.log('')
  console.log(
    pf
      ? `@exxatdesignux/product-framework: ON (global) → ${pf.replace(`git+${DS_GIT_URL}#`, '')}`
      : `@exxatdesignux/product-framework: off (npm)`,
  )
}

function cmdEnable(selector, explicitRef) {
  const apps = discoverApps()
  const targets = selector === '--all' ? apps : [matchApp(apps, selector)].filter(Boolean)
  if (targets.length === 0) {
    console.error(`No app matched "${selector}". Known apps:\n` + apps.map((a) => `  ${a.relDir} (${a.name})`).join('\n'))
    process.exit(1)
  }

  ensureOnlyBuiltDependencies()
  const rootPkg = fs.existsSync(ROOT_PKG_PATH) ? readJson(ROOT_PKG_PATH) : { name: 'exxat-admin-workspace', private: true }
  rootPkg.pnpm ??= {}
  rootPkg.pnpm.overrides ??= {}

  let lastRef = null
  for (const app of targets) {
    console.log(`enabling git fallback for ${app.name} (${app.relDir}), pinned npm range ${app.uiVersion}`)
    const ref = resolveRef(explicitRef, app.uiVersion)
    lastRef = ref
    rootPkg.pnpm.overrides[`${app.name}>@exxatdesignux/ui`] = overrideValue(ref, 'ui')
  }
  // product-framework can't be scoped through a two-level chain (pnpm limitation,
  // verified 2026-08-13 — see docs/governance/ds-git-fallback.md) so it's a single
  // global override shared by whichever app was enabled/updated most recently.
  rootPkg.pnpm.overrides['@exxatdesignux/product-framework'] = overrideValue(lastRef, 'product-framework')

  writeJson(ROOT_PKG_PATH, rootPkg)
  console.log('\nroot package.json updated. Now run, per affected app:')
  for (const app of targets) {
    console.log(`  cd ${app.relDir} && pnpm install`)
  }
  console.log(
    '\nNote: @exxatdesignux/product-framework now resolves from git for EVERY app in the workspace ' +
      '(pnpm cannot scope a 2-level override chain) — re-run `pnpm install` in sibling apps too if you ' +
      'want them to pick up the same product-framework build, or leave them until their own install runs.',
  )
}

function cmdDisable(selector) {
  const apps = discoverApps()
  const targets = selector === '--all' ? apps : [matchApp(apps, selector)].filter(Boolean)
  if (targets.length === 0) {
    console.error(`No app matched "${selector}".`)
    process.exit(1)
  }
  const rootPkg = readJson(ROOT_PKG_PATH)
  const overrides = rootPkg.pnpm?.overrides ?? {}
  for (const app of targets) {
    delete overrides[`${app.name}>@exxatdesignux/ui`]
    console.log(`disabled git fallback for ${app.name} — will resolve ${app.uiVersion} from npm again`)
  }
  const anyStillActive = Object.keys(overrides).some((k) => k.endsWith('>@exxatdesignux/ui'))
  if (!anyStillActive) {
    delete overrides['@exxatdesignux/product-framework']
    console.log('no apps left on the fallback — removed the global product-framework override too')
  }
  writeJson(ROOT_PKG_PATH, rootPkg)
  console.log('\nroot package.json updated. Now run, per affected app:')
  for (const app of targets) {
    console.log(`  cd ${app.relDir} && pnpm install`)
  }
}

const [, , cmd, selector, ...rest] = process.argv
const refFlagIdx = rest.indexOf('--ref')
const explicitRef = refFlagIdx >= 0 ? rest[refFlagIdx + 1] : null

if (cmd === 'status') cmdStatus()
else if (cmd === 'enable' && selector) cmdEnable(selector, explicitRef)
else if (cmd === 'disable' && selector) cmdDisable(selector)
else {
  console.log(`Usage:
  node tools/ds/git-fallback.mjs status
  node tools/ds/git-fallback.mjs enable <app-dir|app-name|--all> [--ref <tag|branch|sha>]
  node tools/ds/git-fallback.mjs disable <app-dir|app-name|--all>`)
  process.exit(1)
}
