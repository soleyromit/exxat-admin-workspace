// Shared helpers for the v2 verification scripts (stage1..5.e2e.mjs, ia.e2e.mjs, shoot.mjs).
// Playwright is NOT installed in the app. It is resolved from /Users/romitsoley/Work/tools/visual-check.
//
// The product has no scenario overview, counters or step cards any more. Presenter controls live in the Demo menu
// (utility bar, top right): Walkthrough, Student phone, Open evaluator link as, Reset demo. Scripts that need to change
// the demo state use the helpers below (role and text selectors only) and read numbers from the saved store.

import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

export const HERE = path.dirname(fileURLToPath(import.meta.url))
export const APP_ROOT = path.resolve(HERE, '../../..')
export const TOOLS = path.resolve(HERE, '../../../../../tools/visual-check')
export const req = createRequire(path.join(TOOLS, 'package.json'))
export const { chromium } = req('playwright')
export const KEY = 'skills-checklist:v2:store'
export const IV = 'sk-iv-cath'
export const SD = 'sk-sterile-dressing'

export function parseBase() {
  const args = process.argv.slice(2)
  return args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3007'
}

/** Check counter. `check(name, ok, seen)` prints PASS or FAIL; `finish()` prints the literal counts and exits. */
export function makeChecker(label) {
  const t = { pass: 0, fail: 0 }
  const check = (name, ok, seen) => {
    if (ok) t.pass++
    else t.fail++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${seen === undefined ? '' : `  (saw: ${typeof seen === 'string' ? seen : JSON.stringify(seen)})`}`)
  }
  const step = (s) => console.log(`\n== ${s}`)
  const abort = (e) => {
    t.fail++
    console.log(`FAIL  flow aborted: ${String(e?.message ?? e).split('\n').slice(0, 3).join(' | ').slice(0, 500)}`)
  }
  const finish = async (browser) => {
    if (browser) await browser.close()
    console.log(`\n${label}: PASS ${t.pass} / FAIL ${t.fail}${t.fail === 0 ? '  ALL CHECKS PASSED' : '  CHECKS FAILED'}`)
    process.exit(t.fail === 0 ? 0 : 1)
  }
  return { check, step, abort, finish, totals: t }
}

/** Launches Chromium, a page, and the common helpers. `viewport` defaults to desktop. */
export async function startSession({ base, viewport = { width: 1440, height: 900 }, permissions, auto = false } = {}) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', ...(permissions ? { permissions } : {}) })
  const page = await ctx.newPage()
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 220)))
  const hydrated = () => page.waitForFunction(() => { const bs = [...document.querySelectorAll('main button')]; return bs.length === 0 || bs.every((b) => Object.keys(b).some((k) => k.startsWith('__reactProps$'))) }, null, { timeout: 20000 }).catch(() => {})
  // Staff roles (admin, reviewer, director) are desktop work, student and evaluator pages are phone work. With `auto` the viewport follows the route.
  // V2_FORCE_DESKTOP=1 runs everything at 1440 px (a diagnostic to separate script logic from a phone-only defect; the real run is without it).
  const PHONE = { width: 390, height: 844 }, DESKTOP = { width: 1440, height: 900 }
  const open = async (route, { settle = 700 } = {}) => {
    if (auto) { const want = process.env.V2_FORCE_DESKTOP === '1' || !/^\/v2\/(student|preceptor)/.test(route) ? DESKTOP : PHONE; const cur = page.viewportSize(); if (!cur || cur.width !== want.width) await page.setViewportSize(want) }
    await page.goto(base + route, { waitUntil: 'load', timeout: 90000 })
    await page.waitForSelector('h1', { timeout: 45000 })
    await hydrated()
    await page.waitForTimeout(settle)
  }
  const reloadPage = async (settle = 800) => { await page.reload({ waitUntil: 'load' }); await page.waitForSelector('h1', { timeout: 45000 }); await hydrated(); await page.waitForTimeout(settle) }
  const store = () => page.evaluate((k) => { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw).state : null }, KEY)
  const putStore = (fn) => page.evaluate(([k, src]) => { const env = JSON.parse(localStorage.getItem(k)); new Function('s', src)(env.state); localStorage.setItem(k, JSON.stringify(env)) }, [KEY, fn])
  const btn = (name, opts = {}) => page.getByRole('button', { name, ...opts })
  const text = () => page.locator('body').innerText()
  const failShot = async (name) => {
    const p = path.join(os.tmpdir(), `${name}-failure.png`)
    await page.screenshot({ path: p }).catch(() => {})
    console.log(`(failure screenshot: ${p})`)
    if (pageErrors.length) console.log(`(uncaught page errors so far: ${JSON.stringify(pageErrors)})`)
  }
  return { browser, ctx, page, pageErrors, open, reloadPage, store, putStore, btn, text, hydrated, failShot }
}

/** Demo menu helpers. The menu is the utility-bar button named "Demo". */
export function demoMenu(page) {
  const trigger = () => page.getByRole('button', { name: 'Demo', exact: true })
  const openMenu = async () => {
    if (await page.getByRole('menu').count()) return
    await trigger().click()
    await page.getByRole('menu').waitFor()
  }
  const closeMenu = async () => { if (await page.getByRole('menu').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(200) } }
  /** Flips a Student phone checkbox to `want` (true or false) when it is not already there. */
  const setPhone = async (label, want = true) => {
    await openMenu()
    const item = page.getByRole('menuitemcheckbox', { name: label })
    const on = (await item.getAttribute('aria-checked')) === 'true'
    if (on !== want) await item.click()
    await closeMenu()
    await page.waitForTimeout(250)
  }
  const clickItem = async (name) => {
    await openMenu()
    await page.getByRole('menuitem', { name }).click()
    await page.waitForTimeout(250)
  }
  /** Reset demo: opens the menu item, confirms, and waits for the success state of the dialog. */
  const reset = async () => {
    await clickItem(/^Reset demo/)
    await page.getByRole('dialog').getByRole('button', { name: 'Reset demo data' }).click()
    await page.getByRole('dialog').getByText('Demo data reset').waitFor()
    await page.getByRole('dialog').locator('button[data-variant="default"]').filter({ hasText: /^(Done|Close)$/ }).click()
    await page.waitForSelector('h1')
    await page.waitForTimeout(800)
  }
  /** Picks a person in "Open evaluator link as" (preceptor role only). `name` matches the radio item text. */
  const openAs = async (name) => {
    await openMenu()
    const sub = page.getByRole('menuitem', { name: /Open evaluator link as/ })
    if (await sub.count()) { await sub.hover(); await page.waitForTimeout(150) }
    await page.getByRole('menuitemradio', { name }).click()
    await page.waitForTimeout(500)
  }
  return { trigger, openMenu, closeMenu, setPhone, clickItem, reset, openAs }
}

export const radio = (page, group, name) => page.getByRole('radiogroup', { name: group }).getByRole('radio', { name, exact: true })

/** Derived numbers the old /v2 counters used to show, computed from the saved store with the same filters as lib/v2/selectors.ts. */
export const derived = {
  withEvaluator: (s) => s.submissions.filter((x) => x.status === 'with-evaluator').length,
  queueWaiting: (s) => s.submissions.filter((x) => x.status === 'awaiting-review').length,
  evalsWaiting: (s) => s.evaluations.filter((e) => e.status === 'awaiting-approval').length,
  syncConflict: (s) => s.syncQueue.filter((i) => i.state === 'conflict').length,
}
