// Shared helpers for the lab gates (scripts/lab-req-gate.mjs, scripts/lab-fill-check.mjs): Playwright loader, registry readers,
// screen URL builder (same shape as lab-nav-crawl.mjs and tests/lab/density-budget.mjs: /lab/<persona>/<slug>?variant=X&term=Fall%202026),
// a settled page load with clean storage, and a small worker pool.
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
export const ADMIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
export const APP_ROOT = path.resolve(ADMIN_ROOT, "..")
export const TERM = "Fall 2026"

export function chromium() {
  for (const spec of ["playwright", "/Users/romitsoley/Work/tools/visual-check/node_modules/playwright/index.js"]) {
    try { return require(spec).chromium } catch { /* next */ }
  }
  throw new Error("Playwright not found")
}

export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"))
export const screens = () => readJson(path.join(ADMIN_ROOT, "lib/lab/screens.json")).screens
export const flows = () => readJson(path.join(ADMIN_ROOT, "lib/lab/flows.json")).flows

/** /lab/<persona>/<slug>?variant=V&term=Fall%202026&<params> */
export function screenUrl(screenKey, variant, params = {}) {
  const q = new URLSearchParams({ variant, term: TERM, ...params })
  return `/lab/${screenKey}?${q.toString().replace(/\+/g, "%20")}`
}

/** New context with storage cleared once per context (not on every in-context navigation, so setup that navigates keeps state). */
export async function freshPage(browser, viewport) {
  const ctx = await browser.newContext({ viewport })
  await ctx.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("__lab_gate")) { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem("__lab_gate", "1") }
    } catch { /* private mode */ }
  })
  const page = await ctx.newPage()
  return { ctx, page }
}

/** goto + settle: load, main present, no skeleton, transitions frozen. One retry for dev-server recompiles. */
export async function settle(page, base, url) {
  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      try { await page.goto(base + url, { waitUntil: "load", timeout: 240000 }) } catch (e) {
        if (!String(e).includes("ERR_ABORTED")) throw e
        await page.waitForLoadState("load", { timeout: 60000 })
      }
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" }).catch(() => {})
      // Wait for something VISIBLE: `body > div` first matched Next's hidden route-announcer div, and waitForSelector
      // waits for visibility by default, so the old list timed out on every page (fixed 2026-10-30).
      await page.locator("main h1, [data-page-type] h1, main, [data-page-type]").filter({ visible: true }).first()
        .waitFor({ state: "visible", timeout: 60000 })
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
      for (let k = 0; k < 10; k++) {
        if (!(await page.$("main [data-slot=skeleton]"))) break
        await page.waitForTimeout(500)
      }
      await page.waitForTimeout(900)
      return
    } catch (e) { lastErr = e }
  }
  throw lastErr
}

/** Run fn over queue with n concurrent workers. Relaunches the browser if it dies and retries that item once; an item that
 * throws twice is returned as onError(item, err) (default: { item, error }). Progress goes to stderr. */
export async function pool(items, n, fn, onError = (item, e) => ({ ...item, error: String(e?.message ?? e).split("\n")[0] })) {
  const queue = [...items]
  const out = []
  const total = queue.length
  let browser = await chromium().launch()
  let relaunching = null
  const live = async () => {
    if (browser.isConnected()) return browser
    relaunching ??= chromium().launch().then((b) => { browser = b; relaunching = null; return b })
    return relaunching
  }
  await Promise.all(Array.from({ length: n }, async () => {
    for (let it = queue.shift(); it; it = queue.shift()) {
      let res
      for (let attempt = 0; attempt < 2; attempt++) {
        try { res = await fn(it, await live()); break } catch (e) {
          if (attempt === 1) res = onError(it, e)
          else if (/closed|disconnected|crash/i.test(String(e))) await new Promise((r) => setTimeout(r, 1500))
        }
      }
      out.push(res)
      if (process.stderr.isTTY || process.env.LAB_GATE_PROGRESS) process.stderr.write(`\r${out.length}/${total}`)
    }
  }))
  await browser.close().catch(() => {})
  return out
}

export const arg = (args, name, dflt) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : dflt }
