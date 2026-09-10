import { chromium } from 'playwright'
const OUT = '/private/tmp/claude-501/-Users-romitsoley-Work-apps-pce/3343727a-6d61-4655-95da-8d21cb98987a/scratchpad'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', e => errors.push(e.message))

// Evaluation Rules tab
await p.goto('http://localhost:3005/admin/eval-settings?section=evaluation-rules', { waitUntil: 'domcontentloaded', timeout: 30000 })
await p.waitForTimeout(2000)
await p.screenshot({ path: `${OUT}/01-eval-rules.png`, fullPage: true })

await p.evaluate(() => window.scrollBy(0, 500))
await p.waitForTimeout(300)
await p.screenshot({ path: `${OUT}/02-eval-rules-scroll.png`, fullPage: true })

// type in role search
const searchInput = await p.$('input[aria-label="Search faculty roles"]')
if (searchInput) {
  await searchInput.fill('preceptor')
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/03-search-preceptor.png` })
  await searchInput.fill('zznotfound')
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/04-no-match.png` })
  await searchInput.fill('')
  await p.waitForTimeout(200)
}

// Communication tab
await p.goto('http://localhost:3005/admin/eval-settings?section=communication', { waitUntil: 'domcontentloaded', timeout: 30000 })
await p.waitForTimeout(1500)
await p.screenshot({ path: `${OUT}/05-communication.png`, fullPage: true })

// measure checkbox row heights
const rowHeights = await p.evaluate(() => {
  return Array.from(document.querySelectorAll('label[for^="role-"]'))
    .slice(0, 5)
    .map(el => ({ text: el.textContent?.trim(), height: el.getBoundingClientRect().height }))
})
console.log('Checkbox row heights:', JSON.stringify(rowHeights, null, 2))
console.log('Page errors:', errors.length ? errors : 'none')
await b.close()
