// Verification for the round-5 six-fix polish.
import { chromium } from 'playwright'

const BASE = 'http://localhost:3005'
const OUT = '/tmp/visual-check/interactions'
const report = {}
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1447, height: 900 } })).newPage()
await pg.goto(`${BASE}/results/s1`, { waitUntil: 'domcontentloaded' })
await pg.waitForSelector('#scores')
await pg.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })

// fix 3: exactly one text action + ellipsis
report.headerButtons = await pg.locator('div[role="group"][aria-label="Result actions"] button:visible, div[role="group"][aria-label="Result actions"] a:visible').allTextContents()

// fix 4: scope pills carry photos
report.scopePillImgs = await pg.locator('[aria-label="Scope the results by instructor"] img').count()

// fix 5: no legend DOM; descriptions carry the hint
report.legendGone = (await pg.getByText('middle 50%', { exact: true }).count()) === 0
report.themeHint = (await pg.getByText('click any mark for details').count()) >= 1

// fix 1: program vs course labels diverge on course rows
await pg.getByText('Question breakdown', { exact: true }).first().click()
await pg.waitForTimeout(500)
const pairs = await pg.locator('#questions .relative.h-16').evaluateAll((plots) =>
  plots.map((p) => {
    const prog = p.querySelector('button[aria-label^="Program average"] span')?.textContent ?? null
    const marks = [...p.querySelectorAll('span.font-semibold')].map((s) => s.textContent)
    return { prog, marks }
  }),
)
report.rowsTotal = pairs.length
report.rowsWithProgLabel = pairs.filter((p) => p.prog != null).length
report.rowsProgEqualsOnlyMark = pairs.filter(
  (p) => p.prog != null && p.marks.length === 1 && p.marks[0] === p.prog,
).length
await pg.screenshot({ path: `${OUT}/round6-breakdown.png`, clip: { x: 330, y: 0, width: 1117, height: 900 } })

// fix 2: rail group expanded — screenshot for indent check
await pg.locator('nav[aria-label="On this page"]').getByRole('button', { name: /Show Course evaluation question links/ }).click()
await pg.waitForTimeout(350)
await pg.screenshot({ path: `${OUT}/round6-rail.png`, clip: { x: 1090, y: 0, width: 357, height: 900 } })

// fix 6: written responses sheet — no (0) chips, no uniform per-row badges
const viewAll = pg.getByRole('button', { name: /View all 4/ }).first()
await viewAll.evaluate((el) => el.scrollIntoView({ block: 'center' }))
await pg.waitForTimeout(200)
await viewAll.click()
await pg.waitForTimeout(600)
report.zeroChips = await pg.getByRole('radio', { name: /\(0\)/ }).count() + (await pg.getByText('(0)').count())
report.sheetConstructiveBadges = await pg.locator('[data-slot="sheet-content"], [role="dialog"]').last().getByText('Constructive', { exact: true }).count()
await pg.screenshot({ path: `${OUT}/round6-sheet.png`, clip: { x: 500, y: 0, width: 947, height: 900 } })

console.log(JSON.stringify(report, null, 2))
await b.close()
