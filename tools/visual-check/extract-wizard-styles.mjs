import { chromium } from 'playwright'

const SPEC = 'file:///Users/romitsoley/Downloads/Assessment Creation (offline).html'
const b = await chromium.launch({ headless: true })
const p = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const pg = await p.newPage()
await pg.goto(SPEC, { waitUntil: 'networkidle' })
await pg.waitForTimeout(2000)
await pg.locator('text="Create Assessment"').first().click().catch(() => {})
await pg.waitForTimeout(1200)

const cs = (sel, props) => pg.evaluate(({ sel, props }) => {
  const el = document.querySelector(sel)
  if (!el) return { sel, missing: true }
  const s = getComputedStyle(el)
  const out = { sel }
  for (const pr of props) out[pr] = s.getPropertyValue(pr)
  return out
}, { sel, props })

const box = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'padding', 'border', 'border-radius', 'box-shadow']

// Try a range of likely selectors; report what exists.
const targets = [
  'body',
  'h1', 'h2',
  'input[type="text"], input:not([type])',
  'textarea',
  'button',
]
for (const t of targets) {
  console.log(JSON.stringify(await cs(t, box)))
}

// Dump CSS custom properties on :root (the design tokens)
const vars = await pg.evaluate(() => {
  const s = getComputedStyle(document.documentElement)
  const out = {}
  for (let i = 0; i < s.length; i++) { const n = s[i]; if (n.startsWith('--')) out[n] = s.getPropertyValue(n).trim() }
  return out
})
console.log('ROOT_VARS:', JSON.stringify(vars))
await b.close()
